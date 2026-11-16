using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Common;

/// <summary>Standard envelope for every API response.</summary>
public sealed record ApiResponse<T>(bool Success, string? Message, T? Data, IDictionary<string, string[]>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string? message = null) => new(true, message, data);
}

public static class ApiResponse
{
    public static ApiResponse<object> Fail(string message, IDictionary<string, string[]>? errors = null) =>
        new(false, message, null, errors);
}

public class PageQuery
{
    private int _page = 1;
    private int _pageSize = 20;

    public int Page { get => _page; set => _page = Math.Max(1, value); }
    public int PageSize { get => _pageSize; set => _pageSize = Math.Clamp(value, 1, 100); }
    public string? Search { get; set; }
}

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedAsync<T>(this IQueryable<T> query, PageQuery page, CancellationToken ct)
    {
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page.Page - 1) * page.PageSize).Take(page.PageSize).ToListAsync(ct);
        return new PagedResult<T>(items, page.Page, page.PageSize, total);
    }
}

/// <summary>Business numbers that change per factory. Bound from the "Business" config section.</summary>
public sealed class BusinessSettings
{
    public const string Section = "Business";

    public decimal FreeDeliveryAbove { get; set; } = 499;
    public decimal DeliveryCharge { get; set; } = 40;
    public int MaxEventsPerDay { get; set; } = 3;
}
