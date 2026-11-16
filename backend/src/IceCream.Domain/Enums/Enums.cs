namespace IceCream.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Admin = 2,
    Staff = 3,
    Hawker = 4,
    Delivery = 5,
    Customer = 6
}

public enum OrderType
{
    Retail = 1,
    Wedding = 2,
    Hawker = 3
}

public enum OrderStatus
{
    Placed = 1,
    Confirmed = 2,
    InProduction = 3,
    Packed = 4,
    OutForDelivery = 5,
    Delivered = 6,
    Cancelled = 7,
    Returned = 8
}

public enum PaymentStatus
{
    Pending = 1,
    Partial = 2,
    Paid = 3,
    Refunded = 4
}

public enum PaymentMethod
{
    CashOnDelivery = 1,
    Online = 2
}

/// <summary>Stored as text (max 20 characters), so new occasions need no migration.</summary>
public enum EventType
{
    Wedding = 1,
    Reception = 2,
    Party = 3,
    Birthday = 4,
    Anniversary = 5,
    Engagement = 6,
    BabyShower = 7,
    Corporate = 8,
    Festival = 9,
    KittyParty = 10
}

public enum BookingStatus
{
    Enquiry = 1,
    Quoted = 2,
    Confirmed = 3,
    AdvancePaid = 4,
    Scheduled = 5,
    Delivered = 6,
    Closed = 7,
    Cancelled = 8
}

public enum BannerPosition
{
    Hero = 1,
    Offer = 2
}

public enum StockTxnType
{
    In = 1,
    Out = 2,
    Wastage = 3,
    Adjust = 4
}

public enum BatchStatus
{
    Planned = 1,
    Running = 2,
    Completed = 3
}

public enum HawkerIssueStatus
{
    Issued = 1,
    Settled = 2
}

public enum ReviewStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}
