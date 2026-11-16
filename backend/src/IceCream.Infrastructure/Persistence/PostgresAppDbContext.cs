using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IceCream.Infrastructure.Persistence;

/// <summary>
/// Same model as <see cref="AppDbContext"/>, used when Database:Provider is Postgres.
/// A separate type keeps PostgreSQL migrations apart from SQL Server ones.
/// </summary>
public sealed class PostgresAppDbContext(DbContextOptions<PostgresAppDbContext> options) : AppDbContext(options)
{
    // We store every DateTime as UTC. Plain "timestamp" columns accept any DateTime kind.
    // Set here so migrations (design time) and the running app always use the same mapping.
    static PostgresAppDbContext() => AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
}

/// <summary>Lets "dotnet ef migrations add --context PostgresAppDbContext" build the model without a server.</summary>
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
