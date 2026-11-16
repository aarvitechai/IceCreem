using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public List<Product> Products { get; set; } = [];
}

public class Product : BaseEntity
{
    public long CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Ingredients { get; set; }
    public string HsnCode { get; set; } = "2105";
    public decimal GstPercent { get; set; } = 18;
    public bool IsVeg { get; set; } = true;
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;

    public List<ProductVariant> Variants { get; set; } = [];
    public List<ProductImage> Images { get; set; } = [];
}

/// <summary>A sellable pack of a product (for example a 500ml tub). Holds finished goods stock.</summary>
public class ProductVariant : BaseEntity
{
    public long ProductId { get; set; }
    public Product? Product { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Mrp { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal WholesalePrice { get; set; }
    public int StockQty { get; set; }
    public int ReservedQty { get; set; }
    public bool IsActive { get; set; } = true;

    public int AvailableQty => StockQty - ReservedQty;

    /// <summary>Holds stock for a confirmed order.</summary>
    public void Reserve(int qty)
    {
        EnsurePositive(qty);
        if (AvailableQty < qty)
            throw new DomainException($"Not enough stock for {Sku}. Available: {AvailableQty}.");
        ReservedQty += qty;
    }

    /// <summary>Gives reserved stock back, for example on cancel.</summary>
    public void Release(int qty) => ReservedQty = Math.Max(0, ReservedQty - qty);

    /// <summary>Removes reserved stock when the order is delivered.</summary>
    public void Deduct(int qty)
    {
        EnsurePositive(qty);
        if (ReservedQty < qty)
            throw new DomainException($"Reserved stock mismatch for {Sku}.");
        ReservedQty -= qty;
        StockQty -= qty;
    }

    public void AddStock(int qty)
    {
        EnsurePositive(qty);
        StockQty += qty;
    }

    /// <summary>Removes free stock directly (hawker issue, wastage).</summary>
    public void RemoveStock(int qty)
    {
        EnsurePositive(qty);
        if (AvailableQty < qty)
            throw new DomainException($"Not enough stock for {Sku}. Available: {AvailableQty}.");
        StockQty -= qty;
    }

    private static void EnsurePositive(int qty)
    {
        if (qty <= 0) throw new DomainException("Quantity must be greater than zero.");
    }
}

public class ProductImage : BaseEntity
{
    public long ProductId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class Banner : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public BannerPosition Position { get; set; } = BannerPosition.Hero;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class WeddingPackage : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MinGuests { get; set; }
    public decimal PricePerHead { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}
