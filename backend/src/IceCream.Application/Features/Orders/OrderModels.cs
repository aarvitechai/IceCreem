using FluentValidation;
using IceCream.Application.Common;
using IceCream.Domain.Enums;

namespace IceCream.Application.Features.Orders;

public sealed record CartLine(long VariantId, int Quantity);

public sealed record CheckoutRequest(List<CartLine> Items, string? CouponCode);

public sealed record SummaryLine(long VariantId, string ProductName, string VariantName, string Sku, string? ImageUrl,
    decimal UnitPrice, int Quantity, decimal LineTotal, int AvailableQty);

public sealed record CheckoutSummary(IReadOnlyList<SummaryLine> Lines, decimal SubTotal, decimal Discount, decimal Gst,
    decimal DeliveryCharge, decimal GrandTotal, string? CouponCode, string? CouponMessage);

public sealed record PlaceOrderRequest(
    List<CartLine> Items, string? CouponCode, string CustomerName, string Mobile, string? Email,
    string AddressLine, string City, string Pincode, string? Notes, PaymentMethod PaymentMethod = PaymentMethod.CashOnDelivery);

public sealed record OrderItemDto(long VariantId, string ProductName, string VariantName, string Sku, int Quantity, decimal UnitPrice, decimal LineTotal);
public sealed record OrderHistoryDto(OrderStatus FromStatus, OrderStatus ToStatus, DateTime ChangedAt, string? Remark);

public sealed record OrderDto(
    long Id, string OrderNumber, OrderStatus Status, PaymentStatus PaymentStatus, PaymentMethod PaymentMethod,
    string CustomerName, string CustomerMobile, string? CustomerEmail, string AddressLine, string City, string Pincode,
    decimal SubTotal, decimal Discount, decimal Gst, decimal DeliveryCharge, decimal GrandTotal, decimal PaidAmount,
    string? CouponCode, string? Notes, string? CancelReason, DateTime CreatedAt, DateTime? DeliveredAt,
    string? DeliveryPartnerName, string? DeliveryPartnerMobile, string? DeliveryOtp,
    double? LastLatitude, double? LastLongitude, DateTime? LastLocationAt,
    IReadOnlyList<OrderItemDto> Items, IReadOnlyList<OrderHistoryDto> History, IReadOnlyList<OrderStatus> NextStatuses);

public sealed record OrderRow(long Id, string OrderNumber, string CustomerName, string CustomerMobile, string City,
    OrderStatus Status, PaymentStatus PaymentStatus, decimal GrandTotal, int ItemCount, DateTime CreatedAt, string? DeliveryPartnerName);

public sealed record ChangeStatusRequest(OrderStatus Status, string? Remark);
public sealed record CancelRequest(string Reason);
public sealed record AssignDeliveryRequest(long PartnerId);
public sealed record DeliveryStatusRequest(OrderStatus Status, string? Otp);
public sealed record LocationRequest(double Latitude, double Longitude);

public sealed class OrderQuery : PageQuery
{
    public OrderStatus? Status { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
}

public sealed class CheckoutValidator : AbstractValidator<CheckoutRequest>
{
    public CheckoutValidator()
    {
        RuleFor(x => x.Items).NotEmpty().WithMessage("Cart is empty.").Must(i => i.Count <= 50);
        RuleForEach(x => x.Items).ChildRules(i =>
        {
            i.RuleFor(x => x.VariantId).GreaterThan(0);
            i.RuleFor(x => x.Quantity).InclusiveBetween(1, 500);
        });
    }
}

public sealed class PlaceOrderValidator : AbstractValidator<PlaceOrderRequest>
{
    public PlaceOrderValidator()
    {
        RuleFor(x => x.Items).NotEmpty().WithMessage("Cart is empty.").Must(i => i.Count <= 50);
        RuleForEach(x => x.Items).ChildRules(i =>
        {
            i.RuleFor(x => x.VariantId).GreaterThan(0);
            i.RuleFor(x => x.Quantity).InclusiveBetween(1, 500);
        });
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10 digit mobile number.");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.AddressLine).NotEmpty().MaximumLength(500);
        RuleFor(x => x.City).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Pincode).NotEmpty().Matches(@"^\d{6}$").WithMessage("Enter a valid 6 digit pincode.");
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.PaymentMethod).Equal(PaymentMethod.CashOnDelivery)
            .WithMessage("Online payment is not enabled yet. Please choose cash on delivery.");
    }
}

public sealed class ChangeStatusValidator : AbstractValidator<ChangeStatusRequest>
{
    public ChangeStatusValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Remark).MaximumLength(500);
    }
}

public sealed class CancelValidator : AbstractValidator<CancelRequest>
{
    public CancelValidator() => RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
}

public sealed class LocationValidator : AbstractValidator<LocationRequest>
{
    public LocationValidator()
    {
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);
    }
}
