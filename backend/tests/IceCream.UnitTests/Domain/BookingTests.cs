using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;

namespace IceCream.UnitTests.Domain;

public class BookingTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);

    private static Booking QuotedBooking(decimal amount = 10000)
    {
        var booking = new Booking { GuestCount = 200 };
        booking.Quote(amount, Today.AddDays(5), null);
        return booking;
    }

    [Fact]
    public void Event_must_be_at_least_seven_days_away()
    {
        Assert.Throws<DomainException>(() => Booking.EnsureDateAllowed(Today.AddDays(6), Today));
        Booking.EnsureDateAllowed(Today.AddDays(7), Today);
    }

    [Fact]
    public void Accepting_expired_quote_fails()
    {
        var booking = QuotedBooking();

        Assert.Throws<DomainException>(() => booking.AcceptQuote(Today.AddDays(6)));
    }

    [Fact]
    public void Advance_below_thirty_percent_fails()
    {
        var booking = QuotedBooking();
        booking.AcceptQuote(Today);

        Assert.Throws<DomainException>(() => booking.RecordPayment(2999));
    }

    [Fact]
    public void Full_flow_to_closed()
    {
        var booking = QuotedBooking();
        booking.AcceptQuote(Today);
        booking.RecordPayment(3000);
        booking.ChangeStatus(BookingStatus.Scheduled);
        booking.ChangeStatus(BookingStatus.Delivered);

        Assert.Throws<DomainException>(() => booking.ChangeStatus(BookingStatus.Closed));

        booking.RecordPayment(7000);
        booking.ChangeStatus(BookingStatus.Closed);

        Assert.Equal(BookingStatus.Closed, booking.Status);
        Assert.Equal(0, booking.BalanceAmount);
    }

    [Fact]
    public void Cannot_cancel_after_delivery()
    {
        var booking = QuotedBooking();
        booking.AcceptQuote(Today);
        booking.RecordPayment(5000);
        booking.ChangeStatus(BookingStatus.Scheduled);
        booking.ChangeStatus(BookingStatus.Delivered);

        Assert.Throws<DomainException>(() => booking.ChangeStatus(BookingStatus.Cancelled));
    }
}
