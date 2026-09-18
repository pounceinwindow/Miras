using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;

namespace Miras.Api.Endpoints;

public static class EntityEndpoints
{
    public static void MapEntityEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/entities").WithTags("Entities");

        group.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
        {
            var entities = await db.Entities
                .Select(e => new EntityListDto(
                    e.Id, e.Name, e.Slug, e.Category, e.Description,
                    e.BaseHp, e.BaseAttack, e.BaseDefense
                ))
                .ToListAsync(ct);
            return Results.Ok(entities);
        })
        .WithName("GetEntities")
        .WithSummary("Получить список всех игровых сущностей");

        group.MapGet("/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var entity = await db.Entities
                .Where(e => e.Id == id)
                .Select(e => new EntityDetailsDto(
                    e.Id, e.Name, e.Slug, e.Category, e.Description, e.Story,
                    e.BaseHp, e.BaseAttack, e.BaseDefense,
                    e.AbilityName, e.AbilityDescription, e.AbilityPower
                ))
                .FirstOrDefaultAsync(ct);
            return entity is null ? Results.NotFound(new { error = "Сущность не найдена." }) : Results.Ok(entity);
        })
        .WithName("GetEntity")
        .WithSummary("Получить конкретную игровую сущность по ID");
    }
}
