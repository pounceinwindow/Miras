using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;
using Miras.Api.Pve;

namespace Miras.Api.Services;

public sealed class GameService(AppDbContext db)
{
    private static readonly Dictionary<string, int[]> QuizKeys = new()
    {
        ["shurale"] = [0, 1, 2],
        ["syuyumbike"] = [1, 0, 2],
        ["su-anasy"] = [1, 2, 0],
        ["kereml"] = [1, 0, 2]
    };
    private static readonly Dictionary<string, string> Tags = new()
    {
        ["forest-01"] = "shurale",
        ["tower-01"] = "syuyumbike",
        ["water-01"] = "su-anasy",
        ["stone-01"] = "kereml"
    };

    public async Task<GameResultDto> ExecuteAsync(User user, JsonElement command, CancellationToken ct)
    {
        var type = RequiredString(command, "type");
        string? outcome = null;
        switch (type)
        {
            case "sync":
                await EnsureStarterAsync(user, ct);
                break;
            case "capture":
                outcome = await SubmitQuizAsync(user, command, ct);
                break;
            case "pveStart":
                await StartBattleAsync(user, command, ct);
                break;
            case "pve":
                await CommandBattleAsync(user, command, ct);
                break;
            default:
                throw new InvalidOperationException("Неизвестная команда игры.");
        }
        await db.SaveChangesAsync(ct);
        return new GameResultDto(await ProgressAsync(user, ct), outcome);
    }

    private async Task EnsureStarterAsync(User user, CancellationToken ct)
    {
        if (await db.UserEntities.AnyAsync(item => item.UserId == user.Id, ct)) return;
        var starter = await db.Entities.SingleAsync(item => item.Slug == "su-anasy", ct);
        db.UserEntities.Add(new UserEntity
        {
            UserId = user.Id,
            EntityId = starter.Id,
            Level = 1,
            ObtainedAt = DateTimeOffset.UtcNow
        });
    }

    private async Task<string> SubmitQuizAsync(User user, JsonElement command, CancellationToken ct)
    {
        await EnsureStarterAsync(user, ct);
        var slug = RequiredString(command, "characterId");
        var tag = RequiredString(command, "tagId");
        if (!Tags.TryGetValue(tag, out var tagSlug) || tagSlug != slug)
            throw new InvalidOperationException("Неверная метка встречи.");
        var entity = await db.Entities.SingleOrDefaultAsync(item => item.Slug == slug, ct)
            ?? throw new InvalidOperationException("Хранитель не найден.");
        if (await db.UserEntities.AnyAsync(item => item.UserId == user.Id && item.EntityId == entity.Id, ct))
            throw new InvalidOperationException("Хранитель уже в коллекции.");
        var latest = await db.Encounters
            .Where(item => item.UserId == user.Id && item.EntityId == entity.Id)
            .OrderByDescending(item => item.StartedAt)
            .FirstOrDefaultAsync(ct);
        if (latest?.Status == EncounterStatus.ReadyForBattle)
            return "ready";
        if (latest?.Status == EncounterStatus.Failed && latest.RetryAt > DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Новая попытка будет доступна через сутки после ошибки.");

        var answers = command.GetProperty("answers").EnumerateArray().Select(item => item.GetInt32()).ToArray();
        if (answers.Length != 3 || !QuizKeys.TryGetValue(slug, out var key))
            throw new InvalidOperationException("Ответь на все три вопроса.");
        var location = await db.Locations.FirstAsync(item => item.EntityId == entity.Id, ct);
        var correct = answers.SequenceEqual(key);
        db.Encounters.Add(new Encounter
        {
            UserId = user.Id,
            EntityId = entity.Id,
            LocationId = location.Id,
            Status = correct ? EncounterStatus.ReadyForBattle : EncounterStatus.Failed,
            RetryAt = correct ? null : DateTimeOffset.UtcNow.AddHours(24)
        });
        return correct ? "ready" : "failed";
    }

    private async Task StartBattleAsync(User user, JsonElement command, CancellationToken ct)
    {
        await EnsureStarterAsync(user, ct);
        var playerSlug = RequiredString(command, "characterId");
        var targetSlug = RequiredString(command, "target");
        var mode = RequiredString(command, "mode");
        if (mode is not ("training" or "encounter")) throw new InvalidOperationException("Неизвестный режим боя.");
        var partySlugs = command.TryGetProperty("party", out var partyElement)
            ? partyElement.EnumerateArray().Select(item => item.GetString()!).Distinct().Take(3).ToList()
            : [playerSlug];
        var party = await db.UserEntities.Include(item => item.Entity)
            .Where(item => item.UserId == user.Id && partySlugs.Contains(item.Entity.Slug)).ToListAsync(ct);
        if (party.Count != partySlugs.Count) throw new InvalidOperationException("В команде есть недоступный хранитель.");
        var target = await db.Entities.SingleOrDefaultAsync(item => item.Slug == targetSlug, ct)
            ?? throw new InvalidOperationException("Соперник не найден.");
        if (mode == "encounter" && await db.UserEntities.AnyAsync(item => item.UserId == user.Id && item.EntityId == target.Id, ct))
            throw new InvalidOperationException("Хранитель уже в коллекции.");
        Encounter? encounter = null;
        if (mode == "encounter")
        {
            var tag = RequiredString(command, "tagId");
            if (!Tags.TryGetValue(tag, out var tagSlug) || tagSlug != targetSlug)
                throw new InvalidOperationException("Открой босса с его локации.");
            var location = await db.Locations.FirstAsync(item => item.EntityId == target.Id, ct);
            encounter = new Encounter { UserId = user.Id, EntityId = target.Id, LocationId = location.Id, Status = EncounterStatus.ReadyForBattle };
            db.Encounters.Add(encounter);
        }
        var active = await db.PveBattles.Where(item => item.UserId == user.Id)
            .OrderByDescending(item => item.UpdatedAt).FirstOrDefaultAsync(ct);
        if (active is not null && Deserialize(active).Status == "active")
            throw new InvalidOperationException("Сначала заверши текущий бой.");
        var id = Guid.NewGuid();
        var orderedParty = partySlugs.Select(slug => party.Single(item => item.Entity.Slug == slug)).Select(item => (item.Entity.Slug, item.Level)).ToList();
        var state = PveEngine.Create(id, orderedParty, targetSlug, mode);
        db.PveBattles.Add(new PveBattle
        {
            Id = id,
            UserId = user.Id,
            EncounterId = encounter?.Id,
            Encounter = encounter,
            StateJson = JsonSerializer.Serialize(state, PveEngine.Json),
            UpdatedAt = DateTimeOffset.UtcNow
        });
    }

    private async Task CommandBattleAsync(User user, JsonElement command, CancellationToken ct)
    {
        if (!Guid.TryParse(RequiredString(command, "battleId"), out var id))
            throw new InvalidOperationException("Некорректный бой.");
        var row = await db.PveBattles.Include(item => item.Encounter)
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == user.Id, ct)
            ?? throw new InvalidOperationException("Бой не найден.");
        var state = Deserialize(row);
        if (state.Status == "active")
        {
            var now = DateTimeOffset.UtcNow;
            var elapsed = now - row.UpdatedAt;
            if (elapsed.TotalMilliseconds > 1500) state.Paused = true;
            var ticks = Math.Max(0, (int)(elapsed.TotalMilliseconds / PveEngine.TickMs));
            if (!state.Paused) PveEngine.Step(state, ticks);
            row.UpdatedAt = now;
            var action = RequiredString(command, "action");
            if (action == "pause") state.Paused = true;
            if (action == "resume") state.Paused = false;
            if (action == "abandon") state.Status = "lost";
            if (command.TryGetProperty("input", out var input) && input.ValueKind == JsonValueKind.Object)
            {
                var kind = RequiredString(input, "kind");
                if (kind == "move") PveEngine.Move(state, "player", input.GetProperty("lane").GetInt32());
                if (kind == "skill") PveEngine.Cast(state, "player", input.GetProperty("slot").GetInt32());
                if (kind == "switch") PveEngine.Switch(state, input.GetProperty("slot").GetInt32());
            }
        }
        if (state.Status == "won" && !row.RewardApplied)
        {
            row.RewardApplied = true;
            if (state.Mode == "encounter" && row.Encounter is not null)
            {
                if (!await db.UserEntities.AnyAsync(item => item.UserId == user.Id && item.EntityId == row.Encounter.EntityId, ct))
                    db.UserEntities.Add(new UserEntity { UserId = user.Id, EntityId = row.Encounter.EntityId, Level = 1 });
                row.Encounter.Status = EncounterStatus.Completed;
                row.Encounter.CompletedAt = DateTimeOffset.UtcNow;
            }
        }
        row.Version++;
        row.StateJson = JsonSerializer.Serialize(state, PveEngine.Json);
    }

