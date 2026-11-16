using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace IceCream.IntegrationTests;

/// <summary>Shared helpers. Each test class gets its own in memory database through IClassFixture.</summary>
public abstract class FlowTestBase(ApiFactory factory)
{
    protected const string SuperAdmin = "superadmin@icecream.local";
    protected const string Admin = "admin@icecream.local";
    protected const string Staff = "staff@icecream.local";
    protected const string Customer = "customer@icecream.local";
    protected const string Delivery = "delivery@icecream.local";
    protected const string HawkerUser = "hawker@icecream.local";

    protected ApiFactory Factory { get; } = factory;

    protected async Task<JsonElement> ProductAsync(string slug) =>
        await (await Factory.CreateClient().GetAsync($"/api/v1/products/{slug}")).DataAsync();

    protected async Task<long> VariantIdAsync(string slug) =>
        (await ProductAsync(slug)).GetProperty("variants")[0].GetProperty("id").GetInt64();

    protected static object OrderBody(long variantId, int qty, string mobile = "9876543210", string? coupon = null) => new
    {
        items = new[] { new { variantId, quantity = qty } },
        couponCode = coupon,
        customerName = "Flow Tester",
        mobile,
        addressLine = "1 Test Street",
        city = "Varanasi",
        pincode = "221001",
        paymentMethod = "CashOnDelivery"
    };

    protected static string Today(int plusDays) => DateOnly.FromDateTime(DateTime.UtcNow.AddDays(plusDays)).ToString("yyyy-MM-dd");
}

