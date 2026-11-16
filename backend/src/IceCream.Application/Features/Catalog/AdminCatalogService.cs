using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Catalog;

public sealed record SaveVariantRequest(long? Id, string Sku, string Name, decimal Mrp, decimal SellingPrice, decimal WholesalePrice, bool IsActive = true);

public sealed record SaveProductRequest(
    long CategoryId, string Name, string ShortDescription, string Description, string? Ingredients,
    string HsnCode, decimal GstPercent, bool IsVeg, bool IsFeatured, bool IsActive,
    List<SaveVariantRequest> Variants, List<string> ImageUrls);

public sealed record AdminVariantDto(long Id, string Sku, string Name, decimal Mrp, decimal SellingPrice,
    decimal WholesalePrice, int StockQty, int ReservedQty, bool IsActive);

public sealed record AdminProductDto(
    long Id, long CategoryId, string CategoryName, string Name, string Slug, string ShortDescription, string Description,
    string? Ingredients, string HsnCode, decimal GstPercent, bool IsVeg, bool IsFeatured, bool IsActive,
    IReadOnlyList<string> ImageUrls, IReadOnlyList<AdminVariantDto> Variants);

public sealed record AdminProductRow(long Id, string Name, string Slug, string CategoryName, string? ImageUrl,
    decimal Price, int TotalStock, int VariantCount, bool IsActive, bool IsFeatured);

public sealed record SaveCategoryRequest(string Name, string? ImageUrl, int SortOrder, bool IsActive = true);

public sealed class AdminProductQuery : PageQuery
{
    public long? CategoryId { get; set; }
    public bool? IsActive { get; set; }
}

public sealed class SaveProductValidator : AbstractValidator<SaveProductRequest>
{
    public SaveProductValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.ShortDescription).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleFor(x => x.HsnCode).NotEmpty().MaximumLength(10);
        RuleFor(x => x.GstPercent).InclusiveBetween(0, 28);
        RuleFor(x => x.Variants).NotEmpty().WithMessage("Add at least one pack size.");
        RuleFor(x => x.Variants).Must(v => v.Select(x => x.Sku.Trim().ToUpperInvariant()).Distinct().Count() == v.Count)
            .WithMessage("SKU must be unique.");
        RuleForEach(x => x.Variants).ChildRules(v =>
        {
            v.RuleFor(x => x.Sku).NotEmpty().MaximumLength(40);
            v.RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
            v.RuleFor(x => x.SellingPrice).GreaterThan(0);
            v.RuleFor(x => x.Mrp).GreaterThanOrEqualTo(x => x.SellingPrice).WithMessage("MRP cannot be less than selling price.");
            v.RuleFor(x => x.WholesalePrice).GreaterThanOrEqualTo(0).LessThanOrEqualTo(x => x.SellingPrice);
        });
        RuleForEach(x => x.ImageUrls).NotEmpty().MaximumLength(500);
    }
}

public sealed class SaveCategoryValidator : AbstractValidator<SaveCategoryRequest>
{
    public SaveCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
    }
}

public sealed class AdminCatalogService(IAppDbContext db, IFileStorage storage)
{
    private static readonly string[] AllowedImageTypes = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
    private const long MaxImageBytes = 2 * 1024 * 1024;

    // ---------- Products ----------

    public async Task<PagedResult<AdminProductRow>> GetProductsAsync(AdminProductQuery q, CancellationToken ct)
    {
        var query = db.Products.AsNoTracking();
        if (q.CategoryId.HasValue) query = query.Where(p => p.CategoryId == q.CategoryId);
        if (q.IsActive.HasValue) query = query.Where(p => p.IsActive == q.IsActive);
        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(p => p.Name.Contains(q.Search) || p.Variants.Any(v => v.Sku.Contains(q.Search)));

        return await query.OrderBy(p => p.Name)
            .Select(p => new AdminProductRow(p.Id, p.Name, p.Slug, p.Category!.Name,
                p.Images.OrderByDescending(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault(),
                p.Variants.Select(v => (decimal?)v.SellingPrice).Min() ?? 0,
                p.Variants.Sum(v => v.StockQty), p.Variants.Count, p.IsActive, p.IsFeatured))
            .ToPagedAsync(q, ct);
    }

    public async Task<AdminProductDto> GetProductAsync(long id, CancellationToken ct) =>
        ToDto(await LoadProductAsync(id, ct));

    public async Task<AdminProductDto> CreateProductAsync(SaveProductRequest req, CancellationToken ct)
    {
        var product = new Product();
        await ApplyAsync(product, req, ct);
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return ToDto(product);
    }

    public async Task<AdminProductDto> UpdateProductAsync(long id, SaveProductRequest req, CancellationToken ct)
    {
        var product = await LoadProductAsync(id, ct);
        await ApplyAsync(product, req, ct);
        await db.SaveChangesAsync(ct);
        return ToDto(product);
    }

    public async Task SetProductStatusAsync(long id, bool isActive, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Product", id);
        product.IsActive = isActive;
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteProductAsync(long id, CancellationToken ct)
    {
        var product = await LoadProductAsync(id, ct);
        db.Products.Remove(product);
        product.Variants.ForEach(v => db.ProductVariants.Remove(v));
        await db.SaveChangesAsync(ct);
    }

    public async Task<string> UploadImageAsync(Stream content, string fileName, long length, CancellationToken ct)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedImageTypes.Contains(ext))
            throw new Domain.Common.DomainException("Only jpg, png, webp or svg images are allowed.");
        if (length > MaxImageBytes)
            throw new Domain.Common.DomainException("Image must be 2 MB or smaller.");

        return await storage.SaveAsync(content, fileName, "products", ct);
    }

