using Microsoft.AspNetCore.RateLimiting;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using IceCream.Api.Hubs;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Infrastructure.Persistence;
using IceCream.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace IceCream.Api.Infrastructure;

/// <summary>
/// Named limits. Each has its own bucket per visitor, so browsing or tracking never uses up the
/// allowance for logging in or placing an order.
/// </summary>
public static class RateLimits
{
    /// <summary>Login and register: tight, against password guessing.</summary>
    public const string Auth = "auth";

    /// <summary>Placing orders, bookings and reviews.</summary>
    public const string Submit = "submit";

    /// <summary>Public order tracking, which live pages call again on every update.</summary>
    public const string Track = "track";
}

public static class CachePolicies
{
    public const string Catalog = "catalog";
    public const string CatalogTag = "catalog";
}

public static class ServiceSetup
{
    public static IServiceCollection AddApi(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<BusinessSettings>(config.GetSection(BusinessSettings.Section));

        services.AddControllers(o => o.Filters.Add<ValidationFilter>())
            .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        // Bad JSON or wrong types also return the standard envelope.
        services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(o => o.InvalidModelStateResponseFactory = ctx =>
            new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(ApiResponse.Fail("Invalid request.",
                ctx.ModelState.Where(e => e.Value?.Errors.Count > 0)
                    .ToDictionary(e => e.Key, e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray()))));

        services.AddExceptionHandler<ExceptionHandler>();
        services.AddProblemDetails();
        services.AddOpenApi();
        services.AddSignalR();
        services.AddOutputCache(o => o.AddPolicy(CachePolicies.Catalog, p => p
            .Expire(TimeSpan.FromSeconds(60))
            .SetVaryByQuery("*")
            .Tag(CachePolicies.CatalogTag)));
        services.AddSingleton<IRealtimeNotifier, SignalRNotifier>();

        services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

        services.Configure<ForwardedHeadersOptions>(o =>
        {
            o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            o.KnownIPNetworks.Clear();
            o.KnownProxies.Clear();
        });

        var origins = config.GetSection("Cors:Origins").Get<string[]>() ?? [];
        services.AddCors(o => o.AddDefaultPolicy(p =>
            p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

        // Browsers reach the API through the Next.js server, so every request arrives from that server.
        // The global limit is per caller (the web server counts as one), so it must cover the whole site.
        // Sensitive endpoints are limited per real visitor instead (see VisitorKey).
        var globalLimit = config.GetValue("RateLimits:GlobalPerMinute", 3000);
        var authLimit = config.GetValue("RateLimits:AuthPerMinute", 10);
        var submitLimit = config.GetValue("RateLimits:SubmitPerMinute", 20);
        var trackLimit = config.GetValue("RateLimits:TrackPerMinute", 60);
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetFixedWindowLimiter(CallerIp(ctx),
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = globalLimit, Window = TimeSpan.FromMinutes(1) }));
            AddVisitorPolicy(o, RateLimits.Auth, authLimit);
            AddVisitorPolicy(o, RateLimits.Submit, submitLimit);
            AddVisitorPolicy(o, RateLimits.Track, trackLimit);
        });

        AddAuth(services, config);
        return services;
    }

    private static void AddAuth(IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection(JwtSettings.Section).Get<JwtSettings>() ?? new JwtSettings();
        if (jwt.Key.Length < 32) throw new InvalidOperationException("Jwt:Key must be at least 32 characters.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.MapInboundClaims = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = System.Security.Claims.ClaimTypes.Name,
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };
                // Browsers cannot send headers on WebSocket, so SignalR passes the token in the query.
                o.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        var token = ctx.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                            ctx.Token = token;
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(Policies.Configure);
    }

    private static void AddVisitorPolicy(RateLimiterOptions o, string name, int perMinute) =>
        o.AddPolicy(name, ctx => RateLimitPartition.GetFixedWindowLimiter($"{name}:{VisitorKey(ctx)}",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = perMinute, Window = TimeSpan.FromMinutes(1) }));

    /// <summary>The machine that called us (after the hosting load balancer). For site traffic this is the web server.</summary>
    internal static string CallerIp(HttpContext ctx) => ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    /// <summary>
    /// The visitor behind the web server: the first address in X-Forwarded-For, which the load balancer in front
    /// of the web server fills in. Without the header (direct calls) it falls back to the caller.
    /// A direct caller could send a fake header to get a fresh bucket, so these limits are a courtesy limit;
    /// brute force on logins is stopped by account lockout and everything stays under the global limit.
    /// </summary>
    internal static string VisitorKey(HttpContext ctx)
    {
        var forwarded = ctx.Request.Headers["X-Forwarded-For"].ToString();
        var first = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        return string.IsNullOrEmpty(first) ? CallerIp(ctx) : first;
    }

    /// <summary>Applies migrations (or creates the schema for non relational test databases) and seeds demo data.</summary>
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        if (!app.Configuration.GetValue("Database:MigrateOnStartup", false)) return;

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (db.Database.IsRelational()) await db.Database.MigrateAsync();
        else await db.Database.EnsureCreatedAsync();

        await scope.ServiceProvider.GetRequiredService<DbSeeder>().SeedAsync();
    }
}
