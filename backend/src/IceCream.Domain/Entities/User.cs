using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

public class User : BaseEntity
{
    public const int MaxFailedLogins = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEnd { get; set; }

    public List<RefreshToken> RefreshTokens { get; set; } = [];

    public bool IsLockedOut(DateTime now) => LockoutEnd.HasValue && LockoutEnd.Value > now;

    public void RegisterFailedLogin(DateTime now)
    {
        FailedLoginCount++;
        if (FailedLoginCount >= MaxFailedLogins)
        {
            LockoutEnd = now.Add(LockoutDuration);
            FailedLoginCount = 0;
        }
    }

    public void RegisterSuccessfulLogin(DateTime now)
    {
        FailedLoginCount = 0;
        LockoutEnd = null;
        LastLoginAt = now;
    }
}

public class RefreshToken : BaseEntity
{
    public long UserId { get; set; }
    public User? User { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? CreatedByIp { get; set; }

    public bool IsActive(DateTime now) => RevokedAt is null && ExpiresAt > now;
}
