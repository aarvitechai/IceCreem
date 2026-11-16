using FluentValidation;
using IceCream.Application.Common;
using IceCream.Domain.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace IceCream.Api.Infrastructure;

/// <summary>Turns every exception into the standard ApiResponse shape with the right status code.</summary>
public sealed class ExceptionHandler(ILogger<ExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, body) = exception switch
        {
            ValidationException v => (StatusCodes.Status400BadRequest, ApiResponse.Fail("Validation failed.",
                v.Errors.GroupBy(e => ToCamel(e.PropertyName))
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray()))),
            DomainException d => (StatusCodes.Status400BadRequest, ApiResponse.Fail(d.Message)),
            NotFoundException n => (StatusCodes.Status404NotFound, ApiResponse.Fail(n.Message)),
            UnauthorizedException u => (StatusCodes.Status401Unauthorized, ApiResponse.Fail(u.Message)),
            ForbiddenException f => (StatusCodes.Status403Forbidden, ApiResponse.Fail(f.Message)),
            ConflictException c => (StatusCodes.Status409Conflict, ApiResponse.Fail(c.Message)),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict,
                ApiResponse.Fail("This record was changed by someone else. Please refresh and try again.")),
            BadHttpRequestException b => (b.StatusCode, ApiResponse.Fail(b.Message)),
            _ => (StatusCodes.Status500InternalServerError, ApiResponse.Fail("Something went wrong. Please try again."))
        };

        if (status >= 500)
            logger.LogError(exception, "Unhandled error on {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            logger.LogInformation("Request failed with {Status}: {Message}", status, exception.Message);

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(body, ct);
        return true;
    }

    private static string ToCamel(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
