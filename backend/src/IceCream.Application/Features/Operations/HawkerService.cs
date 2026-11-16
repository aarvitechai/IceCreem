using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Operations;

public sealed record HawkerDto(long Id, long? UserId, string Name, string Mobile, string Area, decimal CommissionPercent,
    decimal CreditLimit, decimal OutstandingAmount, bool IsActive, bool HasOpenIssue);

public sealed record SaveHawkerRequest(string Name, string Mobile, string Area, decimal CommissionPercent, decimal CreditLimit,
    bool IsActive = true, long? UserId = null);

public sealed record IssueLine(long VariantId, int Quantity);
public sealed record IssueStockRequest(List<IssueLine> Items);
public sealed record SettleLine(long VariantId, int Sold, int Returned, int Damaged);
public sealed record SettleRequest(List<SettleLine> Items, decimal CashCollected);
public sealed record HawkerPaymentRequest(decimal Amount);

public sealed record IssueItemDto(long VariantId, string Sku, string Name, int IssuedQty, int SoldQty, int ReturnedQty, int DamagedQty, decimal Rate);
public sealed record IssueDto(long Id, long HawkerId, string HawkerName, DateOnly IssueDate, HawkerIssueStatus Status,
    decimal IssuedValue, decimal TotalSaleValue, decimal Commission, decimal CashCollected, IReadOnlyList<IssueItemDto> Items);

public sealed record HawkerDetailDto(HawkerDto Hawker, IReadOnlyList<IssueDto> RecentIssues);

public sealed class SaveHawkerValidator : AbstractValidator<SaveHawkerRequest>
{
    public SaveHawkerValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10 digit mobile number.");
        RuleFor(x => x.Area).NotEmpty().MaximumLength(120);
        RuleFor(x => x.CommissionPercent).InclusiveBetween(0, 50);
        RuleFor(x => x.CreditLimit).GreaterThanOrEqualTo(0);
    }
}

public sealed class IssueStockValidator : AbstractValidator<IssueStockRequest>
{
    public IssueStockValidator()
    {
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(i =>
        {
            i.RuleFor(x => x.VariantId).GreaterThan(0);
            i.RuleFor(x => x.Quantity).InclusiveBetween(1, 5000);
        });
    }
}

public sealed class HawkerService(IAppDbContext db, IClock clock, ICurrentUser currentUser)
{
    public async Task<IReadOnlyList<HawkerDto>> ListAsync(CancellationToken ct) =>
        await Rows(db.Hawkers.AsNoTracking()).OrderBy(h => h.Name).ToListAsync(ct);

    public async Task<HawkerDetailDto> GetAsync(long id, CancellationToken ct)
    {
        var hawker = await Rows(db.Hawkers.AsNoTracking().Where(h => h.Id == id)).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Hawker", id);
        return new HawkerDetailDto(hawker, await IssuesAsync(id, ct));
    }