public sealed class OrderFlowTests(ApiFactory factory) : FlowTestBase(factory), IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Order_goes_from_placed_to_delivered_with_the_customer_otp()
    {
        var guest = Factory.CreateClient();
        var admin = await Factory.ClientAsAsync(Admin);
        var rider = await Factory.ClientAsAsync(Delivery);
        var variant = await VariantIdAsync("classic-vanilla");

        var order = await (await guest.PostAsJsonAsync("/api/v1/orders", OrderBody(variant, 2, "9811111111"))).DataAsync();
        var id = order.GetProperty("id").GetInt64();
        var number = order.GetProperty("orderNumber").GetString();

        foreach (var status in new[] { "Confirmed", "Packed" })
        {
            var res = await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{id}/status", new { status });
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        }

        var partnerId = (await (await admin.GetAsync("/api/v1/admin/delivery-partners")).DataAsync())[0].GetProperty("id").GetInt64();
        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsJsonAsync($"/api/v1/admin/orders/{id}/assign-delivery", new { partnerId })).StatusCode);

        // The rider sees the task but never the OTP.
        var tasks = await (await rider.GetAsync("/api/v1/delivery/me/tasks")).DataAsync();
        var task = tasks.EnumerateArray().Single(t => t.GetProperty("id").GetInt64() == id);
        Assert.Equal(JsonValueKind.Null, task.GetProperty("deliveryOtp").ValueKind);

        Assert.Equal(HttpStatusCode.OK, (await rider.PatchAsJsonAsync($"/api/v1/delivery/{id}/status", new { status = "OutForDelivery" })).StatusCode);

        // The admin can no longer close it by hand once a rider has it.
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{id}/status", new { status = "Delivered" })).StatusCode);

        var wrong = await rider.PatchAsJsonAsync($"/api/v1/delivery/{id}/status", new { status = "Delivered", otp = "0000" });
        Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);

        // The customer reads the OTP from the tracking page and tells the rider.
        var tracked = await (await guest.GetAsync($"/api/v1/orders/track/{number}?mobile=9811111111")).DataAsync();
        var otp = tracked.GetProperty("deliveryOtp").GetString();
        Assert.Matches(@"^\d{4}$", otp!);

        var done = await rider.PatchAsJsonAsync($"/api/v1/delivery/{id}/status", new { status = "Delivered", otp });
        Assert.Equal(HttpStatusCode.OK, done.StatusCode);
        var delivered = await done.DataAsync();
        Assert.Equal("Delivered", delivered.GetProperty("status").GetString());
        Assert.Equal("Paid", delivered.GetProperty("paymentStatus").GetString());
    }

    [Fact]
    public async Task Tracking_needs_the_mobile_used_for_the_order()
    {
        var guest = Factory.CreateClient();
        var order = await (await guest.PostAsJsonAsync("/api/v1/orders", OrderBody(await VariantIdAsync("alphonso-mango"), 1, "9822222222"))).DataAsync();
        var number = order.GetProperty("orderNumber").GetString();

        Assert.Equal(HttpStatusCode.OK, (await guest.GetAsync($"/api/v1/orders/track/{number}?mobile=9822222222")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await guest.GetAsync($"/api/v1/orders/track/{number}?mobile=9833333333")).StatusCode);
    }

    [Fact]
    public async Task Customer_sees_and_cancels_own_order_but_not_someone_elses()
    {
        var customer = await Factory.ClientAsAsync(Customer);
        var placed = await customer.PostAsJsonAsync("/api/v1/orders", OrderBody(await VariantIdAsync("classic-vanilla"), 1, "9844444444"));
        var id = (await placed.DataAsync()).GetProperty("id").GetInt64();

        var mine = await (await customer.GetAsync("/api/v1/me/orders")).DataAsync();
        Assert.Contains(mine.GetProperty("items").EnumerateArray(), o => o.GetProperty("id").GetInt64() == id);

        // A different signed in customer cannot open it.
        var stranger = Factory.CreateClient();
        var reg = await stranger.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName = "Other Person", email = $"other{Guid.NewGuid():N}@example.com", mobile = "9855555555", password = "Secret123"
        });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var token = (await reg.DataAsync()).GetProperty("accessToken").GetString();
        stranger.DefaultRequestHeaders.Authorization = new("Bearer", token);
        var peek = await stranger.GetAsync($"/api/v1/orders/{id}");
        Assert.True(peek.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.NotFound, $"got {peek.StatusCode}");

        var noReason = await customer.PostAsJsonAsync($"/api/v1/orders/{id}/cancel", new { reason = "" });
        Assert.Equal(HttpStatusCode.BadRequest, noReason.StatusCode);

        var cancelled = await customer.PostAsJsonAsync($"/api/v1/orders/{id}/cancel", new { reason = "Ordered by mistake" });
        Assert.Equal(HttpStatusCode.OK, cancelled.StatusCode);
        Assert.Equal("Cancelled", (await cancelled.DataAsync()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Checkout_summary_applies_coupon_rules()
    {
        var guest = Factory.CreateClient();
        var variant = await ProductAsync("classic-vanilla");
        var v = variant.GetProperty("variants")[0];
        var id = v.GetProperty("id").GetInt64();
        var price = v.GetProperty("sellingPrice").GetDecimal();

        // Below the WELCOME10 minimum (Rs 300): no discount, with a reason.
        var small = await (await guest.PostAsJsonAsync("/api/v1/checkout/summary", new { items = new[] { new { variantId = id, quantity = 1 } }, couponCode = "WELCOME10" })).DataAsync();
        if (price < 300)
        {
            Assert.Equal(0, small.GetProperty("discount").GetDecimal());
            Assert.False(string.IsNullOrEmpty(small.GetProperty("couponMessage").GetString()));
        }

        // Ten tubs: 10 percent, capped at Rs 100.
        var big = await (await guest.PostAsJsonAsync("/api/v1/checkout/summary", new { items = new[] { new { variantId = id, quantity = 10 } }, couponCode = "WELCOME10" })).DataAsync();
        var expected = Math.Min(100, Math.Round(price * 10 * 0.10m, 2));
        Assert.Equal(expected, big.GetProperty("discount").GetDecimal());
        Assert.Equal(0, big.GetProperty("deliveryCharge").GetDecimal());

        var unknown = await (await guest.PostAsJsonAsync("/api/v1/checkout/summary", new { items = new[] { new { variantId = id, quantity = 10 } }, couponCode = "NOPE" })).DataAsync();
        Assert.Equal(0, unknown.GetProperty("discount").GetDecimal());
    }

    [Fact]
    public async Task Product_cards_carry_the_quick_add_pack()
    {
        var page = await (await Factory.CreateClient().GetAsync("/api/v1/products?pageSize=50")).DataAsync();
        foreach (var card in page.GetProperty("items").EnumerateArray())
        {
            Assert.Equal(JsonValueKind.Number, card.GetProperty("quickVariantId").ValueKind);
            Assert.True(card.GetProperty("quickVariantPrice").GetDecimal() > 0);
            Assert.False(string.IsNullOrEmpty(card.GetProperty("quickVariantName").GetString()));
        }
    }

    [Fact]
    public async Task Staff_can_work_orders_but_not_manage_coupons()
    {
        var staff = await Factory.ClientAsAsync(Staff);
        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/v1/admin/orders")).StatusCode);
        var coupon = await staff.PostAsJsonAsync("/api/v1/admin/coupons", new
        {
            code = "STAFF5", isPercent = true, value = 5, minOrderAmount = 0, maxDiscount = 0,
            validFrom = DateTime.UtcNow, validTo = DateTime.UtcNow.AddDays(5), usageLimit = 0
        });
        Assert.Equal(HttpStatusCode.Forbidden, coupon.StatusCode);
    }

    [Fact]
    public async Task Admin_creates_coupon_and_duplicate_code_is_rejected()
    {
        var admin = await Factory.ClientAsAsync(Admin);
        var body = new
        {
            code = "DIWALI20", isPercent = true, value = 20, minOrderAmount = 400, maxDiscount = 150,
            validFrom = DateTime.UtcNow.AddDays(-1), validTo = DateTime.UtcNow.AddDays(10), usageLimit = 100
        };
        Assert.Equal(HttpStatusCode.Created, (await admin.PostAsJsonAsync("/api/v1/admin/coupons", body)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PostAsJsonAsync("/api/v1/admin/coupons", body)).StatusCode);

        var guest = Factory.CreateClient();
        var v = (await ProductAsync("belgian-chocolate")).GetProperty("variants")[0].GetProperty("id").GetInt64();
        var summary = await (await guest.PostAsJsonAsync("/api/v1/checkout/summary", new { items = new[] { new { variantId = v, quantity = 5 } }, couponCode = "diwali20" })).DataAsync();
        Assert.Equal("DIWALI20", summary.GetProperty("couponCode").GetString());
        Assert.True(summary.GetProperty("discount").GetDecimal() > 0);
    }
}

public sealed class BookingFlowTests(ApiFactory factory) : FlowTestBase(factory), IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Enquiry_quote_accept_and_advance_move_the_booking_forward()
    {
        var customer = await Factory.ClientAsAsync(Customer);
        var admin = await Factory.ClientAsAsync(Admin);

        var created = await customer.PostAsJsonAsync("/api/v1/bookings", new
        {
            contactName = "Flow Customer", mobile = "9876543210", eventType = "Anniversary", eventDate = Today(30),
            venueName = "Community Hall", venueAddress = "Premnagar, Varanasi", guestCount = 120
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.DataAsync()).GetProperty("id").GetInt64();

        var quoted = await admin.PostAsJsonAsync($"/api/v1/admin/bookings/{id}/quote", new { amount = 20000, validTill = Today(10), notes = "Two flavours" });
        Assert.Equal(HttpStatusCode.OK, quoted.StatusCode);
        Assert.Equal("Quoted", (await quoted.DataAsync()).GetProperty("status").GetString());

        var accepted = await customer.PostAsync($"/api/v1/bookings/{id}/accept-quote", null);
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        Assert.Equal("Confirmed", (await accepted.DataAsync()).GetProperty("status").GetString());

        // Less than 30 percent of Rs 20,000 is not enough to lock the date.
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync($"/api/v1/admin/bookings/{id}/payments", new { amount = 1000 })).StatusCode);

        var paid = await admin.PostAsJsonAsync($"/api/v1/admin/bookings/{id}/payments", new { amount = 6000 });
        Assert.Equal(HttpStatusCode.OK, paid.StatusCode);
        var booking = await paid.DataAsync();
        Assert.Equal("AdvancePaid", booking.GetProperty("status").GetString());
        Assert.Equal(14000, booking.GetProperty("balanceAmount").GetDecimal());

        var mine = await (await customer.GetAsync("/api/v1/me/bookings")).DataAsync();
        Assert.Contains(mine.GetProperty("items").EnumerateArray(), b => b.GetProperty("id").GetInt64() == id);
    }

    [Fact]
    public async Task Availability_lists_every_day_of_the_month()
    {
        var next = DateTime.UtcNow.AddMonths(1);
        var days = await (await Factory.CreateClient().GetAsync($"/api/v1/bookings/availability?year={next.Year}&month={next.Month}")).DataAsync();
        Assert.Equal(DateTime.DaysInMonth(next.Year, next.Month), days.GetArrayLength());
    }

    [Fact]
    public async Task Package_minimum_guests_is_enforced()
    {
        var packages = await (await Factory.CreateClient().GetAsync("/api/v1/wedding-packages")).DataAsync();
        var pkg = packages.EnumerateArray().OrderByDescending(p => p.GetProperty("minGuests").GetInt32()).First();
        var res = await Factory.CreateClient().PostAsJsonAsync("/api/v1/bookings", new
        {
            contactName = "Small Party", mobile = "9876543210", eventType = "Wedding", eventDate = Today(40),
            venueName = "Home", venueAddress = "Varanasi", guestCount = 30, packageId = pkg.GetProperty("id").GetInt64()
        });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}

