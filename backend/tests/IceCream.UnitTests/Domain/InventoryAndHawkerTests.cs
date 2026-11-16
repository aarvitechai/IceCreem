using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;

namespace IceCream.UnitTests.Domain;

public class InventoryAndHawkerTests
{
    private static readonly DateTime Now = new(2026, 11, 16, 10, 0, 0, DateTimeKind.Utc);

    private static RawMaterial Milk(decimal stock)
    {
        var milk = new RawMaterial { Id = 1, Name = "Milk", Unit = "litre", MinStockLevel = 50 };
        if (stock > 0) milk.Apply(StockTxnType.In, stock, "opening");
        return milk;
    }

    [Fact]
    public void Raw_material_cannot_go_negative()
    {
        var milk = Milk(10);

        Assert.Throws<DomainException>(() => milk.Apply(StockTxnType.Out, 11, null));
    }

    [Fact]
    public void Low_stock_flag_works()
    {
        Assert.True(Milk(50).IsLow);
        Assert.False(Milk(51).IsLow);
    }

    [Fact]
    public void Batch_start_deducts_recipe_and_complete_adds_stock()
    {
        var milk = Milk(100);
        var variant = new ProductVariant { Id = 5, Sku = "VAN-500" };
        var recipe = new List<RecipeItem> { new() { RawMaterial = milk, QtyPerUnit = 0.5m } };
        var batch = new ProductionBatch { BatchNo = "B1", Variant = variant, PlannedQty = 100 };

        var txns = batch.Start(recipe, Now);
        batch.Complete(95, 5, Now);

        Assert.Single(txns);
        Assert.Equal(50, milk.CurrentStock);
        Assert.Equal(95, variant.StockQty);
        Assert.Equal(BatchStatus.Completed, batch.Status);
    }

    [Fact]
    public void Batch_start_is_blocked_when_material_is_short()
    {
        var milk = Milk(10);
        var recipe = new List<RecipeItem> { new() { RawMaterial = milk, QtyPerUnit = 0.5m } };
        var batch = new ProductionBatch { BatchNo = "B1", PlannedQty = 100 };

        Assert.Throws<DomainException>(() => batch.Start(recipe, Now));
        Assert.Equal(10, milk.CurrentStock);
    }

    [Fact]
    public void Hawker_over_credit_limit_cannot_take_stock()
    {
        var hawker = new Hawker { CreditLimit = 1000 };
        hawker.AddDue(1001);

        Assert.Throws<DomainException>(hawker.EnsureCanTakeStock);
    }

    [Fact]
    public void Settlement_must_balance_and_updates_outstanding()
    {
        var variant = new ProductVariant { Id = 7, Sku = "CONE" };
        var hawker = new Hawker { CommissionPercent = 10 };
        var issue = new HawkerStockIssue
        {
            Hawker = hawker,
            Items = [new HawkerStockIssueItem { VariantId = 7, Variant = variant, Sku = "CONE", IssuedQty = 50, Rate = 20 }]
        };

        Assert.Throws<DomainException>(() =>
            issue.Settle(new Dictionary<long, (int, int, int)> { [7] = (40, 5, 0) }, 0));

        issue.Settle(new Dictionary<long, (int, int, int)> { [7] = (40, 9, 1) }, 500);

        // Sale 800 + damaged 20 - commission 80 - cash 500 = 240
        Assert.Equal(240, hawker.OutstandingAmount);
        Assert.Equal(9, variant.StockQty);
        Assert.Equal(HawkerIssueStatus.Settled, issue.Status);
    }

    [Fact]
    public void Coupon_respects_min_amount_and_cap()
    {
        var coupon = new Coupon
        {
            Value = 20, IsPercent = true, MinOrderAmount = 300, MaxDiscount = 100,
            ValidFrom = Now.AddDays(-1), ValidTo = Now.AddDays(1)
        };

        Assert.Throws<DomainException>(() => coupon.CalculateDiscount(200, Now));
        Assert.Equal(80, coupon.CalculateDiscount(400, Now));
        Assert.Equal(100, coupon.CalculateDiscount(1000, Now));
    }
}
