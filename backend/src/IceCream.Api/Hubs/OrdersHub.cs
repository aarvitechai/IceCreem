using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace IceCream.Api.Hubs;

/// <summary>
/// Live order updates. Customers join "order-{number}" to watch one order.
/// Staff join "admins" to see new orders and every status change.
/// </summary>
public sealed class OrdersHub : Hub
{
    public const string Path = "/hubs/orders";
    public const string AdminsGroup = "admins";

    public static string OrderGroup(string orderNumber) => $"order-{orderNumber.ToUpperInvariant()}";

    public Task JoinOrder(string orderNumber) =>
        Groups.AddToGroupAsync(Context.ConnectionId, OrderGroup(orderNumber));

    public Task LeaveOrder(string orderNumber) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, OrderGroup(orderNumber));

    public Task JoinAdmins()
    {
        var user = Context.User;
        var isStaff = user is not null &&
            (user.IsInRole(nameof(UserRole.SuperAdmin)) || user.IsInRole(nameof(UserRole.Admin)) || user.IsInRole(nameof(UserRole.Staff)));
        if (!isStaff) throw new HubException("Not allowed.");

        return Groups.AddToGroupAsync(Context.ConnectionId, AdminsGroup);
    }
}

public sealed class SignalRNotifier(IHubContext<OrdersHub> hub) : IRealtimeNotifier
{
    public Task OrderCreated(string orderNumber, decimal total, CancellationToken ct = default) =>
        hub.Clients.Group(OrdersHub.AdminsGroup).SendAsync("OrderCreated", new { orderNumber, total }, ct);

    public Task OrderStatusChanged(string orderNumber, OrderStatus status, CancellationToken ct = default) =>
        hub.Clients.Groups(OrdersHub.OrderGroup(orderNumber), OrdersHub.AdminsGroup)
            .SendAsync("OrderStatusChanged", new { orderNumber, status = status.ToString() }, ct);

    public Task LocationUpdated(string orderNumber, double latitude, double longitude, CancellationToken ct = default) =>
        hub.Clients.Groups(OrdersHub.OrderGroup(orderNumber), OrdersHub.AdminsGroup)
            .SendAsync("LocationUpdated", new { orderNumber, latitude, longitude }, ct);
}
