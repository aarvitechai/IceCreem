using System.Text.Json;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace IceCream.Infrastructure.Persistence;

/// <summary>
/// Fills audit columns, turns deletes into soft deletes and writes AuditLogs rows.
/// </summary>
public sealed class AuditInterceptor(ICurrentUser currentUser, IClock clock) : SaveChangesInterceptor
{
    private static readonly HashSet<string> IgnoredProps =
        [nameof(BaseEntity.UpdatedAt), nameof(BaseEntity.UpdatedBy), nameof(User.LastLoginAt),
         nameof(User.FailedLoginCount), nameof(User.LockoutEnd)];

    private static readonly HashSet<string> SecretProps = [nameof(User.PasswordHash), nameof(RefreshToken.TokenHash)];

    private readonly List<(EntityEntry Entry, AuditLog Log)> _pending = [];
    private bool _writingLogs;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        if (eventData.Context is not null && !_writingLogs) Prepare(eventData.Context);
        return base.SavingChangesAsync(eventData, result, ct);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken ct = default)
    {
        if (eventData.Context is null || _writingLogs || _pending.Count == 0)
            return await base.SavedChangesAsync(eventData, result, ct);

        foreach (var (entry, log) in _pending)
            log.EntityId = entry.Property(nameof(BaseEntity.Id)).CurrentValue?.ToString() ?? string.Empty;

        eventData.Context.Set<AuditLog>().AddRange(_pending.Select(p => p.Log));
        _pending.Clear();

        _writingLogs = true;
        try { await eventData.Context.SaveChangesAsync(ct); }
        finally { _writingLogs = false; }

        return await base.SavedChangesAsync(eventData, result, ct);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result) =>
        throw new NotSupportedException("Use SaveChangesAsync.");

    private void Prepare(DbContext context)
    {
        var now = clock.UtcNow;
        var userId = currentUser.UserId;

        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>().ToList())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy ??= userId;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;
                default:
                    continue;
            }

            var log = BuildLog(entry, userId, now);
            if (log is not null) _pending.Add((entry, log));
        }
    }

    private static AuditLog? BuildLog(EntityEntry<BaseEntity> entry, long? userId, DateTime now)
    {
        if (entry.Entity is RefreshToken) return null;

        var action = entry.State == EntityState.Added ? "Create" : entry.Entity.IsDeleted ? "Delete" : "Update";
        var changes = new Dictionary<string, object?>();

        foreach (var p in entry.Properties)
        {
            var name = p.Metadata.Name;
            if (IgnoredProps.Contains(name) || name is nameof(BaseEntity.CreatedAt) or nameof(BaseEntity.CreatedBy)) continue;
            if (entry.State == EntityState.Modified && !p.IsModified) continue;
            if (entry.State == EntityState.Added && p.CurrentValue is null) continue;

            changes[name] = SecretProps.Contains(name) ? "***" : p.CurrentValue;
        }

        if (changes.Count == 0) return null;

        return new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityName = entry.Metadata.ClrType.Name,
            Changes = JsonSerializer.Serialize(changes),
            At = now
        };
    }
}