    private async Task<GameProgressDto> ProgressAsync(User user, CancellationToken ct)
    {
        await EnsureStarterAsync(user, ct);
        await db.SaveChangesAsync(ct);
        var collection = await db.UserEntities.Include(item => item.Entity)
            .Where(item => item.UserId == user.Id)
            .Select(item => new OwnedCharacterDto(item.Entity.Slug, item.Level, item.ObtainedAt))
            .ToListAsync(ct);
        var encounters = await db.Encounters.Include(item => item.Entity)
            .Where(item => item.UserId == user.Id).ToListAsync(ct);
        var cooldowns = encounters.Where(item => item.Status == EncounterStatus.Failed && item.RetryAt > DateTimeOffset.UtcNow)
            .GroupBy(item => item.Entity.Slug)
            .ToDictionary(group => group.Key, group => group.Max(item => item.RetryAt!.Value));
        var challenges = encounters.Where(item => item.Status == EncounterStatus.ReadyForBattle)
            .Select(item => item.Entity.Slug).Distinct().ToList();
        var latest = await db.PveBattles.Where(item => item.UserId == user.Id)
            .OrderByDescending(item => item.UpdatedAt).FirstOrDefaultAsync(ct);
        var wins = await db.PveBattles.CountAsync(item => item.UserId == user.Id && item.RewardApplied, ct);
        return new GameProgressDto(
            collection,
            cooldowns,
            wins,
            null,
            latest is null ? null : Deserialize(latest),
            latest?.UpdatedAt.ToUnixTimeMilliseconds() ?? 0,
            challenges,
            new GameModesDto(true, true, false));
    }

    private static PveState Deserialize(PveBattle row) =>
        JsonSerializer.Deserialize<PveState>(row.StateJson, PveEngine.Json)
        ?? throw new InvalidOperationException("Состояние боя повреждено.");

    private static string RequiredString(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()!
            : throw new InvalidOperationException($"Поле {name} обязательно.");
}
