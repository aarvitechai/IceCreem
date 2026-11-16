using IceCream.Infrastructure;
using IceCream.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IceCream.UnitTests.Infrastructure;

public class PostgresSetupTests
{
    [Fact]
    public void Postgres_migrations_match_the_model()
    {
        // The app runs migrations on start; EF refuses to migrate when the model has drifted.
        using var db = new PostgresDesignTimeFactory().CreateDbContext([]);

        Assert.False(db.Database.HasPendingModelChanges());
    }

    [Fact]
    public void Soft_delete_filters_use_postgres_syntax()
    {
        using var db = new PostgresDesignTimeFactory().CreateDbContext([]);

        var filters = db.Model.GetEntityTypes().SelectMany(e => e.GetIndexes()).Select(i => i.GetFilter()).Where(f => f is not null).ToList();

        Assert.NotEmpty(filters);
        Assert.All(filters, f => Assert.Equal("\"IsDeleted\" = false", f));
    }

    [Fact]
    public void Render_style_url_becomes_npgsql_connection_string()
    {
        var result = DependencyInjection.ToNpgsqlConnectionString("postgresql://ice:p%40ss@dpg-abc-a:5432/icecream");

        Assert.Contains("Host=dpg-abc-a", result);
        Assert.Contains("Port=5432", result);
        Assert.Contains("Username=ice", result);
        Assert.Contains("Password=p@ss", result);
        Assert.Contains("Database=icecream", result);
    }

    [Fact]
    public void Url_without_port_uses_default()
    {
        var result = DependencyInjection.ToNpgsqlConnectionString("postgres://ice:pw@host/db");

        Assert.Contains("Port=5432", result);
    }

    [Fact]
    public void Key_value_connection_string_is_kept()
    {
        const string conn = "Host=localhost;Database=x";

        Assert.Equal(conn, DependencyInjection.ToNpgsqlConnectionString(conn));
    }
}
