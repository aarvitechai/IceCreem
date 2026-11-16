using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Reviews;

/// <param name="Website">Hidden field on the form. People leave it empty; spam bots fill it in.</param>
public sealed record ReviewRequest(string CustomerName, string? City, string? Mobile, string Occasion, int Rating, string Comment, string? Website);

/// <summary>What the public page sees: no mobile number, no status.</summary>
public sealed record PublicReviewDto(long Id, string CustomerName, string? City, string Occasion, int Rating, string Comment, bool IsFeatured, DateTime ApprovedAt);

public sealed record ReviewSummary(int Count, decimal Average, IReadOnlyList<int> Stars);

public sealed record PublicReviewPage(ReviewSummary Summary, PagedResult<PublicReviewDto> Reviews);

public sealed record AdminReviewDto(
    long Id, string CustomerName, string? City, string? Mobile, string Occasion, int Rating, string Comment,
    ReviewStatus Status, bool IsFeatured, DateTime CreatedAt, DateTime? ApprovedAt);

public sealed record ModerateReviewRequest(ReviewStatus Status, bool IsFeatured);

public sealed class ReviewQuery : PageQuery
{
    public ReviewStatus? Status { get; set; }
}

public sealed class ReviewRequestValidator : AbstractValidator<ReviewRequest>
{
    public static readonly string[] Occasions =
        ["Home delivery", "Wedding", "Birthday", "Anniversary", "Corporate", "Festival", "Other event", "Hawker cart"];

    public ReviewRequestValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.City).MaximumLength(80);
        RuleFor(x => x.Mobile).Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10 digit mobile number.")
            .When(x => !string.IsNullOrWhiteSpace(x.Mobile));
        RuleFor(x => x.Occasion).Must(o => Occasions.Contains(o)).WithMessage("Pick what your review is about.");
        RuleFor(x => x.Rating).InclusiveBetween(Review.MinRating, Review.MaxRating);
        RuleFor(x => x.Comment).NotEmpty().MinimumLength(10).WithMessage("Please write at least 10 characters.").MaximumLength(1000);
    }
}

public sealed class ModerateReviewRequestValidator : AbstractValidator<ModerateReviewRequest>
{
    public ModerateReviewRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.IsFeatured).Equal(false).When(x => x.Status != ReviewStatus.Approved)
            .WithMessage("Only approved reviews can be featured.");
    }
}

/// <summary>Customer reviews: anyone can send one, admins approve before it goes public.</summary>
public sealed class ReviewService(IAppDbContext db, ICurrentUser currentUser, IClock clock)
{
    public async Task SubmitAsync(ReviewRequest req, CancellationToken ct)
    {
        // Quietly accept and drop bot posts, so bots get no signal to retry.
        if (!string.IsNullOrWhiteSpace(req.Website)) return;

        var review = new Review
        {
            UserId = currentUser.UserId,
            CustomerName = req.CustomerName.Trim(),
            City = string.IsNullOrWhiteSpace(req.City) ? null : req.City.Trim(),
            Mobile = string.IsNullOrWhiteSpace(req.Mobile) ? null : req.Mobile.Trim(),
            Occasion = req.Occasion,
            Comment = req.Comment.Trim(),
        };
        review.SetRating(req.Rating);
        db.Reviews.Add(review);
        await db.SaveChangesAsync(ct);
    }

    public async Task<PublicReviewPage> PublicAsync(PageQuery page, CancellationToken ct)
    {
        var approved = db.Reviews.AsNoTracking().Where(r => r.Status == ReviewStatus.Approved);

        var counts = await approved.GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var total = counts.Sum(c => c.Count);
        var average = total == 0 ? 0 : Math.Round((decimal)counts.Sum(c => c.Rating * c.Count) / total, 1);
        var stars = Enumerable.Range(1, 5).Reverse().Select(s => counts.FirstOrDefault(c => c.Rating == s)?.Count ?? 0).ToList();

        var list = await approved
            .OrderByDescending(r => r.IsFeatured).ThenByDescending(r => r.ApprovedAt)
            .Select(r => new PublicReviewDto(r.Id, r.CustomerName, r.City, r.Occasion, r.Rating, r.Comment, r.IsFeatured, r.ApprovedAt!.Value))
            .ToPagedAsync(page, ct);

        return new PublicReviewPage(new ReviewSummary(total, average, stars), list);
    }

    public async Task<PagedResult<AdminReviewDto>> AdminListAsync(ReviewQuery q, CancellationToken ct)
    {
        var query = db.Reviews.AsNoTracking();
        if (q.Status.HasValue) query = query.Where(r => r.Status == q.Status);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(r => r.CustomerName.ToLower().Contains(s) || r.Comment.ToLower().Contains(s));
        }
        return await query.OrderByDescending(r => r.CreatedAt)
            .Select(r => new AdminReviewDto(r.Id, r.CustomerName, r.City, r.Mobile, r.Occasion, r.Rating, r.Comment, r.Status, r.IsFeatured, r.CreatedAt, r.ApprovedAt))
            .ToPagedAsync(q, ct);
    }

    public async Task<AdminReviewDto> ModerateAsync(long id, ModerateReviewRequest req, CancellationToken ct)
    {
        var r = await db.Reviews.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Review", id);
        if (req.Status == ReviewStatus.Approved) r.Approve(clock.UtcNow, req.IsFeatured);
        else if (req.Status == ReviewStatus.Rejected) r.Reject();
        await db.SaveChangesAsync(ct);
        return new AdminReviewDto(r.Id, r.CustomerName, r.City, r.Mobile, r.Occasion, r.Rating, r.Comment, r.Status, r.IsFeatured, r.CreatedAt, r.ApprovedAt);
    }

    public async Task DeleteAsync(long id, CancellationToken ct)
    {
        var r = await db.Reviews.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Review", id);
        db.Reviews.Remove(r);
        await db.SaveChangesAsync(ct);
    }
}