    private async Task<Product> LoadProductAsync(long id, CancellationToken ct) =>
        await db.Products.Include(p => p.Category).Include(p => p.Variants).Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Product", id);

    private async Task ApplyAsync(Product product, SaveProductRequest req, CancellationToken ct)
    {
        product.Category = await db.Categories.FirstOrDefaultAsync(c => c.Id == req.CategoryId, ct)
            ?? throw new NotFoundException("Category", req.CategoryId);

        var slug = Slug.From(req.Name);
        if (await db.Products.AnyAsync(p => p.Slug == slug && p.Id != product.Id, ct))
            throw new ConflictException($"A product named '{req.Name}' already exists.");

        var skus = req.Variants.Select(v => v.Sku.Trim().ToUpperInvariant()).ToList();
        var ownIds = product.Variants.Select(v => v.Id).ToList();
        if (await db.ProductVariants.AnyAsync(v => skus.Contains(v.Sku) && !ownIds.Contains(v.Id), ct))
            throw new ConflictException("One of the SKUs is already used by another product.");

        product.Name = req.Name.Trim();
        product.Slug = slug;
        product.ShortDescription = req.ShortDescription.Trim();
        product.Description = req.Description.Trim();
        product.Ingredients = req.Ingredients?.Trim();
        product.HsnCode = req.HsnCode.Trim();
        product.GstPercent = req.GstPercent;
        product.IsVeg = req.IsVeg;
        product.IsFeatured = req.IsFeatured;
        product.IsActive = req.IsActive;

        // Variants: update by id, add new ones, soft delete the missing ones.
        foreach (var v in req.Variants)
        {
            var variant = v.Id is > 0 ? product.Variants.FirstOrDefault(x => x.Id == v.Id) : null;
            if (variant is null)
            {
                variant = new ProductVariant();
                product.Variants.Add(variant);
            }
            variant.Sku = v.Sku.Trim().ToUpperInvariant();
            variant.Name = v.Name.Trim();
            variant.Mrp = v.Mrp;
            variant.SellingPrice = v.SellingPrice;
            variant.WholesalePrice = v.WholesalePrice;
            variant.IsActive = v.IsActive;
        }
        var keepIds = req.Variants.Where(v => v.Id is > 0).Select(v => v.Id!.Value).ToHashSet();
        foreach (var removed in product.Variants.Where(v => v.Id > 0 && !keepIds.Contains(v.Id)).ToList())
        {
            if (removed.ReservedQty > 0)
                throw new Domain.Common.DomainException($"{removed.Sku} has reserved stock for open orders and cannot be removed.");
            db.ProductVariants.Remove(removed);
        }

        // Images: replace the list, first one is primary.
        foreach (var img in product.Images.ToList()) db.ProductImages.Remove(img);
        product.Images.Clear();
        for (var i = 0; i < req.ImageUrls.Count; i++)
            product.Images.Add(new ProductImage { ImageUrl = req.ImageUrls[i], AltText = product.Name, SortOrder = i, IsPrimary = i == 0 });
    }

    private static AdminProductDto ToDto(Product p) => new(
        p.Id, p.CategoryId, p.Category?.Name ?? string.Empty, p.Name, p.Slug, p.ShortDescription, p.Description,
        p.Ingredients, p.HsnCode, p.GstPercent, p.IsVeg, p.IsFeatured, p.IsActive,
        p.Images.Where(i => !i.IsDeleted).OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList(),
        p.Variants.Where(v => !v.IsDeleted)
            .Select(v => new AdminVariantDto(v.Id, v.Sku, v.Name, v.Mrp, v.SellingPrice, v.WholesalePrice, v.StockQty, v.ReservedQty, v.IsActive))
            .ToList());

