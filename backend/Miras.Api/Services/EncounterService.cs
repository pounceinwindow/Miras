using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;

namespace Miras.Api.Services;

public class EncounterService(AppDbContext db)
{
    public async Task<EncounterDto> StartEncounterAsync(StartEncounterRequest request, CancellationToken ct)
    {
        var location = await db.Locations
            .Include(l => l.Entity)
            .FirstOrDefaultAsync(l => l.NfcToken == request.LocationToken, ct)
            ?? throw new InvalidOperationException("NFC-метка не найдена.");

        var user = await db.Users.FindAsync([request.UserId], ct)
            ?? throw new InvalidOperationException("Пользователь не найден.");

        // Check if already captured
        var alreadyCaptured = await db.UserEntities
            .AnyAsync(ue => ue.UserId == request.UserId && ue.EntityId == location.EntityId, ct);
        if (alreadyCaptured)
            throw new InvalidOperationException("Персонаж уже в твоей коллекции!");

        // Check cooldown from last failed encounter
        var lastFailed = await db.Encounters
            .Where(e => e.UserId == request.UserId && e.EntityId == location.EntityId && e.Status == EncounterStatus.Failed)
            .OrderByDescending(e => e.RetryAt)
            .FirstOrDefaultAsync(ct);

        if (lastFailed?.RetryAt != null && lastFailed.RetryAt > DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException(
                $"Повторная попытка будет доступна {lastFailed.RetryAt:yyyy-MM-dd HH:mm} UTC.");
        }

        var encounter = new Encounter
        {
            UserId = request.UserId,
            EntityId = location.EntityId,
            LocationId = location.Id,
            Status = EncounterStatus.Started,
            StartedAt = DateTimeOffset.UtcNow
        };

        db.Encounters.Add(encounter);
        await db.SaveChangesAsync(ct);

        return new EncounterDto(
            encounter.Id,
            location.Entity.Id,
            location.Entity.Name,
            location.Entity.Story,
            location.Name,
            encounter.Status.ToString(),
            encounter.StartedAt,
            null
        );
    }
}
