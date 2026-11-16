using System.Security.Cryptography;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IceCream.Application.Features.Orders;

public sealed class OrderService(
    IAppDbContext db, ICurrentUser currentUser, IClock clock, IRealtimeNotifier notifier, IOptions<BusinessSettings> settings)
{
    private readonly BusinessSettings _rules = settings.Value;

    // ---------- Checkout ----------

    public async Task<CheckoutSummary> SummaryAsync(CheckoutRequest req, CancellationToken ct)
    {
        var lines = await BuildLinesAsync(req.Items, ct);
        var order = new Order { Items = lines.Select(l => l.Item).ToList() };

        decimal discount = 0;
        string? couponMessage = null;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            try
            {
                discount = await DiscountAsync(req.CouponCode, order.Items.Sum(i => i.LineTotal), ct);
                couponMessage = "Coupon applied.";
            }
            catch (DomainException ex)
            {
                couponMessage = ex.Message;
            }
        }

        order.CalculateTotals(discount, _rules.FreeDeliveryAbove, _rules.DeliveryCharge);
        return new CheckoutSummary(
            lines.Select(l => new SummaryLine(l.Item.VariantId, l.Item.ProductName, l.Item.VariantName, l.Item.Sku, l.ImageUrl,
                l.Item.UnitPrice, l.Item.Quantity, l.Item.LineTotal, Math.Max(0, l.Item.Variant!.AvailableQty))).ToList(),
            order.SubTotal, order.DiscountAmount, order.GstAmount, order.DeliveryCharge, order.GrandTotal,
            discount > 0 ? req.CouponCode!.Trim().ToUpperInvariant() : null, couponMessage);
    }

    public async Task<OrderDto> PlaceAsync(PlaceOrderRequest req, CancellationToken ct)
    {
        var lines = await BuildLinesAsync(req.Items, ct);
        foreach (var (item, _) in lines)
            if (item.Variant!.AvailableQty < item.Quantity)
                throw new DomainException($"{item.ProductName} ({item.VariantName}) has only {Math.Max(0, item.Variant.AvailableQty)} left.");

        var order = new Order
        {
            OrderNumber = $"TMP-{Guid.NewGuid():N}",
            OrderType = OrderType.Retail,
            UserId = currentUser.UserId,
            CustomerName = req.CustomerName.Trim(),
            CustomerMobile = req.Mobile,
            CustomerEmail = req.Email?.Trim(),
            AddressLine = req.AddressLine.Trim(),
            City = req.City.Trim(),
            Pincode = req.Pincode,
            Notes = req.Notes?.Trim(),
            PaymentMethod = req.PaymentMethod,
            Items = lines.Select(l => l.Item).ToList()
        };

        decimal discount = 0;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            var code = req.CouponCode.Trim().ToUpperInvariant();
            var coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Code == code, ct)
                ?? throw new DomainException("Coupon code is not valid.");
            discount = coupon.CalculateDiscount(order.Items.Sum(i => i.LineTotal), clock.UtcNow);
            coupon.UsedCount++;
            order.CouponCode = code;
        }

        order.CalculateTotals(discount, _rules.FreeDeliveryAbove, _rules.DeliveryCharge);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        // Readable number from the identity value: ICE-2026-000123.
        order.OrderNumber = $"ICE-{clock.Today.Year}-{order.Id:D6}";
        await db.SaveChangesAsync(ct);

        await notifier.OrderCreated(order.OrderNumber, order.GrandTotal, ct);
        return ToDto(order, includeOtp: false);
    }

    // ---------- Customer ----------

    public async Task<PagedResult<OrderRow>> MyOrdersAsync(PageQuery page, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return await Rows(db.Orders.Where(o => o.UserId == userId)).ToPagedAsync(page, ct);
    }

    public async Task<OrderDto> GetAsync(long id, CancellationToken ct)
    {
        var order = await LoadAsync(o => o.Id == id, ct) ?? throw new NotFoundException("Order", id);
        EnsureCanView(order);
        return ToDto(order, includeOtp: true);
    }

    /// <summary>Public tracking. The mobile number proves the caller placed the order.</summary>
    public async Task<OrderDto> TrackAsync(string orderNumber, string mobile, CancellationToken ct)
    {
        var number = orderNumber.Trim().ToUpperInvariant();
        var order = await LoadAsync(o => o.OrderNumber == number, ct);
        if (order is null || order.CustomerMobile != mobile.Trim())
            throw new NotFoundException("Order", orderNumber);
        return ToDto(order, includeOtp: true);
    }

    public async Task<OrderDto> CancelAsync(long id, string reason, CancellationToken ct)
    {
        var order = await LoadAsync(o => o.Id == id, ct, track: true) ?? throw new NotFoundException("Order", id);
        EnsureCanView(order);
        return await MoveAsync(order, OrderStatus.Cancelled, reason, ct);
    }

    // ---------- Admin ----------

    public async Task<PagedResult<OrderRow>> ListAsync(OrderQuery q, CancellationToken ct)
    {
        var query = db.Orders.AsQueryable();
        if (q.Status.HasValue) query = query.Where(o => o.Status == q.Status);
        if (q.From.HasValue) query = query.Where(o => o.CreatedAt >= q.From.Value.ToDateTime(TimeOnly.MinValue));
        if (q.To.HasValue) query = query.Where(o => o.CreatedAt < q.To.Value.AddDays(1).ToDateTime(TimeOnly.MinValue));
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLowerInvariant();
            query = query.Where(o => o.OrderNumber.ToLower().Contains(s) || o.CustomerName.ToLower().Contains(s) || o.CustomerMobile.ToLower().Contains(s));
        }
        return await Rows(query).ToPagedAsync(q, ct);
    }

    public async Task<OrderDto> ChangeStatusAsync(long id, ChangeStatusRequest req, CancellationToken ct)
    {
        var order = await LoadAsync(o => o.Id == id, ct, track: true) ?? throw new NotFoundException("Order", id);
        if (req.Status == OrderStatus.Delivered && order.DeliveryPartnerId.HasValue)
            throw new DomainException("This order has a delivery partner. Delivery is confirmed with the customer OTP.");
        return await MoveAsync(order, req.Status, req.Remark, ct);
    }

    public async Task<OrderDto> AssignDeliveryAsync(long id, long partnerId, CancellationToken ct)
    {
        var order = await LoadAsync(o => o.Id == id, ct, track: true) ?? throw new NotFoundException("Order", id);
        if (order.Status is not (OrderStatus.Confirmed or OrderStatus.InProduction or OrderStatus.Packed))
            throw new DomainException("Delivery can be assigned only to confirmed or packed orders.");

        var partner = await db.Users.FirstOrDefaultAsync(u => u.Id == partnerId && u.Role == UserRole.Delivery && u.IsActive, ct)
            ?? throw new NotFoundException("Delivery partner", partnerId);

        order.DeliveryPartnerId = partner.Id;
        order.DeliveryPartner = partner;
        order.DeliveryOtp ??= RandomNumberGenerator.GetInt32(1000, 10000).ToString();
        await db.SaveChangesAsync(ct);
        return ToDto(order, includeOtp: true);
    }

    public async Task<IReadOnlyList<UserDtoLite>> DeliveryPartnersAsync(CancellationToken ct) =>
        await db.Users.Where(u => u.Role == UserRole.Delivery && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new UserDtoLite(u.Id, u.FullName, u.Mobile))
            .ToListAsync(ct);

    // ---------- Delivery partner ----------

    public async Task<IReadOnlyList<OrderDto>> MyDeliveriesAsync(CancellationToken ct)
    {
        var me = currentUser.UserId ?? throw new UnauthorizedException();
        var since = clock.UtcNow.AddDays(-1);
        var orders = await Query()
            .Where(o => o.DeliveryPartnerId == me &&
                (o.Status == OrderStatus.Packed || o.Status == OrderStatus.OutForDelivery ||
                 o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.InProduction ||
                 (o.Status == OrderStatus.Delivered && o.DeliveredAt >= since)))
            .OrderBy(o => o.Status).ThenBy(o => o.CreatedAt)
            .ToListAsync(ct);
        return orders.Select(o => ToDto(o, includeOtp: false)).ToList();
    }

    public async Task<OrderDto> DeliveryUpdateAsync(long id, DeliveryStatusRequest req, CancellationToken ct)
    {
        var order = await MyAssignedAsync(id, ct);

        if (req.Status == OrderStatus.Delivered && order.DeliveryOtp != req.Otp?.Trim())
            throw new DomainException("OTP does not match. Ask the customer for the 4 digit code.");
        if (req.Status is not (OrderStatus.OutForDelivery or OrderStatus.Delivered or OrderStatus.Returned))
            throw new DomainException("Delivery partner can only pick up, deliver or return an order.");

        return await MoveAsync(order, req.Status, req.Status == OrderStatus.Returned ? "Returned by delivery partner" : null, ct);
    }

    public async Task UpdateLocationAsync(long id, LocationRequest req, CancellationToken ct)
    {
        var order = await MyAssignedAsync(id, ct);
        if (order.Status != OrderStatus.OutForDelivery) throw new DomainException("Location is shared only while out for delivery.");

        order.LastLatitude = req.Latitude;
        order.LastLongitude = req.Longitude;
        order.LastLocationAt = clock.UtcNow;
        await db.SaveChangesAsync(ct);
        await notifier.LocationUpdated(order.OrderNumber, req.Latitude, req.Longitude, ct);
    }

    // ---------- Helpers ----------

    private async Task<Order> MyAssignedAsync(long id, CancellationToken ct)
    {
        var me = currentUser.UserId ?? throw new UnauthorizedException();
        var order = await LoadAsync(o => o.Id == id, ct, track: true) ?? throw new NotFoundException("Order", id);
        if (order.DeliveryPartnerId != me) throw new ForbiddenException("This delivery is not assigned to you.");
        return order;
    }

    private async Task<OrderDto> MoveAsync(Order order, OrderStatus to, string? remark, CancellationToken ct)
    {
        order.ChangeStatus(to, currentUser.UserId, clock.UtcNow, remark);
        await db.SaveChangesAsync(ct);
        await notifier.OrderStatusChanged(order.OrderNumber, order.Status, ct);
        // The delivery partner must get the OTP from the customer, so never send it to them.
        return ToDto(order, includeOtp: currentUser.Role != UserRole.Delivery);
    }

    private void EnsureCanView(Order order)
    {
        if (currentUser.IsStaffOrAbove) return;
        if (currentUser.UserId is null || order.UserId != currentUser.UserId) throw new ForbiddenException();
    }

    private async Task<decimal> DiscountAsync(string code, decimal amount, CancellationToken ct)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var coupon = await db.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Code == normalized, ct)
            ?? throw new DomainException("Coupon code is not valid.");
        return coupon.CalculateDiscount(amount, clock.UtcNow);
    }

    private async Task<List<(OrderItem Item, string? ImageUrl)>> BuildLinesAsync(List<CartLine> cart, CancellationToken ct)
    {
        var merged = cart.GroupBy(c => c.VariantId).ToDictionary(g => g.Key, g => g.Sum(c => c.Quantity));
        var ids = merged.Keys.ToList();

        var variants = await db.ProductVariants
            .Include(v => v.Product).ThenInclude(p => p!.Images)
            .Where(v => ids.Contains(v.Id) && v.IsActive && v.Product!.IsActive)
            .ToListAsync(ct);

        if (variants.Count != ids.Count)
            throw new DomainException("Some items in your cart are no longer available. Please refresh your cart.");

        return variants.Select(v =>
        {
            var qty = merged[v.Id];
            var item = new OrderItem
            {
                VariantId = v.Id, Variant = v, ProductName = v.Product!.Name, VariantName = v.Name, Sku = v.Sku,
                Quantity = qty, UnitPrice = v.SellingPrice, GstPercent = v.Product.GstPercent, LineTotal = v.SellingPrice * qty
            };
            var image = v.Product.Images.OrderByDescending(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault();
            return (item, image);
        }).ToList();
    }

    private IQueryable<Order> Query() =>
        db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Variant)
            .Include(o => o.History.OrderBy(h => h.ChangedAt))
            .Include(o => o.DeliveryPartner);

    private async Task<Order?> LoadAsync(System.Linq.Expressions.Expression<Func<Order, bool>> where, CancellationToken ct, bool track = false)
    {
        var query = track ? Query() : Query().AsNoTracking();
        return await query.FirstOrDefaultAsync(where, ct);
    }

    private static IQueryable<OrderRow> Rows(IQueryable<Order> query) =>
        query.AsNoTracking().OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderRow(o.Id, o.OrderNumber, o.CustomerName, o.CustomerMobile, o.City, o.Status, o.PaymentStatus,
                o.GrandTotal, o.Items.Sum(i => i.Quantity), o.CreatedAt, o.DeliveryPartner != null ? o.DeliveryPartner.FullName : null));

    private static OrderDto ToDto(Order o, bool includeOtp) => new(
        o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.PaymentMethod,
        o.CustomerName, o.CustomerMobile, o.CustomerEmail, o.AddressLine, o.City, o.Pincode,
        o.SubTotal, o.DiscountAmount, o.GstAmount, o.DeliveryCharge, o.GrandTotal, o.PaidAmount,
        o.CouponCode, o.Notes, o.CancelReason, o.CreatedAt, o.DeliveredAt,
        o.DeliveryPartner?.FullName, o.DeliveryPartner?.Mobile, includeOtp ? o.DeliveryOtp : null,
        o.LastLatitude, o.LastLongitude, o.LastLocationAt,
        o.Items.Select(i => new OrderItemDto(i.VariantId, i.ProductName, i.VariantName, i.Sku, i.Quantity, i.UnitPrice, i.LineTotal)).ToList(),
        o.History.OrderBy(h => h.ChangedAt).Select(h => new OrderHistoryDto(h.FromStatus, h.ToStatus, h.ChangedAt, h.Remark)).ToList(),
        Order.NextStatuses(o.Status));
}

public sealed record UserDtoLite(long Id, string FullName, string Mobile);
