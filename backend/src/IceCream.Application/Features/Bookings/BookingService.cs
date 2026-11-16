using FluentValidation;
using IceCream.Application.Common;
using IceCream.Application.Common.Interfaces;
using IceCream.Domain.Common;
using IceCream.Domain.Entities;
using IceCream.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IceCream.Application.Features.Bookings;

public sealed record AvailabilityDay(DateOnly Date, int Booked, int Max, bool Available);

public sealed record BookingRequest(
    string ContactName, string Mobile, string? Email, EventType EventType, DateOnly EventDate, string? EventTimeSlot,
    string VenueName, string VenueAddress, int GuestCount, long? PackageId, string? SpecialRequest);

public sealed record QuoteRequest(decimal Amount, DateOnly ValidTill, string? Notes);
public sealed record PaymentRequest(decimal Amount);
public sealed record BookingStatusRequest(BookingStatus Status);

public sealed record BookingDto(
    long Id, string BookingNumber, string ContactName, string Mobile, string? Email, EventType EventType, DateOnly EventDate,
    string? EventTimeSlot, string VenueName, string VenueAddress, int GuestCount, long? PackageId, string? PackageName,
    decimal EstimatedAmount, BookingStatus Status, decimal QuotedAmount, DateOnly? QuoteValidTill, decimal AdvancePaid,
    decimal BalanceAmount, decimal RequiredAdvance, string? SpecialRequest, string? AdminNotes, DateTime CreatedAt);

public sealed class BookingQuery : PageQuery
{
    public BookingStatus? Status { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
}

public sealed class BookingRequestValidator : AbstractValidator<BookingRequest>
{
    public BookingRequestValidator()
    {
        RuleFor(x => x.ContactName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10 digit mobile number.");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.EventType).IsInEnum();
        RuleFor(x => x.VenueName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.VenueAddress).NotEmpty().MaximumLength(500);
        // Birthdays and kitty parties are small, so custom quotes start at 25 guests. Packages keep their own minimum.
        RuleFor(x => x.GuestCount).InclusiveBetween(25, 5000);
        RuleFor(x => x.EventTimeSlot).MaximumLength(40);
        RuleFor(x => x.SpecialRequest).MaximumLength(1000);
    }
}

public sealed class QuoteRequestValidator : AbstractValidator<QuoteRequest>
{
    public QuoteRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}

public sealed class BookingService(IAppDbContext db, ICurrentUser currentUser, IClock clock, IOptions<BusinessSettings> settings)
{
    private static readonly BookingStatus[] Blocking =
        [BookingStatus.Confirmed, BookingStatus.AdvancePaid, BookingStatus.Scheduled, BookingStatus.Delivered];

    private int MaxPerDay => settings.Value.MaxEventsPerDay;

    /// <summary>Day wise capacity for one month. Only confirmed bookings use capacity.</summary>
    public async Task<IReadOnlyList<AvailabilityDay>> AvailabilityAsync(int year, int month, CancellationToken ct)
    {
        if (month is < 1 or > 12 || year < 2000) throw new DomainException("Invalid month.");
        var first = new DateOnly(year, month, 1);
        var last = first.AddMonths(1).AddDays(-1);
        var earliest = clock.Today.AddDays(Booking.MinDaysInAdvance);

        var counts = await db.Bookings.AsNoTracking()
            .Where(b => b.EventDate >= first && b.EventDate <= last && Blocking.Contains(b.Status))
            .GroupBy(b => b.EventDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, ct);

        return Enumerable.Range(0, last.Day)
            .Select(i => first.AddDays(i))
            .Select(d =>
            {
                var booked = counts.GetValueOrDefault(d);
                return new AvailabilityDay(d, booked, MaxPerDay, d >= earliest && booked < MaxPerDay);
            })
            .ToList();
    }

