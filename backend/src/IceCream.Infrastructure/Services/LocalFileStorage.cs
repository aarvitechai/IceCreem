using IceCream.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace IceCream.Infrastructure.Services;

/// <summary>
/// Saves files under wwwroot/uploads. Swap with a blob storage implementation
/// (Azure Blob or S3) for multi server production without changing callers.
/// </summary>
public sealed class LocalFileStorage(IWebHostEnvironment env) : IFileStorage
{
    public async Task<string> SaveAsync(Stream content, string fileName, string folder, CancellationToken ct)
    {
        var root = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var dir = Path.Combine(root, "uploads", folder);
        Directory.CreateDirectory(dir);

        var name = $"{Guid.NewGuid():N}{Path.GetExtension(fileName).ToLowerInvariant()}";
        await using var file = File.Create(Path.Combine(dir, name));
        await content.CopyToAsync(file, ct);

        return $"/uploads/{folder}/{name}";
    }
}
