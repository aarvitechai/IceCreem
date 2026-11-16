using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Operations;

public sealed record RawMaterialDto(long Id, string Name, string Unit, decimal MinStockLevel, decimal CurrentStock, bool IsLow);
public sealed record SaveRawMaterialRequest(string Name, string Unit, decimal MinStockLevel);
public sealed record StockMoveRequest(StockTxnType Type, decimal Quantity, string? Remark);
public sealed record RawTxnDto(long Id, StockTxnType Type, decimal Quantity, decimal BalanceAfter, string? Remark, string? RefNo, DateTime At);

public sealed record FinishedStockDto(long VariantId, string ProductName, string VariantName, string Sku,
    int StockQty, int ReservedQty, int AvailableQty, decimal SellingPrice);

public sealed record FinishedAdjustRequest(int Quantity, string Reason);

public sealed record RecipeLine(long RawMaterialId, decimal QtyPerUnit);
public sealed record RecipeDto(long VariantId, string VariantName, IReadOnlyList<RecipeLineDto> Items);
public sealed record RecipeLineDto(long RawMaterialId, string RawMaterialName, string Unit, decimal QtyPerUnit);

public sealed record CreateBatchRequest(long VariantId, int PlannedQty);
public sealed record CompleteBatchRequest(int ProducedQty, int WastageQty);
public sealed record BatchDto(long Id, string BatchNo, long VariantId, string ProductName, string VariantName,
    int PlannedQty, int ProducedQty, int WastageQty, BatchStatus Status, DateTime CreatedAt, DateTime? StartedAt, DateTime? CompletedAt);

public sealed class SaveRawMaterialValidator : AbstractValidator<SaveRawMaterialRequest>
{
    public SaveRawMaterialValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Unit).NotEmpty().MaximumLength(20);
        RuleFor(x => x.MinStockLevel).GreaterThanOrEqualTo(0);
    }
}

public sealed class StockMoveValidator : AbstractValidator<StockMoveRequest>
{
    public StockMoveValidator()
    {
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.Remark).MaximumLength(300);
    }
}

public sealed class CreateBatchValidator : AbstractValidator<CreateBatchRequest>
{
    public CreateBatchValidator()
    {
        RuleFor(x => x.VariantId).GreaterThan(0);
        RuleFor(x => x.PlannedQty).InclusiveBetween(1, 100_000);
    }
}

/// <summary>Raw material stock, finished goods stock, recipes and production batches.</summary>
public sealed class InventoryService(IAppDbContext db, IClock clock)
{
    // ---------- Raw materials ----------

    public async Task<IReadOnlyList<RawMaterialDto>> RawMaterialsAsync(CancellationToken ct) =>
        (await db.RawMaterials.AsNoTracking().OrderBy(m => m.Name).ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<RawMaterialDto> SaveRawMaterialAsync(long? id, SaveRawMaterialRequest req, CancellationToken ct)
    {
        var m = id.HasValue
            ? await db.RawMaterials.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Raw material", id)
            : db.RawMaterials.Add(new RawMaterial()).Entity;
        m.Name = req.Name.Trim();
        m.Unit = req.Unit.Trim();
        m.MinStockLevel = req.MinStockLevel;
        await db.SaveChangesAsync(ct);
        return ToDto(m);
    }

    public async Task<RawMaterialDto> MoveRawStockAsync(long id, StockMoveRequest req, CancellationToken ct)
    {
        var m = await db.RawMaterials.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Raw material", id);
        db.RawMaterialTxns.Add(m.Apply(req.Type, req.Quantity, req.Remark));
        await db.SaveChangesAsync(ct);
        return ToDto(m);
    }

    public async Task<IReadOnlyList<RawTxnDto>> LedgerAsync(long id, CancellationToken ct) =>
        await db.RawMaterialTxns.AsNoTracking().Where(t => t.RawMaterialId == id)
            .OrderByDescending(t => t.CreatedAt).Take(200)
            .Select(t => new RawTxnDto(t.Id, t.TxnType, t.Quantity, t.BalanceAfter, t.Remark, t.RefNo, t.CreatedAt))
            .ToListAsync(ct);

    // ---------- Finished goods ----------

    public async Task<IReadOnlyList<FinishedStockDto>> FinishedStockAsync(CancellationToken ct) =>
        await db.ProductVariants.AsNoTracking().Where(v => v.Product!.IsActive || v.StockQty > 0)
            .OrderBy(v => v.Product!.Name).ThenBy(v => v.SellingPrice)
            .Select(v => new FinishedStockDto(v.Id, v.Product!.Name, v.Name, v.Sku, v.StockQty, v.ReservedQty,
                v.StockQty - v.ReservedQty, v.SellingPrice))
            .ToListAsync(ct);

    /// <summary>Manual correction after a physical count. Positive adds, negative removes.</summary>
    public async Task AdjustFinishedAsync(long variantId, FinishedAdjustRequest req, CancellationToken ct)
    {
        if (req.Quantity == 0) throw new DomainException("Quantity cannot be zero.");
        if (string.IsNullOrWhiteSpace(req.Reason)) throw new DomainException("Reason is required.");

        var v = await db.ProductVariants.FirstOrDefaultAsync(x => x.Id == variantId, ct) ?? throw new NotFoundException("Variant", variantId);
        if (req.Quantity > 0) v.AddStock(req.Quantity);
        else v.RemoveStock(-req.Quantity);
        await db.SaveChangesAsync(ct);
    }

    // ---------- Recipes ----------

    public async Task<RecipeDto> RecipeAsync(long variantId, CancellationToken ct)
    {
        var variant = await db.ProductVariants.AsNoTracking().Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId, ct) ?? throw new NotFoundException("Variant", variantId);
        var items = await db.RecipeItems.AsNoTracking().Where(r => r.VariantId == variantId)
            .Select(r => new RecipeLineDto(r.RawMaterialId, r.RawMaterial!.Name, r.RawMaterial.Unit, r.QtyPerUnit))
            .ToListAsync(ct);
        return new RecipeDto(variantId, $"{variant.Product!.Name} {variant.Name}", items);
    }

