using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Dashboard;
using IceCream.Application.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IceCream.Api.Controllers;

[Route("api/v1/dashboard/admin")]
[Authorize(Policy = Policies.Staff)]
public sealed class DashboardController(DashboardService dashboard) : ApiControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummary>>> Summary(CancellationToken ct) =>
        Success(await dashboard.SummaryAsync(ct));

    [HttpGet("sales-trend")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TrendPoint>>>> Trend([FromQuery] int days = 30, CancellationToken ct = default) =>
        Success(await dashboard.SalesTrendAsync(days, ct));

    [HttpGet("top-products")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NamedValue>>>> TopProducts([FromQuery] int limit = 5, CancellationToken ct = default) =>
        Success(await dashboard.TopProductsAsync(limit, ct));

    [HttpGet("category-share")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NamedValue>>>> CategoryShare(CancellationToken ct) =>
        Success(await dashboard.CategoryShareAsync(ct));

    [HttpGet("analytics")]
    public async Task<ActionResult<ApiResponse<AnalyticsReport>>> Analytics([FromQuery] int days = 30, CancellationToken ct = default) =>
        Success(await dashboard.AnalyticsAsync(days, ct));

    [HttpGet("order-status")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NamedValue>>>> OrderStatus(CancellationToken ct) =>
        Success(await dashboard.OrderStatusAsync(ct));
}

[Route("api/v1/superadmin")]
[Authorize(Policy = Policies.SuperAdmin)]
public sealed class SuperAdminController(UserAdminService users) : ApiControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<PagedResult<UserRow>>>> Users([FromQuery] UserQuery q, CancellationToken ct) =>
        Success(await users.ListAsync(q, ct));

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<long>>> Create(CreateUserRequest req, CancellationToken ct) =>
        Created(await users.CreateAsync(req, ct), "User created.");

    [HttpPut("users/{id:long}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(long id, UpdateUserRequest req, CancellationToken ct)
    {
        await users.UpdateAsync(id, req, ct);
        return Success(true, "User updated.");
    }

    [HttpPost("users/{id:long}/reset-password")]
    public async Task<ActionResult<ApiResponse<bool>>> Reset(long id, ResetPasswordRequest req, CancellationToken ct)
    {
        await users.ResetPasswordAsync(id, req.Password, ct);
        return Success(true, "Password reset. User must log in again.");
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditRow>>>> Audit([FromQuery] AuditQuery q, CancellationToken ct) =>
        Success(await users.AuditAsync(q, ct));
}
