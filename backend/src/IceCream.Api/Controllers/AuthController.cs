using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IceCream.Api.Controllers;

[Route("api/v1/auth")]
public sealed class AuthController(AuthService auth, IWebHostEnvironment env) : ApiControllerBase
{
    private const string RefreshCookie = "ic_refresh";

    [HttpPost("register")]
    [EnableRateLimiting(RateLimits.Auth)]
    public async Task<ActionResult<ApiResponse<AuthResult>>> Register(RegisterRequest request, CancellationToken ct) =>
        Created(WithCookie(await auth.RegisterAsync(request, ct)), "Account created.");

    [HttpPost("login")]
    [EnableRateLimiting(RateLimits.Auth)]
    public async Task<ActionResult<ApiResponse<AuthResult>>> Login(LoginRequest request, CancellationToken ct) =>
        Success(WithCookie(await auth.LoginAsync(request, ct)));

    [HttpPost("refresh")]
    [EnableRateLimiting(RateLimits.Auth)]
    public async Task<ActionResult<ApiResponse<AuthResult>>> Refresh(CancellationToken ct)
    {
        try
        {
            return Success(WithCookie(await auth.RefreshAsync(Request.Cookies[RefreshCookie], ct)));
        }
        catch (UnauthorizedException)
        {
            Response.Cookies.Delete(RefreshCookie, CookieOptions(DateTime.UnixEpoch));
            throw;
        }
    }

    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<bool>>> Logout(CancellationToken ct)
    {
        await auth.LogoutAsync(Request.Cookies[RefreshCookie], ct);
        Response.Cookies.Delete(RefreshCookie, CookieOptions(DateTime.UnixEpoch));
        return Success(true, "Logged out.");
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Me(CancellationToken ct) => Success(await auth.MeAsync(ct));

    private AuthResult WithCookie(AuthSession session)
    {
        Response.Cookies.Append(RefreshCookie, session.RefreshToken, CookieOptions(session.RefreshExpiresAt));
        return session.Result;
    }

    private CookieOptions CookieOptions(DateTime expires) => new()
    {
        HttpOnly = true,
        Secure = !env.IsDevelopment() || Request.IsHttps,
        SameSite = SameSiteMode.Strict,
        Path = "/api/v1/auth",
        Expires = expires
    };
}
