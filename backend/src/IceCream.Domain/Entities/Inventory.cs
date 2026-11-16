using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

public class RawMaterial : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "kg";
    public decimal MinStockLevel { get; set; }
    public decimal CurrentStock { get; private set; }

    public bool IsLow => CurrentStock <= MinStockLevel;

    /// <summary>Applies a stock movement and returns the ledger row for it.</summary>
    public RawMaterialTxn Apply(StockTxnType type, decimal qty, string? remark, string? refNo = null)
    {
        if (qty <= 0) throw new DomainException("Quantity must be greater than zero.");

        var change = type == StockTxnType.In || type == StockTxnType.Adjust ? qty : -qty;
        if (CurrentStock + change < 0)
            throw new DomainException($"Not enough {Name}. In stock: {CurrentStock} {Unit}.");

        CurrentStock += change;
        return new RawMaterialTxn
        {
            RawMaterialId = Id,
            RawMaterial = this,
            TxnType = type,
            Quantity = qty,
            BalanceAfter = CurrentStock,
            Remark = remark,
            RefNo = refNo
        };
    }
}

public class RawMaterialTxn : BaseEntity
{
    public long RawMaterialId { get; set; }
    public RawMaterial? RawMaterial { get; set; }
    public StockTxnType TxnType { get; set; }
    public decimal Quantity { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Remark { get; set; }
    public string? RefNo { get; set; }
}

/// <summary>Bill of materials: raw material needed to make one unit of a variant.</summary>
public class RecipeItem : BaseEntity
{
    public long VariantId { get; set; }
    public ProductVariant? Variant { get; set; }
    public long RawMaterialId { get; set; }
    public RawMaterial? RawMaterial { get; set; }
    public decimal QtyPerUnit { get; set; }
}

public class ProductionBatch : BaseEntity
{
    public string BatchNo { get; set; } = string.Empty;
    public long VariantId { get; set; }
    public ProductVariant? Variant { get; set; }
    public int PlannedQty { get; set; }
    public int ProducedQty { get; private set; }
    public int WastageQty { get; private set; }
    public BatchStatus Status { get; private set; } = BatchStatus.Planned;
    public DateTime? StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    /// <summary>Deducts raw material using the recipe. Blocks the start if any material is short.</summary>
    public List<RawMaterialTxn> Start(IReadOnlyList<RecipeItem> recipe, DateTime now)
    {
        if (Status != BatchStatus.Planned) throw new DomainException("Only a planned batch can be started.");
        if (recipe.Count == 0) throw new DomainException("No recipe found for this product.");

        var shortages = recipe
            .Where(r => r.RawMaterial!.CurrentStock < r.QtyPerUnit * PlannedQty)
            .Select(r => r.RawMaterial!.Name)
            .ToList();
        if (shortages.Count > 0)
            throw new DomainException($"Not enough raw material: {string.Join(", ", shortages)}.");

        var txns = recipe
            .Select(r => r.RawMaterial!.Apply(StockTxnType.Out, r.QtyPerUnit * PlannedQty, "Production", BatchNo))
            .ToList();

        Status = BatchStatus.Running;
        StartedAt = now;
        return txns;
    }

    /// <summary>Adds produced units to finished stock. Variant must be loaded.</summary>
    public void Complete(int producedQty, int wastageQty, DateTime now)
    {
        if (Status != BatchStatus.Running) throw new DomainException("Only a running batch can be completed.");
        if (producedQty < 0 || wastageQty < 0) throw new DomainException("Quantities cannot be negative.");
        if (producedQty + wastageQty > PlannedQty)
            throw new DomainException("Produced plus wastage cannot be more than planned quantity.");

        if (producedQty > 0) Variant!.AddStock(producedQty);
        ProducedQty = producedQty;
        WastageQty = wastageQty;
        Status = BatchStatus.Completed;
        CompletedAt = now;
    }
}
