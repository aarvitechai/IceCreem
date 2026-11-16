using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

/// <summary>
/// A customer review. It starts as Pending and appears on the site only after an admin approves it,
/// so the testimonials page never shows anything the business has not checked.
/// </summary>
public class Review : BaseEntity
{
    public const int MinRating = 1;
    public const int MaxRating = 5;

    public long? UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? City { get; set; }

    /// <summary>Kept private for follow up. Never returned by public endpoints.</summary>
    public string? Mobile { get; set; }

    /// <summary>What the review is about, for example "Home delivery" or "Wedding".</summary>
    public string Occasion { get; set; } = string.Empty;
    public int Rating { get; private set; }
    public string Comment { get; set; } = string.Empty;
    public ReviewStatus Status { get; private set; } = ReviewStatus.Pending;
    public bool IsFeatured { get; private set; }
    public DateTime? ApprovedAt { get; private set; }

    public void SetRating(int rating)
    {
        if (rating is < MinRating or > MaxRating)
            throw new DomainException($"Rating must be between {MinRating} and {MaxRating}.");
        Rating = rating;
    }

    public void Approve(DateTime now, bool featured)
    {
        Status = ReviewStatus.Approved;
        ApprovedAt ??= now;
        IsFeatured = featured;
    }

    public void Reject()
    {
        Status = ReviewStatus.Rejected;
        IsFeatured = false;
    }
}
