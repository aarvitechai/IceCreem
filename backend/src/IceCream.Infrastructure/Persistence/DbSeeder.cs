using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IceCream.Infrastructure.Persistence;

/// <summary>Creates demo users and catalog on an empty database. Safe to run on every start.</summary>
public sealed class DbSeeder(AppDbContext db, IPasswordService passwords, IClock clock, IConfiguration config, ILogger<DbSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct)) return;

        var password = config["Seed:DefaultPassword"];
        if (string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("Seed:DefaultPassword is not set. Skipping seed data.");
            return;
        }

        SeedUsers(password);
        var variants = SeedCatalog();
        SeedOperations(variants);
        await db.SaveChangesAsync(ct);

        var hawkerUser = await db.Users.FirstAsync(u => u.Role == UserRole.Hawker, ct);
        db.Hawkers.Add(new Hawker
        {
            UserId = hawkerUser.Id, Name = hawkerUser.FullName, Mobile = hawkerUser.Mobile,
            Area = "Civil Lines Route", CommissionPercent = 12, CreditLimit = 5000
        });
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Seed data created.");
    }

    private void SeedUsers(string password)
    {
        (string Name, string Email, string Mobile, UserRole Role)[] users =
        [
            ("Super Admin", "superadmin@icecream.local", "9000000001", UserRole.SuperAdmin),
            ("Factory Admin", "admin@icecream.local", "9000000002", UserRole.Admin),
            ("Production Staff", "staff@icecream.local", "9000000003", UserRole.Staff),
            ("Ramesh Hawker", "hawker@icecream.local", "9000000004", UserRole.Hawker),
            ("Suresh Delivery", "delivery@icecream.local", "9000000005", UserRole.Delivery),
            ("Priya Customer", "customer@icecream.local", "9000000006", UserRole.Customer)
        ];

        foreach (var u in users)
        {
            var user = new User { FullName = u.Name, Email = u.Email, Mobile = u.Mobile, Role = u.Role };
            user.PasswordHash = passwords.Hash(user, password);
            db.Users.Add(user);
        }
    }

    private Dictionary<string, ProductVariant> SeedCatalog()
    {
        var cats = new Dictionary<string, Category>
        {
            ["tubs"] = new() { Name = "Tubs and Cups", Slug = "tubs", ImageUrl = "/images/categories/tubs.svg", SortOrder = 1 },
            ["cones"] = new() { Name = "Cones", Slug = "cones", ImageUrl = "/images/categories/cones.svg", SortOrder = 2 },
            ["kulfi"] = new() { Name = "Kulfi", Slug = "kulfi", ImageUrl = "/images/categories/kulfi.svg", SortOrder = 3 },
            ["bars"] = new() { Name = "Sticks and Bars", Slug = "bars", ImageUrl = "/images/categories/bars.svg", SortOrder = 4 },
            ["family"] = new() { Name = "Family Packs", Slug = "family", ImageUrl = "/images/categories/family.svg", SortOrder = 5 }
        };
        db.Categories.AddRange(cats.Values);

        var variants = new Dictionary<string, ProductVariant>();

        void Add(string cat, string name, string slug, string shortDesc, string ingredients, bool featured,
            params (string Sku, string Name, decimal Mrp, decimal Price, int Stock)[] packs)
        {
            var product = new Product
            {
                Category = cats[cat], Name = name, Slug = slug, ShortDescription = shortDesc,
                Description = $"{shortDesc} Made fresh every morning in our factory with farm milk and real ingredients. No artificial colours.",
                Ingredients = ingredients, IsFeatured = featured,
                Images = [new ProductImage { ImageUrl = $"/images/products/{slug}.svg", AltText = name, IsPrimary = true }]
            };
            foreach (var p in packs)
            {
                var v = new ProductVariant
                {
                    Sku = p.Sku, Name = p.Name, Mrp = p.Mrp, SellingPrice = p.Price,
                    WholesalePrice = Math.Round(p.Price * 0.75m), StockQty = p.Stock
                };
                product.Variants.Add(v);
                variants[p.Sku] = v;
            }
            db.Products.Add(product);
        }

        Add("tubs", "Classic Vanilla", "classic-vanilla", "Smooth and creamy vanilla bean ice cream.",
            "Milk, cream, sugar, vanilla", true,
            ("VAN-500", "500 ml tub", 160, 150, 120), ("VAN-1000", "1 litre tub", 280, 260, 80));
        Add("tubs", "Belgian Chocolate", "belgian-chocolate", "Rich dark chocolate with chocolate chips.",
            "Milk, cream, sugar, cocoa, chocolate chips", true,
            ("CHO-500", "500 ml tub", 199, 180, 100), ("CHO-1000", "1 litre tub", 349, 320, 60));
        Add("tubs", "Alphonso Mango", "alphonso-mango", "Real Alphonso mango pulp in every scoop.",
            "Milk, cream, sugar, mango pulp", true,
            ("MAN-500", "500 ml tub", 180, 170, 90), ("MAN-1000", "1 litre tub", 320, 300, 50));
        Add("tubs", "Strawberry Swirl", "strawberry-swirl", "Fresh strawberry ice cream with berry swirl.",
            "Milk, cream, sugar, strawberry", false,
            ("STR-500", "500 ml tub", 170, 160, 70));
        Add("cones", "Butterscotch Crunch Cone", "butterscotch-cone", "Crunchy cone loaded with butterscotch bits.",
            "Milk, cream, sugar, butterscotch, wafer cone", true,
            ("BSC-1", "Single cone", 45, 40, 300), ("BSC-4", "Pack of 4", 170, 150, 80));
        Add("cones", "Double Chocolate Cone", "chocolate-cone", "Chocolate ice cream in a chocolate coated cone.",
            "Milk, cream, sugar, cocoa, wafer cone", false,
            ("CHC-1", "Single cone", 50, 45, 250));
        Add("kulfi", "Malai Kulfi", "malai-kulfi", "Traditional slow cooked malai kulfi.",
            "Milk, sugar, cardamom, dry fruits", true,
            ("KUL-1", "Single stick", 35, 30, 400), ("KUL-6", "Pack of 6", 190, 170, 60));
        Add("kulfi", "Kesar Pista Kulfi", "kesar-pista-kulfi", "Saffron and pistachio kulfi, wedding favourite.",
            "Milk, sugar, saffron, pistachio", false,
            ("KPK-1", "Single stick", 45, 40, 300));
        Add("bars", "Orange Candy Bar", "orange-bar", "Tangy orange ice candy, the summer classic.",
            "Water, sugar, orange juice", false,
            ("ORG-1", "Single bar", 15, 12, 500));
        Add("family", "Kesar Pista Family Pack", "kesar-pista-family", "Two litre party pack for the whole family.",
            "Milk, cream, sugar, saffron, pistachio", true,
            ("KPF-2000", "2 litre pack", 499, 450, 40));

        db.Banners.AddRange(
            new Banner { Title = "Freshly churned. Delivered cold.", Subtitle = "Desired Ice Cream is made every morning with farm milk and real fruit. Order online or on WhatsApp.", ImageUrl = "/images/banners/hero-1.svg", LinkUrl = "/products", SortOrder = 1 },
            new Banner { Title = "Make your wedding sweeter", Subtitle = "Live ice cream counters and kulfi carts for 100 to 2000 guests.", ImageUrl = "/images/banners/hero-2.svg", LinkUrl = "/wedding", SortOrder = 2 },
            new Banner { Title = "Real Alphonso mango", Subtitle = "Our best seller tub, made with real mango pulp.", ImageUrl = "/images/banners/hero-3.svg", LinkUrl = "/products/alphonso-mango", SortOrder = 3 },
            new Banner { Title = "10 percent off your first order", Subtitle = "Use code WELCOME10", ImageUrl = "/images/banners/offer-1.svg", LinkUrl = "/products", Position = BannerPosition.Offer, SortOrder = 1 },
            new Banner { Title = "Free delivery above Rs 499", Subtitle = "Across the city", ImageUrl = "/images/banners/offer-2.svg", LinkUrl = "/products", Position = BannerPosition.Offer, SortOrder = 2 });

        db.WeddingPackages.AddRange(
            new WeddingPackage { Name = "Silver", Description = "3 flavours, cups and cones, 1 serving counter.", MinGuests = 100, PricePerHead = 80, ImageUrl = "/images/packages/silver.svg" },
            new WeddingPackage { Name = "Gold", Description = "5 flavours, kulfi cart, live counter with 2 staff.", MinGuests = 150, PricePerHead = 120, ImageUrl = "/images/packages/gold.svg" },
            new WeddingPackage { Name = "Platinum", Description = "8 flavours, kulfi cart, sundae bar, themed counter and 4 staff.", MinGuests = 200, PricePerHead = 180, ImageUrl = "/images/packages/platinum.svg" });

        var now = clock.UtcNow;
        db.Coupons.AddRange(
            new Coupon { Code = "WELCOME10", IsPercent = true, Value = 10, MinOrderAmount = 300, MaxDiscount = 100, ValidFrom = now.AddDays(-1), ValidTo = now.AddYears(1) },
            new Coupon { Code = "FLAT50", IsPercent = false, Value = 50, MinOrderAmount = 500, ValidFrom = now.AddDays(-1), ValidTo = now.AddYears(1) });

        return variants;
    }

    private void SeedOperations(Dictionary<string, ProductVariant> variants)
    {
        RawMaterial Material(string name, string unit, decimal min, decimal opening)
        {
            var m = new RawMaterial { Name = name, Unit = unit, MinStockLevel = min };
            db.RawMaterialTxns.Add(m.Apply(StockTxnType.In, opening, "Opening stock"));
            db.RawMaterials.Add(m);
            return m;
        }

        var milk = Material("Milk", "litre", 200, 1000);
        var cream = Material("Cream", "litre", 50, 200);
        var sugar = Material("Sugar", "kg", 50, 300);
        var cocoa = Material("Cocoa powder", "kg", 10, 40);
        var mango = Material("Mango pulp", "kg", 20, 15); // low on purpose, shows the alert
        var tub = Material("500 ml tub", "piece", 100, 800);
        Material("Wafer cone", "piece", 200, 1500);

        void Recipe(string sku, params (RawMaterial M, decimal Qty)[] items)
        {
            foreach (var (m, qty) in items)
                db.RecipeItems.Add(new RecipeItem { Variant = variants[sku], RawMaterial = m, QtyPerUnit = qty });
        }

        Recipe("VAN-500", (milk, 0.35m), (cream, 0.10m), (sugar, 0.08m), (tub, 1));
        Recipe("CHO-500", (milk, 0.30m), (cream, 0.12m), (sugar, 0.08m), (cocoa, 0.03m), (tub, 1));
        Recipe("MAN-500", (milk, 0.30m), (cream, 0.10m), (sugar, 0.06m), (mango, 0.12m), (tub, 1));
    }
}
