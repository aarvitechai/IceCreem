using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IceCream.Infrastructure.Persistence;

// Used only by "dotnet ef" when it creates migrations.
//
// Order matters. IDesignTimeDbContextFactory<T> is covariant, so the Postgres factory also counts as a
// factory for AppDbContext, and the tools keep the first factory they meet for each context. Keep the
// SQL Server factory first in this file: then "--context AppDbContext" builds a SQL Server context and
// "--context PostgresAppDbContext" still gets the Postgres one. Check with "dotnet ef migrations list --verbose".

/// <summary>Builds the SQL Server context for migrations in Persistence/Migrations.</summary>
public sealed class AppDbContextDesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=localhost;Database=icecream_design;Trusted_Connection=True;TrustServerCertificate=True")
            .Options);
}

/// <summary>Builds the Postgres context for migrations in Persistence/Migrations/Postgres.</summary>
public sealed class PostgresDesignTimeFactory : IDesignTimeDbContextFactory<PostgresAppDbContext>
{
    public PostgresAppDbContext CreateDbContext(string[] args)
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        return new(new DbContextOptionsBuilder<PostgresAppDbContext>()
            .UseNpgsql("Host=localhost;Database=icecream_design")
            .Options);
    }
}
