namespace IceCream.Domain.Entities;

/// <summary>Written automatically on every insert, update and delete. Not soft deleted.</summary>
public class AuditLog
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? Changes { get; set; }
    public DateTime At { get; set; }
}
