using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IceCream.Api.Controllers;

[Route("api/v1")]
public sealed class OrdersController(OrderService orders) : ApiControllerBase
{
    [HttpPost("checkout/summary")]
    public async Task<ActionResult<ApiResponse<CheckoutSummary>>> Summary(CheckoutRequest req, CancellationToken ct) =>
        Success(await orders.SummaryAsync(req, ct));

    /// <summary>Guest or logged in customer places an order.</summary>
    [HttpPost("orders")]
    [EnableRateLimiting(RateLimits.Auth)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Place(PlaceOrderRequest req, CancellationToken ct) =>
        Created(await orders.PlaceAsync(req, ct), "Order placed.");

    [HttpGet("orders/track/{orderNumber}")]
    [EnableRateLimiting(RateLimits.Auth)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Track(string orderNumber, [FromQuery] string mobile, CancellationToken ct) =>
        Success(await orders.TrackAsync(orderNumber, mobile, ct));

    [Authorize]
    [HttpGet("me/orders")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderRow>>>> Mine([FromQuery] PageQuery page, CancellationToken ct) =>
        Success(await orders.MyOrdersAsync(page, ct));

    [Authorize]
    [HttpGet("orders/{id:long}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Get(long id, CancellationToken ct) =>
        Success(await orders.GetAsync(id, ct));

    [Authorize]
    [HttpPost("orders/{id:long}/cancel")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Cancel(long id, CancelRequest req, CancellationToken ct) =>
        Success(await orders.CancelAsync(id, req.Reason, ct), "Order cancelled.");
}

[Route("api/v1/admin")]
[Authorize(Policy = Policies.Staff)]
public sealed class AdminOrdersController(OrderService orders, CouponService coupons) : ApiControllerBase
{
    [HttpGet("orders")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderRow>>>> List([FromQuery] OrderQuery q, CancellationToken ct) =>
        Success(await orders.ListAsync(q, ct));

    [HttpGet("orders/{id:long}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Get(long id, CancellationToken ct) =>
        Success(await orders.GetAsync(id, ct));

    [HttpPatch("orders/{id:long}/status")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Status(long id, ChangeStatusRequest req, CancellationToken ct) =>
        Success(await orders.ChangeStatusAsync(id, req, ct), "Status updated.");

    [HttpPost("orders/{id:long}/assign-delivery")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Assign(long id, AssignDeliveryRequest req, CancellationToken ct) =>
        Success(await orders.AssignDeliveryAsync(id, req.PartnerId, ct), "Delivery partner assigned.");

    [HttpGet("delivery-partners")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDtoLite>>>> Partners(CancellationToken ct) =>
        Success(await orders.DeliveryPartnersAsync(ct));

    [HttpGet("coupons")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CouponDto>>>> Coupons(CancellationToken ct) =>
        Success(await coupons.ListAsync(ct));

    [HttpPost("coupons")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<long>>> CreateCoupon(SaveCouponRequest req, CancellationToken ct) =>
        Created(await coupons.SaveAsync(null, req, ct));

    [HttpPut("coupons/{id:long}")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<long>>> UpdateCoupon(long id, SaveCouponRequest req, CancellationToken ct) =>
        Success(await coupons.SaveAsync(id, req, ct));

    [HttpDelete("coupons/{id:long}")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCoupon(long id, CancellationToken ct)
    {
        await coupons.DeleteAsync(id, ct);
        return Success(true);
    }
}

[Route("api/v1/delivery")]
[Authorize(Policy = Policies.Delivery)]
public sealed class DeliveryController(OrderService orders) : ApiControllerBase
{
    [HttpGet("me/tasks")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> Tasks(CancellationToken ct) =>
        Success(await orders.MyDeliveriesAsync(ct));

    [HttpPatch("{orderId:long}/status")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Status(long orderId, DeliveryStatusRequest req, CancellationToken ct) =>
        Success(await orders.DeliveryUpdateAsync(orderId, req, ct));

    [HttpPost("{orderId:long}/location")]
    public async Task<ActionResult<ApiResponse<bool>>> Location(long orderId, LocationRequest req, CancellationToken ct)
    {
        await orders.UpdateLocationAsync(orderId, req, ct);
        return Success(true);
    }
}
