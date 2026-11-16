using IceCream.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IceCream.Infrastructure.Persistence;

internal static class Filters
{
    public const string NotDeleted = "[IsDeleted] = 0";
}

internal sealed class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.Property(x => x.FullName).HasMaxLength(120);
        b.Property(x => x.Email).HasMaxLength(160);
        b.Property(x => x.Mobile).HasMaxLength(15);
        b.Property(x => x.PasswordHash).HasMaxLength(512);
        b.HasIndex(x => x.Email).IsUnique().HasFilter(Filters.NotDeleted);
        b.HasIndex(x => x.Mobile).IsUnique().HasFilter(Filters.NotDeleted);
    }
}

internal sealed class RefreshTokenConfig : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.Property(x => x.TokenHash).HasMaxLength(128);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId);
    }
}

internal sealed class CategoryConfig : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.Property(x => x.Name).HasMaxLength(100);
        b.Property(x => x.Slug).HasMaxLength(120);
        b.Property(x => x.ImageUrl).HasMaxLength(500);
        b.HasIndex(x => x.Slug).IsUnique().HasFilter(Filters.NotDeleted);
    }
}

internal sealed class ProductConfig : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.Property(x => x.Name).HasMaxLength(150);
        b.Property(x => x.Slug).HasMaxLength(170);
        b.Property(x => x.ShortDescription).HasMaxLength(300);
        b.Property(x => x.Description).HasMaxLength(4000);
        b.Property(x => x.Ingredients).HasMaxLength(1000);
        b.Property(x => x.HsnCode).HasMaxLength(10);
        b.HasIndex(x => x.Slug).IsUnique().HasFilter(Filters.NotDeleted);
        b.HasIndex(x => new { x.CategoryId, x.IsActive });
        b.HasOne(x => x.Category).WithMany(c => c.Products).HasForeignKey(x => x.CategoryId);
        b.HasMany(x => x.Variants).WithOne(v => v.Product).HasForeignKey(v => v.ProductId);
        b.HasMany(x => x.Images).WithOne().HasForeignKey(i => i.ProductId);
    }
}

internal sealed class VariantConfig : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> b)
    {
        b.Property(x => x.Sku).HasMaxLength(40);
        b.Property(x => x.Name).HasMaxLength(80);
        b.HasIndex(x => x.Sku).IsUnique().HasFilter(Filters.NotDeleted);
        b.Ignore(x => x.AvailableQty);
        // Stock is updated by many flows, so guard against lost updates.
        b.Property(x => x.StockQty).IsConcurrencyToken();
        b.Property(x => x.ReservedQty).IsConcurrencyToken();
    }
}

internal sealed class ProductImageConfig : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> b)
    {
        b.Property(x => x.ImageUrl).HasMaxLength(500);
        b.Property(x => x.AltText).HasMaxLength(200);
    }
}

internal sealed class BannerConfig : IEntityTypeConfiguration<Banner>
{
    public void Configure(EntityTypeBuilder<Banner> b)
    {
        b.Property(x => x.ImageUrl).HasMaxLength(500);
        b.Property(x => x.LinkUrl).HasMaxLength(500);
    }
}

internal sealed class WeddingPackageConfig : IEntityTypeConfiguration<WeddingPackage>
{
    public void Configure(EntityTypeBuilder<WeddingPackage> b)
    {
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.ImageUrl).HasMaxLength(500);
    }
}

internal sealed class ReviewConfig : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> b)
    {
        b.Property(x => x.CustomerName).HasMaxLength(120);
        b.Property(x => x.City).HasMaxLength(80);
        b.Property(x => x.Mobile).HasMaxLength(15);
        b.Property(x => x.Occasion).HasMaxLength(40);
        b.Property(x => x.Comment).HasMaxLength(1000);
        // The public page lists approved reviews, newest first.
        b.HasIndex(x => new { x.Status, x.ApprovedAt });
    }
}

internal sealed class CouponConfig : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> b)
    {
        b.Property(x => x.Code).HasMaxLength(30);
        b.HasIndex(x => x.Code).IsUnique().HasFilter(Filters.NotDeleted);
    }
}

internal sealed class OrderConfig : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.Property(x => x.OrderNumber).HasMaxLength(40);
        b.Property(x => x.CustomerName).HasMaxLength(120);
        b.Property(x => x.CustomerMobile).HasMaxLength(15);
        b.Property(x => x.CustomerEmail).HasMaxLength(160);
        b.Property(x => x.AddressLine).HasMaxLength(500);
        b.Property(x => x.City).HasMaxLength(80);
        b.Property(x => x.Pincode).HasMaxLength(10);
        b.Property(x => x.Notes).HasMaxLength(1000);
        b.Property(x => x.CancelReason).HasMaxLength(500);
        b.Property(x => x.DeliveryOtp).HasMaxLength(6);
        b.Property(x => x.CouponCode).HasMaxLength(30);
        b.HasIndex(x => x.OrderNumber).IsUnique();
        b.HasIndex(x => new { x.UserId, x.Status, x.CreatedAt });
        b.HasIndex(x => new { x.Status, x.CreatedAt });
        b.HasIndex(x => x.DeliveryPartnerId);
        b.HasOne(x => x.DeliveryPartner).WithMany().HasForeignKey(x => x.DeliveryPartnerId);
        b.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.OrderId);
        b.HasMany(x => x.History).WithOne().HasForeignKey(h => h.OrderId);
        b.Property(x => x.Status).IsConcurrencyToken();
    }
}

