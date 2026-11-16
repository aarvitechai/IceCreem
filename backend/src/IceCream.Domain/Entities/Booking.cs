using IceCream.Domain.Common;
using IceCream.Domain.Enums;

namespace IceCream.Domain.Entities;

/// <summary>Wedding or event bulk booking.</summary>
public class Booking : BaseEntity
{
    public const int MinDaysInAdvance = 7;
    public const decimal MinAdvancePercent = 30;

    public string BookingNumber { get; set; } = string.Empty;
    public long? UserId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public EventType EventType { get; set; } = EventType.Wedding;
    public DateOnly EventDate { get; set; }
    public string? EventTimeSlot { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public string VenueAddress { get; set; } = string.Empty;
    public int GuestCount { get; set; }
    public long? PackageId { get; set; }
    public WeddingPackage? Package { get; set; }
    public BookingStatus Status { get; private set; } = BookingStatus.Enquiry;
    public decimal QuotedAmount { get; private set; }
    public DateOnly? QuoteValidTill { get; private set; }
    public decimal AdvancePaid { get; private set; }
    public string? SpecialRequest { get; set; }
    public string? AdminNotes { get; set; }

    public decimal BalanceAmount => QuotedAmount - AdvancePaid;
    public decimal RequiredAdvance => Math.Round(QuotedAmount * MinAdvancePercent / 100, 2);

    public static void EnsureDateAllowed(DateOnly eventDate, DateOnly today)
    {
        if (eventDate < today.AddDays(MinDaysInAdvance))
            throw new DomainException($"Booking must be made at least {MinDaysInAdvance} days before the event.");
    }

    /// <summary>Package price per head times guests. Used as the default quote.</summary>
    public decimal EstimateAmount() => Package is null ? 0 : Package.PricePerHead * GuestCount;

    public void Quote(decimal amount, DateOnly validTill, string? notes)
    {
        if (Status is not (BookingStatus.Enquiry or BookingStatus.Quoted))
            throw new DomainException("Quote can only be sent for an enquiry.");
        if (amount <= 0) throw new DomainException("Quote amount must be greater than zero.");

        QuotedAmount = amount;
        QuoteValidTill = validTill;
        AdminNotes = notes ?? AdminNotes;
        Status = BookingStatus.Quoted;
    }

    public void AcceptQuote(DateOnly today)
    {
        if (Status != BookingStatus.Quoted) throw new DomainException("There is no quote to accept.");
        if (QuoteValidTill < today) throw new DomainException("Quote has expired. Please ask for a new quote.");
        Status = BookingStatus.Confirmed;
    }

    /// <summary>
    /// Records a payment. The first payment must be at least the minimum advance
    /// and moves the booking to AdvancePaid. Later payments reduce the balance.
    /// </summary>
    public void RecordPayment(decimal amount)
    {
        if (Status is not (BookingStatus.Confirmed or BookingStatus.AdvancePaid
            or BookingStatus.Scheduled or BookingStatus.Delivered))
            throw new DomainException("Payment can be made only after the quote is accepted.");
        if (amount <= 0) throw new DomainException("Amount must be greater than zero.");
        if (amount > BalanceAmount) throw new DomainException($"Amount is more than the balance ({BalanceAmount}).");
        if (Status == BookingStatus.Confirmed && amount < RequiredAdvance)
            throw new DomainException($"Minimum advance is {RequiredAdvance} ({MinAdvancePercent} percent).");

        AdvancePaid += amount;
        if (Status == BookingStatus.Confirmed) Status = BookingStatus.AdvancePaid;
    }

    /// <summary>Admin moves after advance: Scheduled, Delivered, Closed, or Cancelled.</summary>
    public void ChangeStatus(BookingStatus to)
    {
        var ok = (Status, to) switch
        {
            (BookingStatus.AdvancePaid, BookingStatus.Scheduled) => true,
            (BookingStatus.Scheduled, BookingStatus.Delivered) => true,
            (BookingStatus.Delivered, BookingStatus.Closed) => BalanceAmount <= 0,
            (not (BookingStatus.Delivered or BookingStatus.Closed or BookingStatus.Cancelled), BookingStatus.Cancelled) => true,
            _ => false
        };

        if (!ok)
        {
            var reason = to == BookingStatus.Closed && Status == BookingStatus.Delivered
                ? "Clear the balance before closing the booking."
                : $"Booking cannot move from {Status} to {to}.";
            throw new DomainException(reason);
        }

        Status = to;
    }
}
