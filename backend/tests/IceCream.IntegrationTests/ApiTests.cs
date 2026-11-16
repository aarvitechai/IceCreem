using System.Net;
using System.Net.Http.Json;

namespace IceCream.IntegrationTests;

public sealed class ApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string Admin = "admin@icecream.local";
    private const string Customer = "customer@icecream.local";

    private async Task<long> VariantIdAsync(string slug)
    {
        var res = await factory.CreateClient().GetAsync($"/api/v1/products/{slug}");
        var data = await res.DataAsync();
        return data.GetProperty("variants")[0].GetProperty("id").GetInt64();
    }

    private static object Order(long variantId, int qty) => new
    {
        items = new[] { new { variantId, quantity = qty } },
        customerName = "Test Guest",
        mobile = "9876543210",
        addressLine = "1 Test Street",
        city = "Lucknow",
        pincode = "226001",
        paymentMethod = "CashOnDelivery"
    };

    [Fact]
    public async Task Health_and_public_catalog_work()
    {
        var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);

        var products = await (await client.GetAsync("/api/v1/products?category=tubs")).DataAsync();
        Assert.True(products.GetProperty("totalCount").GetInt32() >= 3);

        var banners = await (await client.GetAsync("/api/v1/banners")).DataAsync();
        Assert.True(banners.GetArrayLength() > 0);
    }

    [Fact]
    public async Task Protected_routes_need_the_right_role()
    {
        var anon = factory.CreateClient();
        var customer = await factory.ClientAsAsync(Customer);

        Assert.Equal(HttpStatusCode.Unauthorized, (await anon.GetAsync("/api/v1/admin/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await customer.GetAsync("/api/v1/admin/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await customer.GetAsync("/api/v1/superadmin/users")).StatusCode);
    }

    [Fact]
    public async Task Guest_order_flows_from_placed_to_confirmed_and_reserves_stock()
    {
        var variantId = await VariantIdAsync("belgian-chocolate");
        var guest = factory.CreateClient();
        var admin = await factory.ClientAsAsync(Admin);

        var placed = await guest.PostAsJsonAsync("/api/v1/orders", Order(variantId, 2));
        Assert.Equal(HttpStatusCode.Created, placed.StatusCode);
        var order = await placed.DataAsync();
        var id = order.GetProperty("id").GetInt64();
        var number = order.GetProperty("orderNumber").GetString()!;
        Assert.StartsWith("ICE-", number);

        var confirm = await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{id}/status", new { status = "Confirmed" });
        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);

        var stock = await (await admin.GetAsync("/api/v1/admin/stock/finished")).DataAsync();
        var row = stock.EnumerateArray().First(s => s.GetProperty("variantId").GetInt64() == variantId);
        Assert.True(row.GetProperty("reservedQty").GetInt32() >= 2);

        var track = await guest.GetAsync($"/api/v1/orders/track/{number}?mobile=9876543210");
        Assert.Equal(HttpStatusCode.OK, track.StatusCode);
        var wrongMobile = await guest.GetAsync($"/api/v1/orders/track/{number}?mobile=9000000000");
        Assert.Equal(HttpStatusCode.NotFound, wrongMobile.StatusCode);
    }

    [Fact]
    public async Task Invalid_order_returns_field_errors()
    {
        var res = await factory.CreateClient().PostAsJsonAsync("/api/v1/orders", new
        {
            items = Array.Empty<object>(), customerName = "A", mobile = "123", addressLine = "x", city = "y", pincode = "1"
        });

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(ApiFactory.Json);
        Assert.Equal("Validation failed.", body.GetProperty("message").GetString());
        var errors = body.GetProperty("errors");
        Assert.True(errors.TryGetProperty("items", out _));
        Assert.True(errors.TryGetProperty("mobile", out _));
        Assert.True(errors.TryGetProperty("pincode", out _));
    }

    [Fact]
    public async Task Skipping_order_steps_is_rejected()
    {
        var variantId = await VariantIdAsync("malai-kulfi");
        var admin = await factory.ClientAsAsync(Admin);
        var order = await (await factory.CreateClient().PostAsJsonAsync("/api/v1/orders", Order(variantId, 1))).DataAsync();

        var res = await admin.PatchAsJsonAsync($"/api/v1/admin/orders/{order.GetProperty("id").GetInt64()}/status", new { status = "Delivered" });

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Booking_needs_seven_days_notice()
    {
        var soon = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)).ToString("yyyy-MM-dd");
        var res = await factory.CreateClient().PostAsJsonAsync("/api/v1/bookings", new
        {
            contactName = "Test", mobile = "9876543210", eventType = "Wedding", eventDate = soon,
            venueName = "Hall", venueAddress = "City", guestCount = 200
        });

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Refresh_token_rotates_and_old_token_is_rejected()
    {
        var client = factory.CreateClient();
        await client.PostAsJsonAsync("/api/v1/auth/login", new { login = "staff@icecream.local", password = ApiFactory.Password });

        var first = await client.PostAsync("/api/v1/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsync("/api/v1/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        var logout = await client.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/v1/auth/refresh", null)).StatusCode);
    }

    [Fact]
    public async Task Account_locks_after_five_wrong_passwords()
    {
        var client = factory.CreateClient();
        for (var i = 0; i < 5; i++)
            await client.PostAsJsonAsync("/api/v1/auth/login", new { login = "hawker@icecream.local", password = "Wrong@123" });

        var res = await client.PostAsJsonAsync("/api/v1/auth/login", new { login = "hawker@icecream.local", password = ApiFactory.Password });

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
        Assert.Contains("locked", await res.MessageAsync());
    }

    [Fact]
    public async Task Dashboard_summary_is_available_to_admin()
    {
        var admin = await factory.ClientAsAsync(Admin);

        var res = await admin.GetAsync("/api/v1/dashboard/admin/summary");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.True((await res.DataAsync()).GetProperty("lowStockItems").GetInt32() >= 1);
    }

    [Fact]
    public async Task Analytics_counts_todays_order_and_fills_every_day_and_hour()
    {
        var variantId = await VariantIdAsync("classic-vanilla");
        await factory.CreateClient().PostAsJsonAsync("/api/v1/orders", Order(variantId, 1));
        var admin = await factory.ClientAsAsync(Admin);

        var res = await admin.GetAsync("/api/v1/dashboard/admin/analytics?days=7");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var data = await res.DataAsync();
        Assert.Equal(7, data.GetProperty("trend").GetArrayLength());
        Assert.Equal(7, data.GetProperty("weekdays").GetArrayLength());
        Assert.Equal(24, data.GetProperty("hours").GetArrayLength());
        Assert.True(data.GetProperty("current").GetProperty("orders").GetInt32() >= 1);
        Assert.Contains(data.GetProperty("cities").EnumerateArray(), c => c.GetProperty("name").GetString() == "Lucknow");
    }

    [Fact]
    public async Task Analytics_is_closed_to_customers()
    {
        var customer = await factory.ClientAsAsync(Customer);
        var res = await customer.GetAsync("/api/v1/dashboard/admin/analytics");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Small_birthday_enquiry_is_accepted()
    {
        var later = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20)).ToString("yyyy-MM-dd");
        var res = await factory.CreateClient().PostAsJsonAsync("/api/v1/bookings", new
        {
            contactName = "Test Parent", mobile = "9876543210", eventType = "Birthday", eventDate = later,
            venueName = "Home", venueAddress = "12 Park Road, Lucknow", guestCount = 30
        });

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        Assert.Equal("Birthday", (await res.DataAsync()).GetProperty("eventType").GetString());
    }
}
