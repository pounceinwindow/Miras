using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class UpgradeEndpoints
{
    public static void MapUpgradeEndpoints(this WebApplication app)
    {
        app.MapPost("/api/user-entities/{id:int}/upgrade", async (int id, UpgradeService upgradeService, CancellationToken ct) =>
        {
            try
            {
                var result = await upgradeService.UpgradeAsync(id, ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpgradeEntity")
        .WithTags("Upgrade")
        .WithSummary("Повысить уровень персонажа за чак-чак");
    }
}