    public async Task<BookingDto> CreateAsync(BookingRequest req, CancellationToken ct)
    {
        Booking.EnsureDateAllowed(req.EventDate, clock.Today);
        await EnsureCapacityAsync(req.EventDate, null, ct);

        WeddingPackage? package = null;
        if (req.PackageId.HasValue)
        {
            package = await db.WeddingPackages.FirstOrDefaultAsync(p => p.Id == req.PackageId && p.IsActive, ct)
                ?? throw new NotFoundException("Package", req.PackageId);
            if (req.GuestCount < package.MinGuests)
                throw new DomainException($"{package.Name} package needs at least {package.MinGuests} guests.");
        }

        var booking = new Booking
        {
            BookingNumber = $"TMP-{Guid.NewGuid():N}",
            UserId = currentUser.UserId,
            ContactName = req.ContactName.Trim(),
            Mobile = req.Mobile,
            Email = req.Email?.Trim(),
            EventType = req.EventType,
            EventDate = req.EventDate,
            EventTimeSlot = req.EventTimeSlot,
            VenueName = req.VenueName.Trim(),
            VenueAddress = req.VenueAddress.Trim(),
            GuestCount = req.GuestCount,
            Package = package,
            SpecialRequest = req.SpecialRequest?.Trim()
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);

        booking.BookingNumber = $"BKG-{clock.Today.Year}-{booking.Id:D6}";
        await db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    public async Task<PagedResult<BookingDto>> MineAsync(PageQuery page, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var result = await db.Bookings.AsNoTracking().Include(b => b.Package)
            .Where(b => b.UserId == userId).OrderByDescending(b => b.EventDate)
            .ToPagedAsync(page, ct);
        return new PagedResult<BookingDto>(result.Items.Select(ToDto).ToList(), result.Page, result.PageSize, result.TotalCount);
    }

    public async Task<BookingDto> GetAsync(long id, CancellationToken ct) => ToDto(await LoadOwnedAsync(id, ct));

    public async Task<BookingDto> AcceptQuoteAsync(long id, CancellationToken ct)
    {
        var booking = await LoadOwnedAsync(id, ct, track: true);
        await EnsureCapacityAsync(booking.EventDate, booking.Id, ct);
        booking.AcceptQuote(clock.Today);
        await db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    // ---------- Admin ----------

    public async Task<PagedResult<BookingDto>> ListAsync(BookingQuery q, CancellationToken ct)
    {
        var query = db.Bookings.AsNoTracking().Include(b => b.Package).AsQueryable();
        if (q.Status.HasValue) query = query.Where(b => b.Status == q.Status);
        if (q.From.HasValue) query = query.Where(b => b.EventDate >= q.From);
        if (q.To.HasValue) query = query.Where(b => b.EventDate <= q.To);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLowerInvariant();
            query = query.Where(b => b.BookingNumber.ToLower().Contains(s) || b.ContactName.ToLower().Contains(s) || b.Mobile.ToLower().Contains(s) || b.VenueName.ToLower().Contains(s));
        }

        var result = await query.OrderBy(b => b.EventDate).ToPagedAsync(q, ct);
        return new PagedResult<BookingDto>(result.Items.Select(ToDto).ToList(), result.Page, result.PageSize, result.TotalCount);
    }

    public async Task<BookingDto> QuoteAsync(long id, QuoteRequest req, CancellationToken ct)
    {
        var booking = await LoadAsync(id, ct, track: true);
        if (req.ValidTill < clock.Today) throw new DomainException("Quote validity must be today or later.");
        booking.Quote(req.Amount, req.ValidTill, req.Notes);
        await db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    /// <summary>Records money received offline (cash, UPI, bank transfer).</summary>
    public async Task<BookingDto> RecordPaymentAsync(long id, decimal amount, CancellationToken ct)
    {
        var booking = await LoadAsync(id, ct, track: true);
        booking.RecordPayment(amount);
        await db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    public async Task<BookingDto> ChangeStatusAsync(long id, BookingStatus status, CancellationToken ct)
    {
        var booking = await LoadAsync(id, ct, track: true);
        booking.ChangeStatus(status);
        await db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    // ---------- Helpers ----------

    private async Task EnsureCapacityAsync(DateOnly date, long? exceptId, CancellationToken ct)
    {
        var booked = await db.Bookings.CountAsync(b => b.EventDate == date && b.Id != exceptId && Blocking.Contains(b.Status), ct);
        if (booked >= MaxPerDay) throw new DomainException($"{date:dd MMM yyyy} is fully booked. Please choose another date.");
    }

    private async Task<Booking> LoadAsync(long id, CancellationToken ct, bool track = false)
    {
        var query = db.Bookings.Include(b => b.Package).AsQueryable();
        if (!track) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(b => b.Id == id, ct) ?? throw new NotFoundException("Booking", id);
    }

    private async Task<Booking> LoadOwnedAsync(long id, CancellationToken ct, bool track = false)
    {
        var booking = await LoadAsync(id, ct, track);
        if (!currentUser.IsStaffOrAbove && (currentUser.UserId is null || booking.UserId != currentUser.UserId))
            throw new ForbiddenException();
        return booking;
    }

    private static BookingDto ToDto(Booking b) => new(
        b.Id, b.BookingNumber, b.ContactName, b.Mobile, b.Email, b.EventType, b.EventDate, b.EventTimeSlot,
        b.VenueName, b.VenueAddress, b.GuestCount, b.PackageId, b.Package?.Name, b.EstimateAmount(),
        b.Status, b.QuotedAmount, b.QuoteValidTill, b.AdvancePaid, b.BalanceAmount, b.RequiredAdvance,
        b.SpecialRequest, b.AdminNotes, b.CreatedAt);
}
