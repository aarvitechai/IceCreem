using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Dashboard;

public sealed record DashboardSummary(
    int TodayOrders, decimal TodayRevenue, decimal MonthRevenue, int PendingOrders, int OutForDelivery,
    int UpcomingBookings, int OpenEnquiries, int LowStockItems, decimal HawkerOutstanding, int Customers);

public sealed record TrendPoint(DateOnly Date, int Orders, decimal Revenue);
public sealed record NamedValue(string Name, decimal Value, int Count);

/// <summary>Numbers for the admin dashboard. Dates use the factory time zone (India, UTC+5:30).</summary>
public sealed class DashboardService(IAppDbContext db, IClock clock)
{
    private static readonly TimeSpan IstOffset = TimeSpan.FromHours(5.5);

    private static readonly OrderStatus[] Open =
        [OrderStatus.Placed, OrderStatus.Confirmed, OrderStatus.InProduction, OrderStatus.Packed];

    private static readonly BookingStatus[] ActiveBookings =
        [BookingStatus.Confirmed, BookingStatus.AdvancePaid, BookingStatus.Scheduled];

    private DateTime UtcStartOf(DateOnly istDate) => istDate.ToDateTime(TimeOnly.MinValue) - IstOffset;

    public async Task<DashboardSummary> SummaryAsync(CancellationToken ct)
    {
        var today = clock.Today;
        var dayStart = UtcStartOf(today);
        var monthStart = UtcStartOf(new DateOnly(today.Year, today.Month, 1));
        var valid = db.Orders.AsNoTracking().Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Returned);

        var todayOrders = await valid.CountAsync(o => o.CreatedAt >= dayStart, ct);
        var todayRevenue = await valid.Where(o => o.CreatedAt >= dayStart).SumAsync(o => (decimal?)o.GrandTotal, ct) ?? 0;
        var monthRevenue = await valid.Where(o => o.CreatedAt >= monthStart).SumAsync(o => (decimal?)o.GrandTotal, ct) ?? 0;
        var pending = await db.Orders.CountAsync(o => Open.Contains(o.Status), ct);
        var outForDelivery = await db.Orders.CountAsync(o => o.Status == OrderStatus.OutForDelivery, ct);
        var upcoming = await db.Bookings.CountAsync(b => ActiveBookings.Contains(b.Status) && b.EventDate >= today && b.EventDate <= today.AddDays(30), ct);
        var enquiries = await db.Bookings.CountAsync(b => b.Status == BookingStatus.Enquiry || b.Status == BookingStatus.Quoted, ct);
        var lowRaw = await db.RawMaterials.CountAsync(m => m.CurrentStock <= m.MinStockLevel, ct);
        var lowFinished = await db.ProductVariants.CountAsync(v => v.IsActive && v.StockQty - v.ReservedQty < 10, ct);
        var outstanding = await db.Hawkers.SumAsync(h => (decimal?)h.OutstandingAmount, ct) ?? 0;
        var customers = await db.Users.CountAsync(u => u.Role == UserRole.Customer, ct);

        return new DashboardSummary(todayOrders, todayRevenue, monthRevenue, pending, outForDelivery,
            upcoming, enquiries, lowRaw + lowFinished, outstanding, customers);
    }

    public async Task<IReadOnlyList<TrendPoint>> SalesTrendAsync(int days, CancellationToken ct)
    {
        days = Math.Clamp(days, 7, 90);
        var firstDay = clock.Today.AddDays(-(days - 1));
        var from = UtcStartOf(firstDay);

        var rows = await db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= from && o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Returned)
            .Select(o => new { o.CreatedAt, o.GrandTotal })
            .ToListAsync(ct);

        var byDay = rows.GroupBy(r => DateOnly.FromDateTime(r.CreatedAt + IstOffset))
            .ToDictionary(g => g.Key, g => (Count: g.Count(), Total: g.Sum(x => x.GrandTotal)));

        return Enumerable.Range(0, days).Select(i => firstDay.AddDays(i))
            .Select(d => byDay.TryGetValue(d, out var v) ? new TrendPoint(d, v.Count, v.Total) : new TrendPoint(d, 0, 0))
            .ToList();
    }

    public async Task<IReadOnlyList<NamedValue>> TopProductsAsync(int limit, CancellationToken ct)
    {
        var since = UtcStartOf(clock.Today.AddDays(-30));
        var rows = await SoldItems(since)
            .GroupBy(i => i.ProductName)
            .Select(g => new { Name = g.Key, Value = g.Sum(i => i.LineTotal), Count = g.Sum(i => i.Quantity) })
            .OrderByDescending(x => x.Value)
            .Take(Math.Clamp(limit, 3, 20))
            .ToListAsync(ct);
        return rows.Select(r => new NamedValue(r.Name, r.Value, r.Count)).ToList();
    }

    public async Task<IReadOnlyList<NamedValue>> CategoryShareAsync(CancellationToken ct)
    {
        var since = UtcStartOf(clock.Today.AddDays(-30));
        var rows = await SoldItems(since)
            .GroupBy(i => i.Variant!.Product!.Category!.Name)
            .Select(g => new { Name = g.Key, Value = g.Sum(i => i.LineTotal), Count = g.Sum(i => i.Quantity) })
            .OrderByDescending(x => x.Value)
            .ToListAsync(ct);
        return rows.Select(r => new NamedValue(r.Name, r.Value, r.Count)).ToList();
    }

    public async Task<IReadOnlyList<NamedValue>> OrderStatusAsync(CancellationToken ct)
    {
        var from = UtcStartOf(clock.Today.AddDays(-30));
        var rows = await db.Orders.AsNoTracking().Where(o => o.CreatedAt >= from)
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count(), Total = g.Sum(o => o.GrandTotal) })
            .ToListAsync(ct);
        return rows.OrderBy(r => r.Status).Select(r => new NamedValue(r.Status.ToString(), r.Total, r.Count)).ToList();
    }

    private IQueryable<Domain.Entities.OrderItem> SoldItems(DateTime since) =>
        db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= since && o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Returned)
            .SelectMany(o => o.Items);
}
