using Miras.Api.Dtos;
using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class BattleEndpoints
{
    public static void MapBattleEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/battles").WithTags("Battles");

        group.MapPost("/start", async (StartBattleRequest request, BattleService battleService, CancellationToken ct) =>
        {
            try
            {
                var battle = await battleService.StartBattleAsync(request, ct);
                return Results.Ok(battle);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("StartBattle")
        .WithSummary("Начать бой с противником");

        group.MapPost("/{battleId:int}/attack", async (int battleId, BattleService battleService, CancellationToken ct) =>
        {
            try
            {
                var result = await battleService.AttackAsync(battleId, ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("Attack")
        .WithSummary("Выполнить обычную атаку");

        group.MapPost("/{battleId:int}/ability", async (int battleId, BattleService battleService, CancellationToken ct) =>
        {
            try
            {
                var result = await battleService.UseAbilityAsync(battleId, ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UseAbility")
        .WithSummary("Использовать способность персонажа");
    }
}
