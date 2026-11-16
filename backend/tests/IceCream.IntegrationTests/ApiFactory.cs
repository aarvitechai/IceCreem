using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IceCream.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace IceCream.IntegrationTests;

/// <summary>
/// Runs the real API in memory with demo seed data. By default it uses the EF in memory database.
/// Set ICECREAM_TEST_SQLSERVER to a SQL Server connection string (without Database=) to run the same
/// tests against a real, throw away SQL Server database, which also checks the SQL that EF generates.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string Password = "Admin@123";
    private readonly string _dbName = $"icecream-tests-{Guid.NewGuid():N}";
    private static readonly string? SqlServer = Environment.GetEnvironmentVariable("ICECREAM_TEST_SQLSERVER");
    private string SqlConnection => $"{SqlServer!.TrimEnd(';')};Database={_dbName}";

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public ApiFactory() => ClientOptions.BaseAddress = new Uri("https://localhost");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", "unused");
        builder.UseSetting("Jwt:Key", "integration-test-signing-key-at-least-32-chars");
        builder.UseSetting("Seed:DefaultPassword", Password);
        builder.UseSetting("Database:MigrateOnStartup", "true");
        builder.UseSetting("RateLimits:AuthPerMinute", "10000");
        builder.UseSetting("RateLimits:GlobalPerMinute", "10000");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>((sp, o) =>
            {
                if (string.IsNullOrWhiteSpace(SqlServer)) o.UseInMemoryDatabase(_dbName);
                else o.UseSqlServer(SqlConnection);
                o.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
            });
        });
    }

    /// <summary>Drops the throw away SQL Server database after the test class finishes.</summary>
    public override async ValueTask DisposeAsync()
    {
        if (!string.IsNullOrWhiteSpace(SqlServer))
        {
            using var scope = Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureDeletedAsync();
        }
        await base.DisposeAsync();
    }

    public async Task<HttpClient> ClientAsAsync(string email)
    {
        var client = CreateClient();
        var res = await client.PostAsJsonAsync("/api/v1/auth/login", new { login = email, password = Password });
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<JsonElement>(Json);
        var token = body.GetProperty("data").GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}

public static class HttpExtensions
{
    public static async Task<JsonElement> DataAsync(this HttpResponseMessage res)
    {
        var body = await res.Content.ReadFromJsonAsync<JsonElement>(ApiFactory.Json);
        return body.GetProperty("data");
    }

    public static async Task<string?> MessageAsync(this HttpResponseMessage res)
    {
        var body = await res.Content.ReadFromJsonAsync<JsonElement>(ApiFactory.Json);
        return body.GetProperty("message").GetString();
    }
}