public sealed class OperationsFlowTests(ApiFactory factory) : FlowTestBase(factory), IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Hawker_takes_stock_settles_in_the_evening_and_sees_dues()
    {
        var admin = await Factory.ClientAsAsync(Admin);
        var hawkerApp = await Factory.ClientAsAsync(HawkerUser);
        var hawkerId = (await (await admin.GetAsync("/api/v1/admin/hawkers")).DataAsync())[0].GetProperty("id").GetInt64();
        var variant = await VariantIdAsync("orange-bar");

        var issued = await admin.PostAsJsonAsync($"/api/v1/admin/hawkers/{hawkerId}/issue-stock", new { items = new[] { new { variantId = variant, quantity = 10 } } });
        Assert.Equal(HttpStatusCode.OK, issued.StatusCode);
        var issueId = (await issued.DataAsync()).GetProperty("id").GetInt64();

        var me = await (await hawkerApp.GetAsync("/api/v1/hawker/me")).DataAsync();
        Assert.Contains(me.GetProperty("recentIssues").EnumerateArray(), i => i.GetProperty("status").GetString() == "Issued");

        // Counts must add up to what was issued.
        var unbalanced = await admin.PostAsJsonAsync($"/api/v1/admin/hawkers/issues/{issueId}/settle", new { items = new[] { new { variantId = variant, sold = 5, returned = 1, damaged = 0 } }, cashCollected = 100 });
        Assert.Equal(HttpStatusCode.BadRequest, unbalanced.StatusCode);

        var settled = await admin.PostAsJsonAsync($"/api/v1/admin/hawkers/issues/{issueId}/settle", new { items = new[] { new { variantId = variant, sold = 8, returned = 2, damaged = 0 } }, cashCollected = 0 });
        Assert.Equal(HttpStatusCode.OK, settled.StatusCode);
        var s = await settled.DataAsync();
        Assert.Equal("Settled", s.GetProperty("status").GetString());
        Assert.True(s.GetProperty("commission").GetDecimal() > 0);

        var after = await (await hawkerApp.GetAsync("/api/v1/hawker/me")).DataAsync();
        Assert.True(after.GetProperty("hawker").GetProperty("outstandingAmount").GetDecimal() > 0);
    }

    [Fact]
    public async Task Production_batch_uses_raw_material_and_adds_finished_stock()
    {
        var admin = await Factory.ClientAsAsync(Admin);
        var stock = await (await admin.GetAsync("/api/v1/admin/stock/finished")).DataAsync();
        var vanilla = stock.EnumerateArray().First(s => s.GetProperty("sku").GetString() == "VAN-500");
        var variantId = vanilla.GetProperty("variantId").GetInt64();
        var before = vanilla.GetProperty("stockQty").GetInt32();

        var created = await admin.PostAsJsonAsync("/api/v1/admin/production/batches", new { variantId, plannedQty = 20 });
        var batchData = await created.DataAsync();
        // The API answers with the new batch id.
        var batchId = batchData.ValueKind == JsonValueKind.Number ? batchData.GetInt64() : batchData.GetProperty("id").GetInt64();
        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsync($"/api/v1/admin/production/batches/{batchId}/start", null)).StatusCode);

        var done = await admin.PostAsJsonAsync($"/api/v1/admin/production/batches/{batchId}/complete", new { producedQty = 18, wastageQty = 2 });
        Assert.Equal(HttpStatusCode.OK, done.StatusCode);
        var batches = await (await admin.GetAsync("/api/v1/admin/production/batches?pageSize=100")).DataAsync();
        var list = batches.ValueKind == JsonValueKind.Array ? batches : batches.GetProperty("items");
        Assert.Equal("Completed", list.EnumerateArray().First(x => x.GetProperty("id").GetInt64() == batchId).GetProperty("status").GetString());

        var afterStock = await (await admin.GetAsync("/api/v1/admin/stock/finished")).DataAsync();
        var after = afterStock.EnumerateArray().First(s => s.GetProperty("variantId").GetInt64() == variantId).GetProperty("stockQty").GetInt32();
        Assert.Equal(before + 18, after);
    }

    [Fact]
    public async Task Raw_material_cannot_go_below_zero()
    {
        var admin = await Factory.ClientAsAsync(Admin);
        var materials = await (await admin.GetAsync("/api/v1/admin/raw-materials")).DataAsync();
        var m = materials[0];
        var tooMuch = m.GetProperty("currentStock").GetDecimal() + 1000;
        var res = await admin.PostAsJsonAsync($"/api/v1/admin/raw-materials/{m.GetProperty("id").GetInt64()}/stock", new { type = "Out", quantity = tooMuch, remark = "test" });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}

