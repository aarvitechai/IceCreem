using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

public class Order : BaseEntity
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedMoves = new()
    {
        [OrderStatus.Placed] = [OrderStatus.Confirmed, OrderStatus.Cancelled],
        [OrderStatus.Confirmed] = [OrderStatus.InProduction, OrderStatus.Packed, OrderStatus.Cancelled],
        [OrderStatus.InProduction] = [OrderStatus.Packed, OrderStatus.Cancelled],
        [OrderStatus.Packed] = [OrderStatus.OutForDelivery],
        [OrderStatus.OutForDelivery] = [OrderStatus.Delivered, OrderStatus.Returned],
        [OrderStatus.Delivered] = [OrderStatus.Returned],
        [OrderStatus.Cancelled] = [],
        [OrderStatus.Returned] = []
    };

    public string OrderNumber { get; set; } = string.Empty;
    public OrderType OrderType { get; set; } = OrderType.Retail;
    public long? UserId { get; set; }

    // Ship-to snapshot: kept on the order so later profile edits do not change history.
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerMobile { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;

    public OrderStatus Status { get; private set; } = OrderStatus.Placed;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;

    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal GstAmount { get; set; }
    public decimal DeliveryCharge { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? Notes { get; set; }
    public string? CancelReason { get; set; }

    // Delivery
    public long? DeliveryPartnerId { get; set; }
    public User? DeliveryPartner { get; set; }
    public string? DeliveryOtp { get; set; }
    public double? LastLatitude { get; set; }
    public double? LastLongitude { get; set; }
    public DateTime? LastLocationAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    public List<OrderItem> Items { get; set; } = [];
    public List<OrderStatusHistory> History { get; set; } = [];

    public static bool CanMove(OrderStatus from, OrderStatus to) => AllowedMoves[from].Contains(to);

    public static IReadOnlyList<OrderStatus> NextStatuses(OrderStatus from) => AllowedMoves[from];

    /// <summary>
    /// Moves the order forward and applies the stock rules:
    /// confirm reserves stock, cancel releases it, deliver deducts it.
    /// Items must be loaded with their Variant.
    /// </summary>
    public void ChangeStatus(OrderStatus to, long? changedBy, DateTime now, string? remark = null)
    {
        if (!CanMove(Status, to))
            throw new DomainException($"Order cannot move from {Status} to {to}.");

        var from = Status;

        if (to == OrderStatus.Confirmed)
            ForEachVariant((v, qty) => v.Reserve(qty));

        if (to == OrderStatus.Cancelled)
        {
            if (string.IsNullOrWhiteSpace(remark))
                throw new DomainException("Cancel reason is required.");
            if (from != OrderStatus.Placed)
                ForEachVariant((v, qty) => v.Release(qty));
            CancelReason = remark;
        }

        if (to == OrderStatus.Delivered)
        {
            ForEachVariant((v, qty) => v.Deduct(qty));
            DeliveredAt = now;
            if (PaymentMethod == PaymentMethod.CashOnDelivery)
            {
                PaidAmount = GrandTotal;
                PaymentStatus = PaymentStatus.Paid;
            }
        }

        Status = to;
        History.Add(new OrderStatusHistory
        {
            FromStatus = from,
            ToStatus = to,
            ChangedBy = changedBy,
            ChangedAt = now,
            Remark = remark
        });
    }

    /// <summary>Recalculates totals. Prices include GST, so GST is pulled out of the line total.</summary>
    public void CalculateTotals(decimal discount, decimal freeDeliveryAbove, decimal deliveryCharge)
    {
        SubTotal = Items.Sum(i => i.LineTotal);
        GstAmount = Math.Round(Items.Sum(i => i.LineTotal * i.GstPercent / (100 + i.GstPercent)), 2);
        DiscountAmount = Math.Min(discount, SubTotal);
        DeliveryCharge = SubTotal - DiscountAmount >= freeDeliveryAbove ? 0 : deliveryCharge;
        GrandTotal = SubTotal - DiscountAmount + DeliveryCharge;
    }

    private void ForEachVariant(Action<ProductVariant, int> action)
    {
        foreach (var item in Items)
        {
            if (item.Variant is null)
                throw new InvalidOperationException("Order items must be loaded with variants.");
            action(item.Variant, item.Quantity);
        }
    }
}

public class OrderItem : BaseEntity
{
    public long OrderId { get; set; }
    public long VariantId { get; set; }
    public ProductVariant? Variant { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal GstPercent { get; set; }
    public decimal LineTotal { get; set; }
}

public class OrderStatusHistory : BaseEntity
{
    public long OrderId { get; set; }
    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public long? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Remark { get; set; }
}

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public bool IsPercent { get; set; } = true;
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal MaxDiscount { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public int UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Returns the discount for the given amount, or throws if the coupon cannot be used.</summary>
    public decimal CalculateDiscount(decimal amount, DateTime now)
    {
        if (!IsActive || now < ValidFrom || now > ValidTo)
            throw new DomainException("Coupon is not valid right now.");
        if (UsageLimit > 0 && UsedCount >= UsageLimit)
            throw new DomainException("Coupon usage limit reached.");
        if (amount < MinOrderAmount)
            throw new DomainException($"Minimum order amount for this coupon is {MinOrderAmount}.");

        var discount = IsPercent ? amount * Value / 100 : Value;
        if (MaxDiscount > 0) discount = Math.Min(discount, MaxDiscount);
        return Math.Round(Math.Min(discount, amount), 2);
    }
}
