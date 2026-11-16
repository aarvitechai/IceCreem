using IceCream.Api.Infrastructure;
using IceCream.Application.Common;
using IceCream.Application.Features.Operations;
using IceCream.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IceCream.Api.Controllers;

[Route("api/v1/admin")]
[Authorize(Policy = Policies.Staff)]
public sealed class InventoryController(InventoryService inventory) : ApiControllerBase
{
    [HttpGet("raw-materials")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RawMaterialDto>>>> RawMaterials(CancellationToken ct) =>
        Success(await inventory.RawMaterialsAsync(ct));

    [HttpPost("raw-materials")]
    public async Task<ActionResult<ApiResponse<RawMaterialDto>>> CreateRaw(SaveRawMaterialRequest req, CancellationToken ct) =>
        Created(await inventory.SaveRawMaterialAsync(null, req, ct));

    [HttpPut("raw-materials/{id:long}")]
    public async Task<ActionResult<ApiResponse<RawMaterialDto>>> UpdateRaw(long id, SaveRawMaterialRequest req, CancellationToken ct) =>
        Success(await inventory.SaveRawMaterialAsync(id, req, ct));

    [HttpPost("raw-materials/{id:long}/stock")]
    public async Task<ActionResult<ApiResponse<RawMaterialDto>>> MoveRaw(long id, StockMoveRequest req, CancellationToken ct) =>
        Success(await inventory.MoveRawStockAsync(id, req, ct), "Stock updated.");

    [HttpGet("raw-materials/{id:long}/ledger")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RawTxnDto>>>> Ledger(long id, CancellationToken ct) =>
        Success(await inventory.LedgerAsync(id, ct));

    [HttpGet("stock/finished")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishedStockDto>>>> Finished(CancellationToken ct) =>
        Success(await inventory.FinishedStockAsync(ct));

    [HttpPost("stock/finished/{variantId:long}/adjust")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<bool>>> Adjust(long variantId, FinishedAdjustRequest req, CancellationToken ct)
    {
        await inventory.AdjustFinishedAsync(variantId, req, ct);
        return Success(true, "Stock adjusted.");
    }

    [HttpGet("recipes/{variantId:long}")]
    public async Task<ActionResult<ApiResponse<RecipeDto>>> Recipe(long variantId, CancellationToken ct) =>
        Success(await inventory.RecipeAsync(variantId, ct));

    [HttpPut("recipes/{variantId:long}")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<RecipeDto>>> SaveRecipe(long variantId, List<RecipeLine> items, CancellationToken ct) =>
        Success(await inventory.SaveRecipeAsync(variantId, items, ct), "Recipe saved.");

    [HttpGet("production/batches")]
    public async Task<ActionResult<ApiResponse<PagedResult<BatchDto>>>> Batches([FromQuery] BatchStatus? status, [FromQuery] PageQuery page, CancellationToken ct) =>
        Success(await inventory.BatchesAsync(status, page, ct));

    [HttpPost("production/batches")]
    public async Task<ActionResult<ApiResponse<long>>> CreateBatch(CreateBatchRequest req, CancellationToken ct) =>
        Created(await inventory.CreateBatchAsync(req, ct), "Batch planned.");

    [HttpPost("production/batches/{id:long}/start")]
    public async Task<ActionResult<ApiResponse<bool>>> Start(long id, CancellationToken ct)
    {
        await inventory.StartBatchAsync(id, ct);
        return Success(true, "Batch started. Raw material deducted.");
    }

    [HttpPost("production/batches/{id:long}/complete")]
    public async Task<ActionResult<ApiResponse<bool>>> Complete(long id, CompleteBatchRequest req, CancellationToken ct)
    {
        await inventory.CompleteBatchAsync(id, req, ct);
        return Success(true, "Batch completed. Finished stock added.");
    }
}

[Route("api/v1/admin/hawkers")]
[Authorize(Policy = Policies.Staff)]
public sealed class AdminHawkersController(HawkerService hawkers) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<HawkerDto>>>> List(CancellationToken ct) =>
        Success(await hawkers.ListAsync(ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<HawkerDetailDto>>> Get(long id, CancellationToken ct) =>
        Success(await hawkers.GetAsync(id, ct));

    [HttpPost]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<long>>> Create(SaveHawkerRequest req, CancellationToken ct) =>
        Created(await hawkers.SaveAsync(null, req, ct));

    [HttpPut("{id:long}")]
    [Authorize(Policy = Policies.Admin)]
    public async Task<ActionResult<ApiResponse<long>>> Update(long id, SaveHawkerRequest req, CancellationToken ct) =>
        Success(await hawkers.SaveAsync(id, req, ct));

    [HttpPost("{id:long}/issue-stock")]
    public async Task<ActionResult<ApiResponse<IssueDto>>> Issue(long id, IssueStockRequest req, CancellationToken ct) =>
        Success(await hawkers.IssueStockAsync(id, req, ct), "Stock issued.");

    [HttpPost("issues/{issueId:long}/settle")]
    public async Task<ActionResult<ApiResponse<IssueDto>>> Settle(long issueId, SettleRequest req, CancellationToken ct) =>
        Success(await hawkers.SettleAsync(issueId, req, ct), "Settlement saved.");

    [HttpPost("{id:long}/payments")]
    public async Task<ActionResult<ApiResponse<HawkerDto>>> Payment(long id, HawkerPaymentRequest req, CancellationToken ct) =>
        Success(await hawkers.ReceivePaymentAsync(id, req.Amount, ct), "Payment received.");
}

[Route("api/v1/hawker")]
[Authorize(Policy = Policies.Hawker)]
public sealed class HawkerController(HawkerService hawkers) : ApiControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<HawkerDetailDto>>> Me(CancellationToken ct) => Success(await hawkers.MeAsync(ct));
}
