using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Catalog;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace IceCream.Api.Controllers;

[Route("api/v1")]
public sealed class CatalogController(CatalogService catalog) : ApiControllerBase
{
    [HttpGet("categories")]
    [OutputCache(PolicyName = CachePolicies.Catalog)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CategoryDto>>>> Categories(CancellationToken ct) =>
        Success(await catalog.GetCategoriesAsync(ct));

    [HttpGet("products")]
    [OutputCache(PolicyName = CachePolicies.Catalog)]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductCardDto>>>> Products([FromQuery] ProductQuery query, CancellationToken ct) =>
        Success(await catalog.GetProductsAsync(query, ct));

    [HttpGet("products/featured")]
    [OutputCache(PolicyName = CachePolicies.Catalog)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductCardDto>>>> Featured(CancellationToken ct) =>
        Success(await catalog.GetFeaturedAsync(ct));

    [HttpGet("products/{slug}")]
    [OutputCache(PolicyName = CachePolicies.Catalog)]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> Product(string slug, CancellationToken ct) =>
        Success(await catalog.GetBySlugAsync(slug, ct));

    [HttpGet("banners")]
    [OutputCache(PolicyName = CachePolicies.Catalog)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BannerDto>>>> Banners(CancellationToken ct) =>
        Success(await catalog.GetBannersAsync(ct));

    [HttpGet("wedding-packages")]
    [OutputCache(PolicyName = CachePolicies.Catalog)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PackageDto>>>> Packages(CancellationToken ct) =>
        Success(await catalog.GetPackagesAsync(ct));
}
