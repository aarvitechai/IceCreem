using IceCream.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Application.Common.Interfaces;

/// <summary>
/// Unit of work over the database. EF Core DbSet already acts as a repository,
/// so services use this directly instead of an extra repository layer.
/// </summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Banner> Banners { get; }
    DbSet<WeddingPackage> WeddingPackages { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderStatusHistory> OrderStatusHistory { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<RawMaterial> RawMaterials { get; }
    DbSet<RawMaterialTxn> RawMaterialTxns { get; }
    DbSet<RecipeItem> RecipeItems { get; }
    DbSet<ProductionBatch> ProductionBatches { get; }
    DbSet<Hawker> Hawkers { get; }
    DbSet<HawkerStockIssue> HawkerStockIssues { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Review> Reviews { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
