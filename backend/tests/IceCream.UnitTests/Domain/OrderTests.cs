using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;

namespace IceCream.UnitTests.Domain;

public class OrderTests
{
    private static readonly DateTime Now = new(2026, 11, 16, 10, 0, 0, DateTimeKind.Utc);

    private static (Order Order, ProductVariant Variant) NewOrder(int stock = 10, int qty = 3)
    {
        var variant = new ProductVariant { Id = 1, Sku = "VAN-500", StockQty = stock, SellingPrice = 100 };
        var order = new Order
        {
            PaymentMethod = PaymentMethod.CashOnDelivery,
            Items = [new OrderItem { VariantId = 1, Variant = variant, Quantity = qty, UnitPrice = 100, GstPercent = 18, LineTotal = qty * 100 }]
        };
        order.CalculateTotals(0, freeDeliveryAbove: 499, deliveryCharge: 40);
        return (order, variant);
    }

    [Fact]
    public void Confirm_reserves_stock()
    {
        var (order, variant) = NewOrder();

        order.ChangeStatus(OrderStatus.Confirmed, 1, Now);

        Assert.Equal(3, variant.ReservedQty);
        Assert.Equal(7, variant.AvailableQty);
        Assert.Single(order.History);
    }

    [Fact]
    public void Confirm_fails_when_stock_is_short()
    {
        var (order, _) = NewOrder(stock: 2, qty: 3);

        Assert.Throws<DomainException>(() => order.ChangeStatus(OrderStatus.Confirmed, 1, Now));
    }

    [Fact]
    public void Cancel_after_confirm_releases_stock()
    {
        var (order, variant) = NewOrder();
        order.ChangeStatus(OrderStatus.Confirmed, 1, Now);

        order.ChangeStatus(OrderStatus.Cancelled, 1, Now, "Customer asked");

        Assert.Equal(0, variant.ReservedQty);
        Assert.Equal("Customer asked", order.CancelReason);
    }

    [Fact]
    public void Cancel_without_reason_fails()
    {
        var (order, _) = NewOrder();

        Assert.Throws<DomainException>(() => order.ChangeStatus(OrderStatus.Cancelled, 1, Now));
    }

    [Fact]
    public void Cannot_cancel_after_packed()
    {
        var (order, _) = NewOrder();
        order.ChangeStatus(OrderStatus.Confirmed, 1, Now);
        order.ChangeStatus(OrderStatus.Packed, 1, Now);

        Assert.Throws<DomainException>(() => order.ChangeStatus(OrderStatus.Cancelled, 1, Now, "late"));
    }

    [Fact]
    public void Deliver_deducts_stock_and_marks_cod_paid()
    {
        var (order, variant) = NewOrder();
        order.ChangeStatus(OrderStatus.Confirmed, 1, Now);
        order.ChangeStatus(OrderStatus.Packed, 1, Now);
        order.ChangeStatus(OrderStatus.OutForDelivery, 1, Now);

        order.ChangeStatus(OrderStatus.Delivered, 1, Now);

        Assert.Equal(7, variant.StockQty);
        Assert.Equal(0, variant.ReservedQty);
        Assert.Equal(PaymentStatus.Paid, order.PaymentStatus);
        Assert.Equal(order.GrandTotal, order.PaidAmount);
    }

    [Fact]
    public void Skipping_steps_is_not_allowed()
    {
        var (order, _) = NewOrder();

        Assert.Throws<DomainException>(() => order.ChangeStatus(OrderStatus.Delivered, 1, Now));
    }

    [Theory]
    [InlineData(3, 40)]   // 300 is below 499, so delivery is charged
    [InlineData(5, 0)]    // 500 is free delivery
    public void Totals_apply_delivery_rule(int qty, decimal expectedDelivery)
    {
        var (order, _) = NewOrder(qty: qty);

        Assert.Equal(expectedDelivery, order.DeliveryCharge);
        Assert.Equal(qty * 100 + expectedDelivery, order.GrandTotal);
    }

    [Fact]
    public void Gst_is_extracted_from_inclusive_price()
    {
        var (order, _) = NewOrder(qty: 1);

        Assert.Equal(15.25m, order.GstAmount); // 100 * 18 / 118
    }
}