    // ---------- Categories ----------

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct) =>
        await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.ImageUrl, c.SortOrder, c.IsActive, c.Products.Count(p => !p.IsDeleted)))
            .ToListAsync(ct);

    public async Task<CategoryDto> SaveCategoryAsync(long? id, SaveCategoryRequest req, CancellationToken ct)
    {
        var category = id.HasValue
            ? await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw new NotFoundException("Category", id)
            : db.Categories.Add(new Category()).Entity;

        var slug = Slug.From(req.Name);
        if (await db.Categories.AnyAsync(c => c.Slug == slug && c.Id != category.Id, ct))
            throw new ConflictException($"Category '{req.Name}' already exists.");

        category.Name = req.Name.Trim();
        category.Slug = slug;
        category.ImageUrl = req.ImageUrl;
        category.SortOrder = req.SortOrder;
        category.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);

        return new CategoryDto(category.Id, category.Name, category.Slug, category.ImageUrl, category.SortOrder, category.IsActive, 0);
    }

    public async Task DeleteCategoryAsync(long id, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct) ?? throw new NotFoundException("Category", id);
        if (await db.Products.AnyAsync(p => p.CategoryId == id, ct))
            throw new ConflictException("Move or delete the products in this category first.");
        db.Categories.Remove(category);
        await db.SaveChangesAsync(ct);
    }

    // ---------- Banners and packages ----------

    public sealed record SaveBannerRequest(string Title, string? Subtitle, string ImageUrl, string? LinkUrl,
        BannerPosition Position, int SortOrder, bool IsActive = true);

    public sealed record SavePackageRequest(string Name, string Description, int MinGuests, decimal PricePerHead,
        string? ImageUrl, bool IsActive = true);

    public sealed record AdminBannerDto(long Id, string Title, string? Subtitle, string ImageUrl, string? LinkUrl,
        BannerPosition Position, int SortOrder, bool IsActive);

    public sealed record AdminPackageDto(long Id, string Name, string Description, int MinGuests, decimal PricePerHead,
        string? ImageUrl, bool IsActive);

    public async Task<IReadOnlyList<AdminBannerDto>> GetBannersAsync(CancellationToken ct) =>
        await db.Banners.AsNoTracking().OrderBy(b => b.Position).ThenBy(b => b.SortOrder)
            .Select(b => new AdminBannerDto(b.Id, b.Title, b.Subtitle, b.ImageUrl, b.LinkUrl, b.Position, b.SortOrder, b.IsActive))
            .ToListAsync(ct);

    public async Task<long> SaveBannerAsync(long? id, SaveBannerRequest req, CancellationToken ct)
    {
        var b = id.HasValue
            ? await db.Banners.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Banner", id)
            : db.Banners.Add(new Banner()).Entity;
        b.Title = req.Title; b.Subtitle = req.Subtitle; b.ImageUrl = req.ImageUrl; b.LinkUrl = req.LinkUrl;
        b.Position = req.Position; b.SortOrder = req.SortOrder; b.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return b.Id;
    }

    public async Task DeleteBannerAsync(long id, CancellationToken ct)
    {
        var b = await db.Banners.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Banner", id);
        db.Banners.Remove(b);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AdminPackageDto>> GetPackagesAsync(CancellationToken ct) =>
        await db.WeddingPackages.AsNoTracking().OrderBy(p => p.PricePerHead)
            .Select(p => new AdminPackageDto(p.Id, p.Name, p.Description, p.MinGuests, p.PricePerHead, p.ImageUrl, p.IsActive))
            .ToListAsync(ct);

    public async Task<long> SavePackageAsync(long? id, SavePackageRequest req, CancellationToken ct)
    {
        if (req.PricePerHead <= 0 || req.MinGuests <= 0 || string.IsNullOrWhiteSpace(req.Name))
            throw new Domain.Common.DomainException("Name, minimum guests and price per head are required.");

        var p = id.HasValue
            ? await db.WeddingPackages.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Package", id)
            : db.WeddingPackages.Add(new WeddingPackage()).Entity;
        p.Name = req.Name; p.Description = req.Description; p.MinGuests = req.MinGuests;
        p.PricePerHead = req.PricePerHead; p.ImageUrl = req.ImageUrl; p.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return p.Id;
    }
}