    /// <summary>The logged in hawker's own account.</summary>
    public async Task<HawkerDetailDto> MeAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var id = await db.Hawkers.Where(h => h.UserId == userId).Select(h => (long?)h.Id).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Hawker profile", userId);
        return await GetAsync(id, ct);
    }

    public async Task<long> SaveAsync(long? id, SaveHawkerRequest req, CancellationToken ct)
    {
        var hawker = id.HasValue
            ? await db.Hawkers.FirstOrDefaultAsync(h => h.Id == id, ct) ?? throw new NotFoundException("Hawker", id)
            : db.Hawkers.Add(new Hawker()).Entity;

        if (await db.Hawkers.AnyAsync(h => h.Mobile == req.Mobile && h.Id != hawker.Id, ct))
            throw new ConflictException("A hawker with this mobile already exists.");
        if (req.UserId.HasValue && !await db.Users.AnyAsync(u => u.Id == req.UserId && u.Role == UserRole.Hawker, ct))
            throw new DomainException("Linked user must have the Hawker role.");

        hawker.Name = req.Name.Trim();
        hawker.Mobile = req.Mobile;
        hawker.Area = req.Area.Trim();
        hawker.CommissionPercent = req.CommissionPercent;
        hawker.CreditLimit = req.CreditLimit;
        hawker.IsActive = req.IsActive;
        hawker.UserId = req.UserId ?? hawker.UserId;
        await db.SaveChangesAsync(ct);
        return hawker.Id;
    }

    /// <summary>Gives the day's stock to a hawker at wholesale rate. Blocked above credit limit or with an open issue.</summary>
    public async Task<IssueDto> IssueStockAsync(long hawkerId, IssueStockRequest req, CancellationToken ct)
    {
        var hawker = await db.Hawkers.FirstOrDefaultAsync(h => h.Id == hawkerId, ct) ?? throw new NotFoundException("Hawker", hawkerId);
        hawker.EnsureCanTakeStock();
        if (await db.HawkerStockIssues.AnyAsync(i => i.HawkerId == hawkerId && i.Status == HawkerIssueStatus.Issued, ct))
            throw new DomainException("Settle the previous stock issue before issuing new stock.");

        var merged = req.Items.GroupBy(i => i.VariantId).ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));
        var ids = merged.Keys.ToList();
        var variants = await db.ProductVariants.Include(v => v.Product).Where(v => ids.Contains(v.Id)).ToListAsync(ct);
        if (variants.Count != ids.Count) throw new DomainException("Unknown product in stock issue.");

        var issue = new HawkerStockIssue { Hawker = hawker, IssueDate = clock.Today };
        foreach (var v in variants)
        {
            v.RemoveStock(merged[v.Id]);
            issue.Items.Add(new HawkerStockIssueItem
            {
                VariantId = v.Id, Variant = v, Sku = v.Sku, Name = $"{v.Product!.Name} {v.Name}",
                IssuedQty = merged[v.Id], Rate = v.WholesalePrice > 0 ? v.WholesalePrice : v.SellingPrice
            });
        }

        db.HawkerStockIssues.Add(issue);
        await db.SaveChangesAsync(ct);
        return ToDto(issue);
    }

    public async Task<IssueDto> SettleAsync(long issueId, SettleRequest req, CancellationToken ct)
    {
        var issue = await db.HawkerStockIssues.Include(i => i.Hawker).Include(i => i.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(i => i.Id == issueId, ct) ?? throw new NotFoundException("Stock issue", issueId);

        issue.Settle(req.Items.ToDictionary(i => i.VariantId, i => (i.Sold, i.Returned, i.Damaged)), req.CashCollected);
        await db.SaveChangesAsync(ct);
        return ToDto(issue);
    }

    public async Task<HawkerDto> ReceivePaymentAsync(long hawkerId, decimal amount, CancellationToken ct)
    {
        if (amount <= 0) throw new DomainException("Amount must be greater than zero.");
        var hawker = await db.Hawkers.FirstOrDefaultAsync(h => h.Id == hawkerId, ct) ?? throw new NotFoundException("Hawker", hawkerId);
        hawker.ReceivePayment(amount);
        await db.SaveChangesAsync(ct);
        return (await GetAsync(hawkerId, ct)).Hawker;
    }

    private async Task<IReadOnlyList<IssueDto>> IssuesAsync(long hawkerId, CancellationToken ct)
    {
        var issues = await db.HawkerStockIssues.AsNoTracking().Include(i => i.Hawker).Include(i => i.Items)
            .Where(i => i.HawkerId == hawkerId).OrderByDescending(i => i.IssueDate).ThenByDescending(i => i.Id)
            .Take(30).ToListAsync(ct);
        return issues.Select(ToDto).ToList();
    }

    private static IQueryable<HawkerDto> Rows(IQueryable<Hawker> q) =>
        q.Select(h => new HawkerDto(h.Id, h.UserId, h.Name, h.Mobile, h.Area, h.CommissionPercent, h.CreditLimit,
            h.OutstandingAmount, h.IsActive, h.Issues.Any(i => i.Status == HawkerIssueStatus.Issued)));

    private static IssueDto ToDto(HawkerStockIssue i) => new(
        i.Id, i.HawkerId, i.Hawker?.Name ?? string.Empty, i.IssueDate, i.Status, i.IssuedValue, i.TotalSaleValue, i.Commission, i.CashCollected,
        i.Items.Select(x => new IssueItemDto(x.VariantId, x.Sku, x.Name, x.IssuedQty, x.SoldQty, x.ReturnedQty, x.DamagedQty, x.Rate)).ToList());
}
