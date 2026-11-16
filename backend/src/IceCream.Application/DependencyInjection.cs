using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace IceCream.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Every feature service lives in Features/* and ends with "Service".
        var featureServices = typeof(DependencyInjection).Assembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false, IsPublic: true }
                && t.Namespace?.Contains(".Features.") == true
                && t.Name.EndsWith("Service", StringComparison.Ordinal));

        foreach (var type in featureServices)
            services.AddScoped(type);

        return services;
    }
}