public sealed class AdminFlowTests(ApiFactory factory) : FlowTestBase(factory), IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Super_admin_manages_staff_accounts()
    {
        var root = await Factory.ClientAsAsync(SuperAdmin);
        var email = $"newstaff{Guid.NewGuid():N}@icecream.local";
        var created = await root.PostAsJsonAsync("/api/v1/superadmin/users", new { fullName = "New Staff", email, mobile = "9866666666", role = "Staff", password = "Start123" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var userData = await created.DataAsync();
        // The API answers with the new user id.
        var id = userData.ValueKind == JsonValueKind.Number ? userData.GetInt64() : userData.GetProperty("id").GetInt64();

        var login = await Factory.CreateClient().PostAsJsonAsync("/api/v1/auth/login", new { login = email, password = "Start123" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await root.PostAsJsonAsync($"/api/v1/superadmin/users/{id}/reset-password", new { password = "Changed123" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await root.PutAsJsonAsync($"/api/v1/superadmin/users/{id}", new { fullName = "New Staff", role = "Staff", isActive = false })).StatusCode);

        var blocked = await Factory.CreateClient().PostAsJsonAsync("/api/v1/auth/login", new { login = email, password = "Changed123" });
        Assert.NotEqual(HttpStatusCode.OK, blocked.StatusCode);

        var audit = await (await root.GetAsync("/api/v1/superadmin/audit-logs?pageSize=50")).DataAsync();
        Assert.True(audit.GetProperty("totalCount").GetInt32() > 0);
    }

    [Fact]
    public async Task Admin_cannot_open_super_admin_screens()
    {
        var admin = await Factory.ClientAsAsync(Admin);
        Assert.Equal(HttpStatusCode.Forbidden, (await admin.GetAsync("/api/v1/superadmin/users")).StatusCode);
    }

    [Fact]
    public async Task Admin_adds_a_product_and_hiding_it_removes_it_from_the_shop()
    {
        var admin = await Factory.ClientAsAsync(Admin);
        var categoryId = (await (await Factory.CreateClient().GetAsync("/api/v1/categories")).DataAsync())[0].GetProperty("id").GetInt64();
        var name = $"Test Rose Kulfi {Guid.NewGuid().ToString("N")[..6]}";

        var created = await admin.PostAsJsonAsync("/api/v1/admin/products", new
        {
            categoryId, name, shortDescription = "Rose and milk", description = "Slow cooked rose kulfi.", ingredients = "Milk, sugar, rose",
            hsnCode = "2105", gstPercent = 18, isVeg = true, isFeatured = false, isActive = true,
            variants = new[] { new { sku = $"ROSE-{Guid.NewGuid().ToString("N")[..6]}", name = "Single stick", mrp = 50, sellingPrice = 45, wholesalePrice = 35, isActive = true } },
            imageUrls = Array.Empty<string>()
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var product = await created.DataAsync();
        var slug = product.GetProperty("slug").GetString();
        var id = product.GetProperty("id").GetInt64();

        Assert.Equal(HttpStatusCode.OK, (await Factory.CreateClient().GetAsync($"/api/v1/products/{slug}")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PatchAsJsonAsync($"/api/v1/admin/products/{id}/status", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Factory.CreateClient().GetAsync($"/api/v1/products/{slug}")).StatusCode);
    }

    [Fact]
    public async Task Register_rejects_weak_password_and_duplicate_email()
    {
        var client = Factory.CreateClient();
        var weak = await client.PostAsJsonAsync("/api/v1/auth/register", new { fullName = "Weak", email = "weak@example.com", mobile = "9877777777", password = "short" });
        Assert.Equal(HttpStatusCode.BadRequest, weak.StatusCode);

        var dup = await client.PostAsJsonAsync("/api/v1/auth/register", new { fullName = "Dup", email = Customer, mobile = "9888888888", password = "Secret123" });
        Assert.Equal(HttpStatusCode.Conflict, dup.StatusCode);
    }
}

public sealed class TestSetupTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public void Tests_use_sql_server_when_asked()
    {
        using var scope = factory.Services.CreateScope();
        var provider = scope.ServiceProvider.GetRequiredService<IceCream.Infrastructure.Persistence.AppDbContext>().Database.ProviderName;
        var wanted = string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ICECREAM_TEST_SQLSERVER")) ? "InMemory" : "SqlServer";
        Assert.Contains(wanted, provider);
    }
}

/// <summary>Visitors behind the web server must each get their own limit, not share one.</summary>
public sealed class RateLimitTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private HttpClient Visitor(WebApplicationFactory<Program> app, string ip)
    {
        var c = app.CreateClient();
        // What the hosting load balancer sends: the visitor first, then the web server that proxied the call.
        c.DefaultRequestHeaders.Add("X-Forwarded-For", $"{ip}, 172.16.0.5");
        return c;
    }

    [Fact]
    public async Task Each_visitor_has_a_separate_limit_on_sensitive_endpoints()
    {
        using var app = factory.WithWebHostBuilder(b => b.UseSetting("RateLimits:TrackPerMinute", "3"));
        var first = Visitor(app, "203.0.113.10");
        var second = Visitor(app, "203.0.113.20");
        const string url = "/api/v1/orders/track/ICE-0000-000000?mobile=9876543210";

        for (var i = 0; i < 3; i++)
            Assert.NotEqual(HttpStatusCode.TooManyRequests, (await first.GetAsync(url)).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await first.GetAsync(url)).StatusCode);

        // Same web server, different visitor: still allowed.
        Assert.NotEqual(HttpStatusCode.TooManyRequests, (await second.GetAsync(url)).StatusCode);
    }

    [Fact]
    public async Task Tracking_does_not_use_up_the_order_allowance()
    {
        using var app = factory.WithWebHostBuilder(b => b
            .UseSetting("RateLimits:TrackPerMinute", "2")
            .UseSetting("RateLimits:SubmitPerMinute", "5"));
        var visitor = Visitor(app, "203.0.113.30");

        for (var i = 0; i < 3; i++) await visitor.GetAsync("/api/v1/orders/track/ICE-0000-000000?mobile=9876543210");
        var review = await visitor.PostAsJsonAsync("/api/v1/reviews", new { customerName = "Limit Test", occasion = "Home delivery", rating = 5, comment = "Still allowed after tracking." });
        Assert.Equal(HttpStatusCode.Created, review.StatusCode);
    }

    [Fact]
    public async Task Session_refresh_is_not_tightly_limited()
    {
        using var app = factory.WithWebHostBuilder(b => b.UseSetting("RateLimits:AuthPerMinute", "2"));
        var visitor = Visitor(app, "203.0.113.40");
        for (var i = 0; i < 5; i++)
            Assert.NotEqual(HttpStatusCode.TooManyRequests, (await visitor.PostAsync("/api/v1/auth/refresh", null)).StatusCode);
    }
}

/// <summary>Refresh token rotation must survive two tabs refreshing at once, but still catch replay.</summary>
public sealed class SessionTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private HttpClient NoCookies() => factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

    private static string RefreshCookie(HttpResponseMessage res) =>
        res.Headers.GetValues("Set-Cookie").Select(c => c.Split(';')[0]).First(c => c.StartsWith("ic_refresh=") && c.Length > "ic_refresh=".Length);

    private async Task<HttpResponseMessage> RefreshWith(string cookie)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        req.Headers.Add("Cookie", cookie);
        return await NoCookies().SendAsync(req);
    }

    [Fact]
    public async Task Second_tab_refreshing_with_the_old_cookie_does_not_sign_the_user_out()
    {
        var login = await NoCookies().PostAsJsonAsync("/api/v1/auth/login", new { login = "customer@icecream.local", password = ApiFactory.Password });
        var original = RefreshCookie(login);

        var tabOne = await RefreshWith(original);
        Assert.Equal(HttpStatusCode.OK, tabOne.StatusCode);
        var renewed = RefreshCookie(tabOne);

        // Tab two arrives a moment later with the cookie it read before tab one finished.
        var tabTwo = await RefreshWith(original);
        Assert.Equal(HttpStatusCode.Conflict, tabTwo.StatusCode);
        Assert.False(tabTwo.Headers.TryGetValues("Set-Cookie", out _), "the race answer must not touch the cookie");

        // The renewed session still works.
        Assert.Equal(HttpStatusCode.OK, (await RefreshWith(renewed)).StatusCode);
    }

    [Fact]
    public async Task Using_a_logged_out_token_again_ends_every_session()
    {
        var login = await NoCookies().PostAsJsonAsync("/api/v1/auth/login", new { login = "staff@icecream.local", password = ApiFactory.Password });
        var cookie = RefreshCookie(login);

        var logout = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logout.Headers.Add("Cookie", cookie);
        Assert.Equal(HttpStatusCode.OK, (await NoCookies().SendAsync(logout)).StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, (await RefreshWith(cookie)).StatusCode);
    }
}
