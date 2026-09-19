using Microsoft.EntityFrameworkCore;
using Miras.Api.Dtos;
using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class PvpEndpoints
{
    public static void MapPvpEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/pvp").WithTags("PvP");

        group.MapGet("/me", async (HttpRequest request, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
        {
            var user = await auth.ResolveAsync(request, ct);
            return user is null ? Results.Unauthorized() : Results.Ok(await pvp.GetProfileAsync(user, ct));
        });

        group.MapPut("/me", async (HttpRequest request, UpdatePvpProfileRequest body, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, user => pvp.UpdateProfileAsync(user, body.Name, ct)));

        group.MapGet("/leaderboard", async (PvpService pvp, CancellationToken ct) =>
            Results.Ok(await pvp.LeaderboardAsync(ct)));

        group.MapGet("/matches/current", async (HttpRequest request, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, user => pvp.CurrentAsync(user, ct)));

        group.MapPost("/matches", async (HttpRequest request, CreatePvpMatchRequest body, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, user => pvp.CreateAsync(user, body.CharacterId, ct)));

        group.MapPost("/matches/join", async (HttpRequest request, JoinPvpMatchRequest body, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, user => pvp.JoinAsync(user, body.Code, body.CharacterId, ct)));

        group.MapGet("/matches/{id:guid}", async (Guid id, HttpRequest request, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, user => pvp.GetAsync(user, id, ct)));

        group.MapPost("/matches/{id:guid}/move", async (Guid id, HttpRequest request, PvpMoveRequest body, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, user => pvp.MoveAsync(user, id, body.Move, ct)));

        group.MapDelete("/matches/{id:guid}", async (Guid id, HttpRequest request, GameAuthService auth, PvpService pvp, CancellationToken ct) =>
            await Execute(request, auth, ct, async user =>
            {
                await pvp.CancelAsync(user, id, ct);
                return new { cancelled = true };
            }));
    }

    private static async Task<IResult> Execute<T>(
        HttpRequest request,
        GameAuthService auth,
        CancellationToken ct,
        Func<Models.User, Task<T>> action)
    {
        try
        {
            var user = await auth.ResolveAsync(request, ct);
            if (user is null) return Results.Unauthorized();
            return Results.Ok(await action(user));
        }
        catch (DbUpdateConcurrencyException)
        {
            return Results.Conflict(new { error = "Раунд уже изменился. Обнови поединок." });
        }
        catch (InvalidOperationException exception)
        {
            return Results.BadRequest(new { error = exception.Message });
        }
    }
}
