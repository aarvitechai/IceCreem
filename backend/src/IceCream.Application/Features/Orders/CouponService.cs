using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Orders;

public sealed record SaveCouponRequest(string Code, bool IsPercent, decimal Value, decimal MinOrderAmount, decimal MaxDiscount,
    DateTime ValidFrom, DateTime ValidTo, int UsageLimit, bool IsActive = true);

public sealed record CouponDto(long Id, string Code, bool IsPercent, decimal Value, decimal MinOrderAmount, decimal MaxDiscount,
    DateTime ValidFrom, DateTime ValidTo, int UsageLimit, int UsedCount, bool IsActive);

public sealed class SaveCouponValidator : AbstractValidator<SaveCouponRequest>
{
    public SaveCouponValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(30).Matches("^[A-Za-z0-9]+$").WithMessage("Use letters and numbers only.");
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.Value).LessThanOrEqualTo(100).When(x => x.IsPercent);
        RuleFor(x => x.MinOrderAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaxDiscount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.UsageLimit).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ValidTo).GreaterThan(x => x.ValidFrom);
    }
}

public sealed class CouponService(IAppDbContext db)
{
    public async Task<IReadOnlyList<CouponDto>> ListAsync(CancellationToken ct) =>
        await db.Coupons.AsNoTracking().OrderByDescending(c => c.ValidTo)
            .Select(c => new CouponDto(c.Id, c.Code, c.IsPercent, c.Value, c.MinOrderAmount, c.MaxDiscount,
                c.ValidFrom, c.ValidTo, c.UsageLimit, c.UsedCount, c.IsActive))
            .ToListAsync(ct);

    public async Task<long> SaveAsync(long? id, SaveCouponRequest req, CancellationToken ct)
    {
        var code = req.Code.Trim().ToUpperInvariant();
        var coupon = id.HasValue
            ? await db.Coupons.FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw new NotFoundException("Coupon", id)
            : db.Coupons.Add(new Coupon()).Entity;

        if (await db.Coupons.AnyAsync(c => c.Code == code && c.Id != coupon.Id, ct))
            throw new ConflictException($"Coupon {code} already exists.");

        coupon.Code = code;
        coupon.IsPercent = req.IsPercent;
        coupon.Value = req.Value;
        coupon.MinOrderAmount = req.MinOrderAmount;
        coupon.MaxDiscount = req.MaxDiscount;
        coupon.ValidFrom = req.ValidFrom;
        coupon.ValidTo = req.ValidTo;
        coupon.UsageLimit = req.UsageLimit;
        coupon.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return coupon.Id;
    }

    public async Task DeleteAsync(long id, CancellationToken ct)
    {
        var coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw new NotFoundException("Coupon", id);
        db.Coupons.Remove(coupon);
        await db.SaveChangesAsync(ct);
    }
}
