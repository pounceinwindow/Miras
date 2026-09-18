using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;

namespace Miras.Api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/locations").WithTags("Locations");

        group.MapGet("/", async (int? userId, AppDbContext db, CancellationToken ct) =>
        {
            var capturedEntityIds = new HashSet<int>();
            if (userId.HasValue)
            {
                capturedEntityIds = (await db.UserEntities
                    .Where(ue => ue.UserId == userId.Value)
                    .Select(ue => ue.EntityId)
                    .ToListAsync(ct))
                    .ToHashSet();
            }

            var locations = await db.Locations
                .Include(l => l.Entity)
                .Select(l => new LocationDto(
                    l.Id,
                    l.Name,
                    l.Latitude,
                    l.Longitude,
                    l.EntityId,
                    l.Entity.Name,
                    capturedEntityIds.Contains(l.EntityId) ? "captured" : "available"
                ))
                .ToListAsync(ct);

            return Results.Ok(locations);
        })
        .WithName("GetLocations")
        .WithSummary("Получить список всех игровых точек на карте");

        group.MapGet("/{id:int}", async (int id, int? userId, AppDbContext db, CancellationToken ct) =>
        {
            var location = await db.Locations
                .Include(l => l.Entity)
                .FirstOrDefaultAsync(l => l.Id == id, ct);

            if (location is null)
                return Results.NotFound(new { error = "Точка не найдена." });

            var isCaptured = userId.HasValue && await db.UserEntities
                .AnyAsync(ue => ue.UserId == userId.Value && ue.EntityId == location.EntityId, ct);

            return Results.Ok(new LocationDto(
                location.Id,
                location.Name,
                location.Latitude,
                location.Longitude,
                location.EntityId,
                location.Entity.Name,
                isCaptured ? "captured" : "available"
            ));
        })
        .WithName("GetLocation")
        .WithSummary("Получить информацию о конкретной точке");
    }
}
