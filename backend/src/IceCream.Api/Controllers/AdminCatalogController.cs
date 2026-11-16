using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using static IceCream.Application.Features.Catalog.AdminCatalogService;

namespace IceCream.Api.Controllers;

[Route("api/v1/admin")]
[Authorize(Policy = Policies.Admin)]
public sealed class AdminCatalogController(AdminCatalogService admin, IOutputCacheStore cache) : ApiControllerBase
{
    public sealed record StatusRequest(bool IsActive);

    [HttpGet("products")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminProductRow>>>> Products([FromQuery] AdminProductQuery q, CancellationToken ct) =>
        Success(await admin.GetProductsAsync(q, ct));

    [HttpGet("products/{id:long}")]
    public async Task<ActionResult<ApiResponse<AdminProductDto>>> Product(long id, CancellationToken ct) =>
        Success(await admin.GetProductAsync(id, ct));

    [HttpPost("products")]
    public async Task<ActionResult<ApiResponse<AdminProductDto>>> Create(SaveProductRequest req, CancellationToken ct)
    {
        var result = await admin.CreateProductAsync(req, ct);
        await ClearCache(ct);
        return Created(result, "Product created.");
    }

    [HttpPut("products/{id:long}")]
    public async Task<ActionResult<ApiResponse<AdminProductDto>>> Update(long id, SaveProductRequest req, CancellationToken ct)
    {
        var result = await admin.UpdateProductAsync(id, req, ct);
        await ClearCache(ct);
        return Success(result, "Product updated.");
    }

    [HttpPatch("products/{id:long}/status")]
    public async Task<ActionResult<ApiResponse<bool>>> Status(long id, StatusRequest req, CancellationToken ct)
    {
        await admin.SetProductStatusAsync(id, req.IsActive, ct);
        await ClearCache(ct);
        return Success(true);
    }

    [HttpDelete("products/{id:long}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(long id, CancellationToken ct)
    {
        await admin.DeleteProductAsync(id, ct);
        await ClearCache(ct);
        return Success(true, "Product deleted.");
    }

    [HttpPost("uploads/images")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<string>>> Upload(IFormFile file, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        return Success(await admin.UploadImageAsync(stream, file.FileName, file.Length, ct));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CategoryDto>>>> Categories(CancellationToken ct) =>
        Success(await admin.GetCategoriesAsync(ct));

    [HttpPost("categories")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory(SaveCategoryRequest req, CancellationToken ct)
    {
        var result = await admin.SaveCategoryAsync(null, req, ct);
        await ClearCache(ct);
        return Created(result);
    }

    [HttpPut("categories/{id:long}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(long id, SaveCategoryRequest req, CancellationToken ct)
    {
        var result = await admin.SaveCategoryAsync(id, req, ct);
        await ClearCache(ct);
        return Success(result);
    }

    [HttpDelete("categories/{id:long}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCategory(long id, CancellationToken ct)
    {
        await admin.DeleteCategoryAsync(id, ct);
        await ClearCache(ct);
        return Success(true);
    }

    [HttpGet("banners")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminBannerDto>>>> Banners(CancellationToken ct) =>
        Success(await admin.GetBannersAsync(ct));

    [HttpPost("banners")]
    public async Task<ActionResult<ApiResponse<long>>> CreateBanner(SaveBannerRequest req, CancellationToken ct) =>
        await Cached(admin.SaveBannerAsync(null, req, ct), ct);

    [HttpPut("banners/{id:long}")]
    public async Task<ActionResult<ApiResponse<long>>> UpdateBanner(long id, SaveBannerRequest req, CancellationToken ct) =>
        await Cached(admin.SaveBannerAsync(id, req, ct), ct);

    [HttpDelete("banners/{id:long}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteBanner(long id, CancellationToken ct)
    {
        await admin.DeleteBannerAsync(id, ct);
        await ClearCache(ct);
        return Success(true);
    }

    [HttpGet("wedding-packages")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminPackageDto>>>> Packages(CancellationToken ct) =>
        Success(await admin.GetPackagesAsync(ct));

    [HttpPost("wedding-packages")]
    public async Task<ActionResult<ApiResponse<long>>> CreatePackage(SavePackageRequest req, CancellationToken ct) =>
        await Cached(admin.SavePackageAsync(null, req, ct), ct);

    [HttpPut("wedding-packages/{id:long}")]
    public async Task<ActionResult<ApiResponse<long>>> UpdatePackage(long id, SavePackageRequest req, CancellationToken ct) =>
        await Cached(admin.SavePackageAsync(id, req, ct), ct);

    private async Task<ActionResult<ApiResponse<long>>> Cached(Task<long> work, CancellationToken ct)
    {
        var id = await work;
        await ClearCache(ct);
        return Success(id);
    }

    private ValueTask ClearCache(CancellationToken ct) => cache.EvictByTagAsync(CachePolicies.CatalogTag, ct);
}
