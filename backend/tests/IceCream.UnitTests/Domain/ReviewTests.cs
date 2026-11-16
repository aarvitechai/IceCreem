using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;

namespace IceCream.UnitTests.Domain;

public class ReviewTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void Rating_outside_one_to_five_is_rejected(int rating) =>
        Assert.Throws<DomainException>(() => new Review().SetRating(rating));

    [Fact]
    public void New_review_waits_for_approval()
    {
        var r = new Review();
        r.SetRating(5);
        Assert.Equal(ReviewStatus.Pending, r.Status);
        Assert.Null(r.ApprovedAt);
    }

    [Fact]
    public void Approve_keeps_the_first_approval_time_and_reject_clears_featured()
    {
        var r = new Review();
        var first = new DateTime(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);
        r.Approve(first, featured: true);
        r.Approve(first.AddDays(3), featured: true);
        Assert.Equal(first, r.ApprovedAt);
        Assert.True(r.IsFeatured);

        r.Reject();
        Assert.Equal(ReviewStatus.Rejected, r.Status);
        Assert.False(r.IsFeatured);
    }
}
