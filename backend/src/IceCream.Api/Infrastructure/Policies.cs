using IceCream.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace IceCream.Api.Infrastructure;

/// <summary>Role based policies. Higher roles are included in lower policies.</summary>
public static class Policies
{
    public const string SuperAdmin = nameof(SuperAdmin);
    public const string Admin = nameof(Admin);
    public const string Staff = nameof(Staff);
    public const string Delivery = nameof(Delivery);
    public const string Hawker = nameof(Hawker);

    public static void Configure(AuthorizationOptions options)
    {
        Add(options, SuperAdmin, UserRole.SuperAdmin);
        Add(options, Admin, UserRole.SuperAdmin, UserRole.Admin);
        Add(options, Staff, UserRole.SuperAdmin, UserRole.Admin, UserRole.Staff);
        Add(options, Delivery, UserRole.Delivery);
        Add(options, Hawker, UserRole.Hawker);
    }

    private static void Add(AuthorizationOptions options, string name, params UserRole[] roles) =>
        options.AddPolicy(name, p => p.RequireRole(roles.Select(r => r.ToString())));
}
