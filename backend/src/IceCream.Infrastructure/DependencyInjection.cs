using IceCream.Application.Common.Interfaces;
using IceCream.Infrastructure.Persistence;
using IceCream.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace IceCream.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddOptions<JwtSettings>()
            .Bind(config.GetSection(JwtSettings.Section))
            .Validate(s => s.Key.Length >= 32, "Jwt:Key must be at least 32 characters.")
            .ValidateOnStart();

        services.AddScoped<AuditInterceptor>();
        AddDatabase(services, config);
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddHttpContextAccessor();
        services.AddSingleton<IClock, SystemClock>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IPasswordService, PasswordService>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddScoped<DbSeeder>();

        return services;
    }

    /// <summary>Database:Provider picks SqlServer (default) or Postgres. Both share one model.</summary>
    private static void AddDatabase(IServiceCollection services, IConfiguration config)
    {
        var conn = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is missing.");
        var provider = config["Database:Provider"] ?? "SqlServer";

        if (provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
        {
            // Must be set before Npgsql builds its type mappings; see PostgresAppDbContext.
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            services.AddDbContext<AppDbContext, PostgresAppDbContext>((sp, options) =>
            {
                options.UseNpgsql(ToNpgsqlConnectionString(conn), pg => pg
                    .EnableRetryOnFailure(3)
                    .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
                options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
            });
            return;
        }

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseSqlServer(conn, sql => sql
                .EnableRetryOnFailure(3)
                .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
            options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
        });
    }

    /// <summary>
    /// Hosts like Render give "postgresql://user:pass@host:port/db". Npgsql wants key=value pairs.
    /// </summary>
    public static string ToNpgsqlConnectionString(string conn)
    {
        if (!conn.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !conn.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return conn;

        var uri = new Uri(conn);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = Npgsql.SslMode.Prefer
        };
        return builder.ConnectionString;
    }
}
