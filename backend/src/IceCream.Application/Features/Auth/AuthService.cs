using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Auth;

public sealed record RegisterRequest(string FullName, string Email, string Mobile, string Password);
public sealed record LoginRequest(string Login, string Password);
public sealed record UserDto(long Id, string FullName, string Email, string Mobile, UserRole Role);
public sealed record AuthResult(string AccessToken, DateTime ExpiresAt, UserDto User);

/// <summary>Auth result plus the raw refresh token. The API puts the token in an httpOnly cookie.</summary>
public sealed record AuthSession(AuthResult Result, string RefreshToken, DateTime RefreshExpiresAt);

public sealed class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(160);
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10 digit mobile number.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(100)
            .Matches("[A-Z]").WithMessage("Password needs one capital letter.")
            .Matches("[0-9]").WithMessage("Password needs one number.");
    }
}

public sealed class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Login).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(100);
    }
}

public sealed class AuthService(
    IAppDbContext db, IPasswordService passwords, ITokenService tokens, IClock clock, ICurrentUser currentUser)
{
    public async Task<AuthSession> RegisterAsync(RegisterRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email || u.Mobile == req.Mobile, ct))
            throw new ConflictException("An account with this email or mobile already exists.");

        var user = new User { FullName = req.FullName.Trim(), Email = email, Mobile = req.Mobile, Role = UserRole.Customer };
        user.PasswordHash = passwords.Hash(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return await IssueSessionAsync(user, ct);
    }

    public async Task<AuthSession> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var login = req.Login.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == login || u.Mobile == login, ct);
        var now = clock.UtcNow;

        if (user is null || !user.IsActive) throw new UnauthorizedException();
        if (user.IsLockedOut(now))
            throw new UnauthorizedException("Account is locked for a few minutes after many failed attempts.");

        if (!passwords.Verify(user, req.Password))
        {
            user.RegisterFailedLogin(now);
            await db.SaveChangesAsync(ct);
            throw new UnauthorizedException();
        }

        user.RegisterSuccessfulLogin(now);
        return await IssueSessionAsync(user, ct);
    }

    /// <summary>Rotates the refresh token. A reused (revoked) token revokes every session of that user.</summary>
    public async Task<AuthSession> RefreshAsync(string? rawToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawToken)) throw new UnauthorizedException("Session expired.");

        var hash = tokens.HashRefreshToken(rawToken);
        var token = await db.RefreshTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        var now = clock.UtcNow;

        if (token?.User is null) throw new UnauthorizedException("Session expired.");

        if (token.RevokedAt is not null)
        {
            var active = await db.RefreshTokens.Where(t => t.UserId == token.UserId && t.RevokedAt == null).ToListAsync(ct);
            active.ForEach(t => t.RevokedAt = now);
            await db.SaveChangesAsync(ct);
            throw new UnauthorizedException("Session expired.");
        }

        if (!token.IsActive(now) || !token.User.IsActive) throw new UnauthorizedException("Session expired.");

        token.RevokedAt = now;
        return await IssueSessionAsync(token.User, ct);
    }

    public async Task LogoutAsync(string? rawToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawToken)) return;
        var hash = tokens.HashRefreshToken(rawToken);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is null || token.RevokedAt is not null) return;

        token.RevokedAt = clock.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> MeAsync(CancellationToken ct)
    {
        var id = currentUser.UserId ?? throw new UnauthorizedException();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw new NotFoundException("User", id);
        return ToDto(user);
    }

    public static UserDto ToDto(User u) => new(u.Id, u.FullName, u.Email, u.Mobile, u.Role);

    private async Task<AuthSession> IssueSessionAsync(User user, CancellationToken ct)
    {
        var (raw, hash) = tokens.CreateRefreshToken();
        var expires = clock.UtcNow.Add(tokens.RefreshTokenLifetime);
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, TokenHash = hash, ExpiresAt = expires, CreatedByIp = currentUser.IpAddress
        });
        await db.SaveChangesAsync(ct);

        var access = tokens.CreateAccessToken(user);
        return new AuthSession(new AuthResult(access.Token, access.ExpiresAt, ToDto(user)), raw, expires);
    }
}