    public async Task<RecipeDto> SaveRecipeAsync(long variantId, List<RecipeLine> lines, CancellationToken ct)
    {
        if (lines.Any(l => l.QtyPerUnit <= 0)) throw new DomainException("Quantity per unit must be greater than zero.");
        if (lines.Select(l => l.RawMaterialId).Distinct().Count() != lines.Count) throw new DomainException("Each raw material only once.");
        if (!await db.ProductVariants.AnyAsync(v => v.Id == variantId, ct)) throw new NotFoundException("Variant", variantId);

        var ids = lines.Select(l => l.RawMaterialId).ToList();
        if (await db.RawMaterials.CountAsync(m => ids.Contains(m.Id), ct) != ids.Count)
            throw new DomainException("Unknown raw material in recipe.");

        var existing = await db.RecipeItems.Where(r => r.VariantId == variantId).ToListAsync(ct);
        foreach (var old in existing.Where(e => !ids.Contains(e.RawMaterialId))) db.RecipeItems.Remove(old);
        foreach (var line in lines)
        {
            var item = existing.FirstOrDefault(e => e.RawMaterialId == line.RawMaterialId);
            if (item is null) db.RecipeItems.Add(new RecipeItem { VariantId = variantId, RawMaterialId = line.RawMaterialId, QtyPerUnit = line.QtyPerUnit });
            else item.QtyPerUnit = line.QtyPerUnit;
        }
        await db.SaveChangesAsync(ct);
        return await RecipeAsync(variantId, ct);
    }

    // ---------- Production ----------

    public async Task<PagedResult<BatchDto>> BatchesAsync(BatchStatus? status, PageQuery page, CancellationToken ct)
    {
        var query = db.ProductionBatches.AsNoTracking();
        if (status.HasValue) query = query.Where(b => b.Status == status);
        return await query.OrderByDescending(b => b.CreatedAt)
            .Select(b => new BatchDto(b.Id, b.BatchNo, b.VariantId, b.Variant!.Product!.Name, b.Variant.Name, b.PlannedQty,
                b.ProducedQty, b.WastageQty, b.Status, b.CreatedAt, b.StartedAt, b.CompletedAt))
            .ToPagedAsync(page, ct);
    }

    public async Task<long> CreateBatchAsync(CreateBatchRequest req, CancellationToken ct)
    {
        if (!await db.RecipeItems.AnyAsync(r => r.VariantId == req.VariantId, ct))
            throw new DomainException("Add a recipe for this product before planning a batch.");

        var batch = new ProductionBatch { BatchNo = $"TMP-{Guid.NewGuid():N}", VariantId = req.VariantId, PlannedQty = req.PlannedQty };
        db.ProductionBatches.Add(batch);
        await db.SaveChangesAsync(ct);

        batch.BatchNo = $"B-{clock.Today:yyyyMMdd}-{batch.Id:D4}";
        await db.SaveChangesAsync(ct);
        return batch.Id;
    }

    public async Task StartBatchAsync(long id, CancellationToken ct)
    {
        var batch = await db.ProductionBatches.FirstOrDefaultAsync(b => b.Id == id, ct) ?? throw new NotFoundException("Batch", id);
        var recipe = await db.RecipeItems.Include(r => r.RawMaterial).Where(r => r.VariantId == batch.VariantId).ToListAsync(ct);

        db.RawMaterialTxns.AddRange(batch.Start(recipe, clock.UtcNow));
        await db.SaveChangesAsync(ct);
    }

    public async Task CompleteBatchAsync(long id, CompleteBatchRequest req, CancellationToken ct)
    {
        var batch = await db.ProductionBatches.Include(b => b.Variant).FirstOrDefaultAsync(b => b.Id == id, ct)
            ?? throw new NotFoundException("Batch", id);
        batch.Complete(req.ProducedQty, req.WastageQty, clock.UtcNow);
        await db.SaveChangesAsync(ct);
    }

    private static RawMaterialDto ToDto(RawMaterial m) => new(m.Id, m.Name, m.Unit, m.MinStockLevel, m.CurrentStock, m.IsLow);
}
