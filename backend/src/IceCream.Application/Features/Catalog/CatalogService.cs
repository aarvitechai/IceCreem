using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Features.Catalog;

public sealed record CategoryDto(long Id, string Name, string Slug, string? ImageUrl, int SortOrder, bool IsActive, int ProductCount);

public sealed record ProductCardDto(
    long Id, string Name, string Slug, string ShortDescription, string CategoryName, string CategorySlug,
    string? ImageUrl, bool IsVeg, bool IsFeatured, decimal Price, decimal Mrp, bool InStock);

public sealed record VariantDto(long Id, string Sku, string Name, decimal Mrp, decimal SellingPrice, int AvailableQty);
public sealed record ImageDto(long Id, string ImageUrl, string? AltText, bool IsPrimary);

public sealed record ProductDetailDto(
    long Id, string Name, string Slug, string ShortDescription, string Description, string? Ingredients,
    string CategoryName, string CategorySlug, decimal GstPercent, bool IsVeg,
    IReadOnlyList<ImageDto> Images, IReadOnlyList<VariantDto> Variants);

public sealed record BannerDto(long Id, string Title, string? Subtitle, string ImageUrl, string? LinkUrl, BannerPosition Position);
public sealed record PackageDto(long Id, string Name, string Description, int MinGuests, decimal PricePerHead, string? ImageUrl);

public sealed class ProductQuery : PageQuery
{
    public string? Category { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsVeg { get; set; }

    /// <summary>featured (default), price_asc, price_desc, newest, name</summary>
    public string? Sort { get; set; }
}

/// <summary>Read only catalog for the public storefront. Only active items are shown.</summary>
public sealed class CatalogService(IAppDbContext db)
{
    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct) =>
        await db.Categories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.ImageUrl, c.SortOrder, c.IsActive,
                c.Products.Count(p => p.IsActive && !p.IsDeleted)))
            .ToListAsync(ct);

    public async Task<PagedResult<ProductCardDto>> GetProductsAsync(ProductQuery q, CancellationToken ct)
    {
        var query = db.Products.AsNoTracking()
            .Where(p => p.IsActive && p.Category!.IsActive && p.Variants.Any(v => v.IsActive && !v.IsDeleted));

        if (!string.IsNullOrWhiteSpace(q.Category)) query = query.Where(p => p.Category!.Slug == q.Category);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLowerInvariant();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.ShortDescription.ToLower().Contains(s));
        }
        if (q.IsVeg.HasValue) query = query.Where(p => p.IsVeg == q.IsVeg);

        var cards = query.Select(p => new
        {
            p,
            Price = p.Variants.Where(v => v.IsActive && !v.IsDeleted).Min(v => v.SellingPrice),
            Mrp = p.Variants.Where(v => v.IsActive && !v.IsDeleted).Min(v => v.Mrp),
            InStock = p.Variants.Any(v => v.IsActive && !v.IsDeleted && v.StockQty - v.ReservedQty > 0),
            Image = p.Images.Where(i => !i.IsDeleted).OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
                .Select(i => i.ImageUrl).FirstOrDefault()
        });

        if (q.MinPrice.HasValue) cards = cards.Where(x => x.Price >= q.MinPrice);
        if (q.MaxPrice.HasValue) cards = cards.Where(x => x.Price <= q.MaxPrice);

        cards = q.Sort switch
        {
            "price_asc" => cards.OrderBy(x => x.Price),
            "price_desc" => cards.OrderByDescending(x => x.Price),
            "newest" => cards.OrderByDescending(x => x.p.CreatedAt),
            "name" => cards.OrderBy(x => x.p.Name),
            _ => cards.OrderByDescending(x => x.p.IsFeatured).ThenBy(x => x.p.Name)
        };

        return await cards
            .Select(x => new ProductCardDto(x.p.Id, x.p.Name, x.p.Slug, x.p.ShortDescription, x.p.Category!.Name,
                x.p.Category.Slug, x.Image, x.p.IsVeg, x.p.IsFeatured, x.Price, x.Mrp, x.InStock))
            .ToPagedAsync(q, ct);
    }

    public async Task<IReadOnlyList<ProductCardDto>> GetFeaturedAsync(CancellationToken ct) =>
        (await GetProductsAsync(new ProductQuery { PageSize = 8 }, ct)).Items.Where(p => p.IsFeatured).ToList();

    public async Task<ProductDetailDto> GetBySlugAsync(string slug, CancellationToken ct)
    {
        var p = await db.Products.AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder))
            .Include(x => x.Variants.Where(v => v.IsActive).OrderBy(v => v.SellingPrice))
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive, ct)
            ?? throw new NotFoundException("Product", slug);

        return new ProductDetailDto(p.Id, p.Name, p.Slug, p.ShortDescription, p.Description, p.Ingredients,
            p.Category!.Name, p.Category.Slug, p.GstPercent, p.IsVeg,
            p.Images.Select(i => new ImageDto(i.Id, i.ImageUrl, i.AltText, i.IsPrimary)).ToList(),
            p.Variants.Select(v => new VariantDto(v.Id, v.Sku, v.Name, v.Mrp, v.SellingPrice, Math.Max(0, v.AvailableQty))).ToList());
    }

    public async Task<IReadOnlyList<BannerDto>> GetBannersAsync(CancellationToken ct) =>
        await db.Banners.AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Position).ThenBy(b => b.SortOrder)
            .Select(b => new BannerDto(b.Id, b.Title, b.Subtitle, b.ImageUrl, b.LinkUrl, b.Position))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<PackageDto>> GetPackagesAsync(CancellationToken ct) =>
        await db.WeddingPackages.AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.PricePerHead)
            .Select(p => new PackageDto(p.Id, p.Name, p.Description, p.MinGuests, p.PricePerHead, p.ImageUrl))
            .ToListAsync(ct);
}
