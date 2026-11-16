using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Bookings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IceCream.Api.Controllers;

[Route("api/v1")]
public sealed class BookingsController(BookingService bookings) : ApiControllerBase
{
    [HttpGet("bookings/availability")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AvailabilityDay>>>> Availability(
        [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        Success(await bookings.AvailabilityAsync(year, month, ct));

    /// <summary>Wedding or event enquiry. Guests can send it too; logged in users see it in their account.</summary>
    [HttpPost("bookings")]
    [EnableRateLimiting(RateLimits.Submit)]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Create(BookingRequest req, CancellationToken ct) =>
        Created(await bookings.CreateAsync(req, ct), "Enquiry received. Our team will send a quote soon.");

    [Authorize]
    [HttpGet("me/bookings")]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingDto>>>> Mine([FromQuery] PageQuery page, CancellationToken ct) =>
        Success(await bookings.MineAsync(page, ct));

    [Authorize]
    [HttpGet("bookings/{id:long}")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Get(long id, CancellationToken ct) =>
        Success(await bookings.GetAsync(id, ct));

    [Authorize]
    [HttpPost("bookings/{id:long}/accept-quote")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Accept(long id, CancellationToken ct) =>
        Success(await bookings.AcceptQuoteAsync(id, ct), "Quote accepted. Please pay the advance to lock the date.");
}

[Route("api/v1/admin/bookings")]
[Authorize(Policy = Policies.Admin)]
public sealed class AdminBookingsController(BookingService bookings) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingDto>>>> List([FromQuery] BookingQuery q, CancellationToken ct) =>
        Success(await bookings.ListAsync(q, ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Get(long id, CancellationToken ct) =>
        Success(await bookings.GetAsync(id, ct));

    [HttpPost("{id:long}/quote")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Quote(long id, QuoteRequest req, CancellationToken ct) =>
        Success(await bookings.QuoteAsync(id, req, ct), "Quote sent.");

    [HttpPost("{id:long}/payments")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Payment(long id, PaymentRequest req, CancellationToken ct) =>
        Success(await bookings.RecordPaymentAsync(id, req.Amount, ct), "Payment recorded.");

    [HttpPatch("{id:long}/status")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> Status(long id, BookingStatusRequest req, CancellationToken ct) =>
        Success(await bookings.ChangeStatusAsync(id, req.Status, ct), "Status updated.");
}
