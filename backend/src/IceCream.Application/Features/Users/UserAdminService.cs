using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Users;

public sealed record UserRow(long Id, string FullName, string Email, string Mobile, UserRole Role, bool IsActive, DateTime? LastLoginAt, DateTime CreatedAt);
public sealed record CreateUserRequest(string FullName, string Email, string Mobile, UserRole Role, string Password);
public sealed record UpdateUserRequest(string FullName, UserRole Role, bool IsActive);
public sealed record ResetPasswordRequest(string Password);
public sealed record AuditRow(long Id, long? UserId, string? UserName, string Action, string EntityName, string EntityId, string? Changes, DateTime At);

public sealed class UserQuery : PageQuery
{
    public UserRole? Role { get; set; }
}

public sealed class AuditQuery : PageQuery
{
    public string? Entity { get; set; }
}

public sealed class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(160);
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10 digit mobile number.");
        RuleFor(x => x.Role).IsInEnum();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).Matches("[A-Z]").Matches("[0-9]")
            .WithMessage("Password needs 8 characters, one capital letter and one number.");
    }
}

public sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordValidator() =>
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).Matches("[A-Z]").Matches("[0-9]")
            .WithMessage("Password needs 8 characters, one capital letter and one number.");
}

/// <summary>Super admin control over users and the audit trail.</summary>
public sealed class UserAdminService(IAppDbContext db, IPasswordService passwords, ICurrentUser currentUser)
{
    public async Task<PagedResult<UserRow>> ListAsync(UserQuery q, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking();
        if (q.Role.HasValue) query = query.Where(u => u.Role == q.Role);
        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(u => u.FullName.Contains(q.Search) || u.Email.Contains(q.Search) || u.Mobile.Contains(q.Search));

        return await query.OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .Select(u => new UserRow(u.Id, u.FullName, u.Email, u.Mobile, u.Role, u.IsActive, u.LastLoginAt, u.CreatedAt))
            .ToPagedAsync(q, ct);
    }

    public async Task<long> CreateAsync(CreateUserRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email || u.Mobile == req.Mobile, ct))
            throw new ConflictException("Email or mobile is already used.");

        var user = new User { FullName = req.FullName.Trim(), Email = email, Mobile = req.Mobile, Role = req.Role };
        user.PasswordHash = passwords.Hash(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user.Id;
    }

    public async Task UpdateAsync(long id, UpdateUserRequest req, CancellationToken ct)
    {
        if (id == currentUser.UserId && (!req.IsActive || req.Role != UserRole.SuperAdmin))
            throw new DomainException("You cannot remove your own super admin access.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw new NotFoundException("User", id);
        user.FullName = req.FullName.Trim();
        user.Role = req.Role;
        user.IsActive = req.IsActive;
        if (!req.IsActive) await RevokeSessionsAsync(id, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task ResetPasswordAsync(long id, string password, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw new NotFoundException("User", id);
        user.PasswordHash = passwords.Hash(user, password);
        user.FailedLoginCount = 0;
        user.LockoutEnd = null;
        await RevokeSessionsAsync(id, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AuditRow>> AuditAsync(AuditQuery q, CancellationToken ct)
    {
        var query = db.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q.Entity)) query = query.Where(a => a.EntityName == q.Entity);
        if (!string.IsNullOrWhiteSpace(q.Search)) query = query.Where(a => a.EntityId == q.Search || a.Action == q.Search);

        return await query.OrderByDescending(a => a.Id)
            .Select(a => new AuditRow(a.Id, a.UserId,
                db.Users.Where(u => u.Id == a.UserId).Select(u => u.FullName).FirstOrDefault(),
                a.Action, a.EntityName, a.EntityId, a.Changes, a.At))
            .ToPagedAsync(q, ct);
    }

    private async Task RevokeSessionsAsync(long userId, CancellationToken ct)
    {
        var tokens = await db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(ct);
        var now = DateTime.UtcNow;
        tokens.ForEach(t => t.RevokedAt = now);
    }
}