internal sealed class OrderItemConfig : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.Property(x => x.ProductName).HasMaxLength(150);
        b.Property(x => x.VariantName).HasMaxLength(80);
        b.Property(x => x.Sku).HasMaxLength(40);
        b.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId);
    }
}

internal sealed class OrderHistoryConfig : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> b) => b.Property(x => x.Remark).HasMaxLength(500);
}

internal sealed class BookingConfig : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> b)
    {
        b.Property(x => x.BookingNumber).HasMaxLength(40);
        b.Property(x => x.ContactName).HasMaxLength(120);
        b.Property(x => x.Mobile).HasMaxLength(15);
        b.Property(x => x.Email).HasMaxLength(160);
        b.Property(x => x.EventTimeSlot).HasMaxLength(40);
        b.Property(x => x.VenueName).HasMaxLength(150);
        b.Property(x => x.VenueAddress).HasMaxLength(500);
        b.Property(x => x.SpecialRequest).HasMaxLength(1000);
        b.Property(x => x.AdminNotes).HasMaxLength(1000);
        b.Ignore(x => x.BalanceAmount);
        b.Ignore(x => x.RequiredAdvance);
        b.HasIndex(x => x.BookingNumber).IsUnique();
        b.HasIndex(x => new { x.EventDate, x.Status });
        b.HasOne(x => x.Package).WithMany().HasForeignKey(x => x.PackageId);
    }
}

internal sealed class RawMaterialConfig : IEntityTypeConfiguration<RawMaterial>
{
    public void Configure(EntityTypeBuilder<RawMaterial> b)
    {
        b.Property(x => x.Name).HasMaxLength(100);
        b.Property(x => x.Unit).HasMaxLength(20);
        b.Property(x => x.MinStockLevel).HasPrecision(18, 3);
        b.Property(x => x.CurrentStock).HasPrecision(18, 3).IsConcurrencyToken();
        b.Ignore(x => x.IsLow);
    }
}

internal sealed class RawMaterialTxnConfig : IEntityTypeConfiguration<RawMaterialTxn>
{
    public void Configure(EntityTypeBuilder<RawMaterialTxn> b)
    {
        b.Property(x => x.Quantity).HasPrecision(18, 3);
        b.Property(x => x.BalanceAfter).HasPrecision(18, 3);
        b.Property(x => x.Remark).HasMaxLength(300);
        b.Property(x => x.RefNo).HasMaxLength(40);
        b.HasIndex(x => new { x.RawMaterialId, x.CreatedAt });
        b.HasOne(x => x.RawMaterial).WithMany().HasForeignKey(x => x.RawMaterialId);
    }
}

internal sealed class RecipeItemConfig : IEntityTypeConfiguration<RecipeItem>
{
    public void Configure(EntityTypeBuilder<RecipeItem> b)
    {
        b.Property(x => x.QtyPerUnit).HasPrecision(18, 4);
        b.HasIndex(x => new { x.VariantId, x.RawMaterialId }).IsUnique().HasFilter(Filters.NotDeleted);
        b.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId);
        b.HasOne(x => x.RawMaterial).WithMany().HasForeignKey(x => x.RawMaterialId);
    }
}

internal sealed class ProductionBatchConfig : IEntityTypeConfiguration<ProductionBatch>
{
    public void Configure(EntityTypeBuilder<ProductionBatch> b)
    {
        b.Property(x => x.BatchNo).HasMaxLength(40);
        b.HasIndex(x => x.BatchNo).IsUnique();
        b.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId);
    }
}

internal sealed class HawkerConfig : IEntityTypeConfiguration<Hawker>
{
    public void Configure(EntityTypeBuilder<Hawker> b)
    {
        b.Property(x => x.Name).HasMaxLength(120);
        b.Property(x => x.Mobile).HasMaxLength(15);
        b.Property(x => x.Area).HasMaxLength(120);
        b.HasIndex(x => x.Mobile).IsUnique().HasFilter(Filters.NotDeleted);
        b.HasIndex(x => x.UserId);
        b.HasMany(x => x.Issues).WithOne(i => i.Hawker).HasForeignKey(i => i.HawkerId);
    }
}

internal sealed class HawkerIssueConfig : IEntityTypeConfiguration<HawkerStockIssue>
{
    public void Configure(EntityTypeBuilder<HawkerStockIssue> b)
    {
        b.Ignore(x => x.IssuedValue);
        b.HasIndex(x => new { x.HawkerId, x.IssueDate });
        b.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.IssueId);
    }
}

internal sealed class HawkerIssueItemConfig : IEntityTypeConfiguration<HawkerStockIssueItem>
{
    public void Configure(EntityTypeBuilder<HawkerStockIssueItem> b)
    {
        b.Property(x => x.Sku).HasMaxLength(40);
        b.Property(x => x.Name).HasMaxLength(200);
        b.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId);
    }
}

internal sealed class AuditLogConfig : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.Property(x => x.Action).HasMaxLength(20);
        b.Property(x => x.EntityName).HasMaxLength(80);
        b.Property(x => x.EntityId).HasMaxLength(40);
        b.Property(x => x.Changes).HasColumnType("nvarchar(max)");
        b.HasIndex(x => x.At);
    }
}
