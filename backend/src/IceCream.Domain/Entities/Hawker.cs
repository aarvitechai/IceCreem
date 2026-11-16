using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

/// <summary>Street vendor who takes stock daily and pays back after sale.</summary>
public class Hawker : BaseEntity
{
    public long? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public decimal CommissionPercent { get; set; } = 10;
    public decimal CreditLimit { get; set; } = 5000;
    public decimal OutstandingAmount { get; private set; }
    public bool IsActive { get; set; } = true;

    public List<HawkerStockIssue> Issues { get; set; } = [];

    public void EnsureCanTakeStock()
    {
        if (!IsActive) throw new DomainException("Hawker is inactive.");
        if (OutstandingAmount > CreditLimit)
            throw new DomainException($"Outstanding {OutstandingAmount} is above credit limit {CreditLimit}. Clear dues first.");
    }

    public void AddDue(decimal amount) => OutstandingAmount += amount;

    public void ReceivePayment(decimal amount)
    {
        if (amount < 0) throw new DomainException("Amount cannot be negative.");
        OutstandingAmount -= amount;
    }
}

public class HawkerStockIssue : BaseEntity
{
    public long HawkerId { get; set; }
    public Hawker? Hawker { get; set; }
    public DateOnly IssueDate { get; set; }
    public HawkerIssueStatus Status { get; private set; } = HawkerIssueStatus.Issued;
    public decimal TotalSaleValue { get; private set; }
    public decimal Commission { get; private set; }
    public decimal CashCollected { get; private set; }

    public List<HawkerStockIssueItem> Items { get; set; } = [];

    public decimal IssuedValue => Items.Sum(i => i.IssuedQty * i.Rate);

    /// <summary>
    /// Daily settlement. Rule: issued = sold + returned + damaged for every item.
    /// Returned stock goes back to finished goods. Net due is added to hawker outstanding.
    /// Items must be loaded with Variant, and Hawker must be loaded.
    /// </summary>
    public void Settle(IReadOnlyDictionary<long, (int Sold, int Returned, int Damaged)> counts, decimal cashCollected)
    {
        if (Status != HawkerIssueStatus.Issued) throw new DomainException("This stock issue is already settled.");
        if (cashCollected < 0) throw new DomainException("Cash collected cannot be negative.");

        foreach (var item in Items)
        {
            if (!counts.TryGetValue(item.VariantId, out var c))
                throw new DomainException($"Counts missing for {item.Sku}.");
            if (c.Sold < 0 || c.Returned < 0 || c.Damaged < 0)
                throw new DomainException("Counts cannot be negative.");
            if (c.Sold + c.Returned + c.Damaged != item.IssuedQty)
                throw new DomainException($"{item.Sku}: sold + returned + damaged must equal issued ({item.IssuedQty}).");

            item.SoldQty = c.Sold;
            item.ReturnedQty = c.Returned;
            item.DamagedQty = c.Damaged;
            if (c.Returned > 0) item.Variant!.AddStock(c.Returned);
        }

        TotalSaleValue = Items.Sum(i => i.SoldQty * i.Rate);
        Commission = Math.Round(TotalSaleValue * Hawker!.CommissionPercent / 100, 2);
        CashCollected = cashCollected;

        // Hawker owes the sale value (damaged stock is charged too) minus commission.
        var damagedValue = Items.Sum(i => i.DamagedQty * i.Rate);
        Hawker.AddDue(TotalSaleValue + damagedValue - Commission);
        Hawker.ReceivePayment(cashCollected);
        Status = HawkerIssueStatus.Settled;
    }
}

public class HawkerStockIssueItem : BaseEntity
{
    public long IssueId { get; set; }
    public long VariantId { get; set; }
    public ProductVariant? Variant { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int IssuedQty { get; set; }
    public int SoldQty { get; set; }
    public int ReturnedQty { get; set; }
    public int DamagedQty { get; set; }
    public decimal Rate { get; set; }
}
