using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Models;
using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class GameEndpoints
{
    public static void MapGameEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/guest", async (AppDbContext db, CancellationToken ct) =>
        {
            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            var user = new User
            {
                Username = $"guest-{Guid.NewGuid():N}",
                ChakChak = 0,
                GameTokenHash = Hash(token)
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { token });
        }).WithTags("Game");

        app.MapPost("/api/game", async (
            HttpRequest request,
            JsonElement command,
            AppDbContext db,
            GameService game,
            CancellationToken ct) =>
        {
            try
            {
                var header = request.Headers.Authorization.ToString();
                if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    return Results.Unauthorized();
                var hash = Hash(header[7..].Trim());
                var user = await db.Users.SingleOrDefaultAsync(item => item.GameTokenHash == hash, ct);
                if (user is null) return Results.Unauthorized();
                return Results.Ok(await game.ExecuteAsync(user, command, ct));
            }
            catch (DbUpdateConcurrencyException)
            {
                return Results.Conflict(new { error = "Состояние изменилось. Повтори действие." });
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { error = exception.Message });
            }
        }).WithTags("Game");
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
