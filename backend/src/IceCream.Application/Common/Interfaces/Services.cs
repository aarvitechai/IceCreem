using IceCream.Domain.Entities;
using IceCream.Domain.Enums;

namespace IceCream.Application.Common.Interfaces;

public interface ICurrentUser
{
    long? UserId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated => UserId.HasValue;
    bool IsStaffOrAbove => Role is UserRole.SuperAdmin or UserRole.Admin or UserRole.Staff;
    string? IpAddress { get; }
}

public interface IClock
{
    DateTime UtcNow { get; }

    /// <summary>Business date in the factory time zone (India).</summary>
    DateOnly Today { get; }
}

public interface IPasswordService
{
    string Hash(User user, string password);
    bool Verify(User user, string password);
}

public record AccessToken(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    AccessToken CreateAccessToken(User user);

    /// <summary>Returns the raw token for the client and its hash for the database.</summary>
    (string Raw, string Hash) CreateRefreshToken();

    string HashRefreshToken(string raw);
    TimeSpan RefreshTokenLifetime { get; }
}

public interface IFileStorage
{
    /// <summary>Saves the file and returns its public URL.</summary>
    Task<string> SaveAsync(Stream content, string fileName, string folder, CancellationToken ct);
}

/// <summary>Pushes live updates to browsers (SignalR in Infrastructure/API).</summary>
public interface IRealtimeNotifier
{
    Task OrderCreated(string orderNumber, decimal total, CancellationToken ct = default);
    Task OrderStatusChanged(string orderNumber, OrderStatus status, CancellationToken ct = default);
    Task LocationUpdated(string orderNumber, double latitude, double longitude, CancellationToken ct = default);
}
