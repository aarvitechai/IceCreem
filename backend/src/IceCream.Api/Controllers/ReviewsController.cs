using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Reviews;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IceCream.Api.Controllers;

[Route("api/v1/reviews")]
public sealed class ReviewsController(ReviewService reviews) : ApiControllerBase
{
    /// <summary>Approved reviews with the star summary.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PublicReviewPage>>> List([FromQuery] PageQuery page, CancellationToken ct) =>
        Success(await reviews.PublicAsync(page, ct));

    /// <summary>Anyone can send a review. It shows on the site after an admin approves it.</summary>
    [HttpPost]
    [EnableRateLimiting(RateLimits.Submit)]
    public async Task<ActionResult<ApiResponse<bool>>> Submit(ReviewRequest req, CancellationToken ct)
    {
        await reviews.SubmitAsync(req, ct);
        return Created(true, "Thank you! Your review will appear after a quick check.");
    }
}

[Route("api/v1/admin/reviews")]
[Authorize(Policy = Policies.Admin)]
public sealed class AdminReviewsController(ReviewService reviews) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminReviewDto>>>> List([FromQuery] ReviewQuery q, CancellationToken ct) =>
        Success(await reviews.AdminListAsync(q, ct));

    [HttpPatch("{id:long}")]
    public async Task<ActionResult<ApiResponse<AdminReviewDto>>> Moderate(long id, ModerateReviewRequest req, CancellationToken ct) =>
        Success(await reviews.ModerateAsync(id, req, ct), "Review updated.");

    [HttpDelete("{id:long}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(long id, CancellationToken ct)
    {
        await reviews.DeleteAsync(id, ct);
        return Success(true, "Review deleted.");
    }
}
