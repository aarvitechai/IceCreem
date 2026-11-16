using System.Linq.Expressions;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Infrastructure.Persistence;

/// <summary>
/// Main database context. SQL Server by default; <see cref="PostgresAppDbContext"/> reuses the same model
/// for PostgreSQL with its own migrations.
/// </summary>
public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected AppDbContext(DbContextOptions options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<WeddingPackage> WeddingPackages => Set<WeddingPackage>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistory => Set<OrderStatusHistory>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<RawMaterial> RawMaterials => Set<RawMaterial>();
    public DbSet<RawMaterialTxn> RawMaterialTxns => Set<RawMaterialTxn>();
    public DbSet<RecipeItem> RecipeItems => Set<RecipeItem>();
    public DbSet<ProductionBatch> ProductionBatches => Set<ProductionBatch>();
    public DbSet<Hawker> Hawkers => Set<Hawker>();
    public DbSet<HawkerStockIssue> HawkerStockIssues => Set<HawkerStockIssue>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        builder.Properties<decimal>().HavePrecision(18, 2);
        builder.Properties<string>().HaveMaxLength(256);

        // Store enums as readable text, so reports and support queries are easy.
        builder.Properties<UserRole>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<OrderType>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<OrderStatus>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<PaymentStatus>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<PaymentMethod>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<EventType>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<BookingStatus>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<BannerPosition>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<StockTxnType>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<BatchStatus>().HaveConversion<string>().HaveMaxLength(20);
        builder.Properties<HawkerIssueStatus>().HaveConversion<string>().HaveMaxLength(20);
    }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var entity in b.Model.GetEntityTypes())
        {
            // Soft delete filter on every BaseEntity.
            if (typeof(BaseEntity).IsAssignableFrom(entity.ClrType))
            {
                var p = Expression.Parameter(entity.ClrType, "e");
                var body = Expression.Not(Expression.Property(p, nameof(BaseEntity.IsDeleted)));
                entity.SetQueryFilter(Expression.Lambda(body, p));
            }

            if (Database.IsNpgsql()) AdaptForPostgres(entity);

            // Restrict by default. Only aggregate children cascade with their parent.
            foreach (var fk in entity.GetForeignKeys())
            {
                var pair = (fk.DeclaringEntityType.ClrType, fk.PrincipalEntityType.ClrType);
                if (!CascadePairs.Contains(pair))
                    fk.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }
    }

    /// <summary>Configurations are written in SQL Server terms; translate the two spots that differ.</summary>
    private static void AdaptForPostgres(Microsoft.EntityFrameworkCore.Metadata.IMutableEntityType entity)
    {
        foreach (var index in entity.GetIndexes())
            if (index.GetFilter() == Filters.NotDeleted)
                index.SetFilter("\"IsDeleted\" = false");

        foreach (var property in entity.GetProperties())
            if (property.GetColumnType() == "nvarchar(max)")
                property.SetColumnType("text");
    }

    private static readonly HashSet<(Type Child, Type Parent)> CascadePairs =
    [
        (typeof(ProductVariant), typeof(Product)),
        (typeof(ProductImage), typeof(Product)),
        (typeof(OrderItem), typeof(Order)),
        (typeof(OrderStatusHistory), typeof(Order)),
        (typeof(HawkerStockIssueItem), typeof(HawkerStockIssue)),
        (typeof(RefreshToken), typeof(User))
    ];
}
