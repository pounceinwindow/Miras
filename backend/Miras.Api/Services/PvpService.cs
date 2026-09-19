using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;

namespace Miras.Api.Services;

public sealed class PvpService(AppDbContext db)
{
    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static readonly HashSet<string> Moves = ["attack", "guard", "skill"];

    public async Task<PvpProfileDto> GetProfileAsync(User user, CancellationToken ct)
    {
        await EnsureIdentityAsync(user, ct);
        return new PvpProfileDto(DisplayName(user), user.PublicCode!, user.PvpWins);
    }

    public async Task<PvpProfileDto> UpdateProfileAsync(User user, string name, CancellationToken ct)
    {
        var clean = name.Trim();
        if (clean.Length is < 2 or > 24)
            throw new InvalidOperationException("Имя должно содержать от 2 до 24 символов.");
        user.DisplayName = clean;
        await EnsureIdentityAsync(user, ct);
        await db.SaveChangesAsync(ct);
        return new PvpProfileDto(DisplayName(user), user.PublicCode!, user.PvpWins);
    }

    public async Task<List<PvpLeaderboardEntryDto>> LeaderboardAsync(CancellationToken ct)
    {
        var rows = await db.Users
            .Where(item => item.PublicCode != null)
            .OrderByDescending(item => item.PvpWins)
            .ThenBy(item => item.CreatedAt)
            .Take(20)
            .Select(item => new { item.DisplayName, item.PublicCode, item.PvpWins })
            .ToListAsync(ct);
        return rows.Select((item, index) => new PvpLeaderboardEntryDto(
            index + 1,
            item.DisplayName ?? $"Игрок {item.PublicCode}",
            item.PvpWins)).ToList();
    }

    public async Task<PvpMatchDto> CreateAsync(User user, string characterId, CancellationToken ct)
    {
        await EnsureIdentityAsync(user, ct);
        await EnsureOwnedAsync(user.Id, characterId, ct);
        var match = new PvpMatch
        {
            Id = Guid.NewGuid(),
            InviteCode = await NewCodeAsync(ct),
            HostUserId = user.Id,
            HostCharacterId = characterId
        };
        db.PvpMatches.Add(match);
        await db.SaveChangesAsync(ct);
        match.HostUser = user;
        return ToDto(match, user.Id);
    }

    public async Task<PvpMatchDto> JoinAsync(User user, string code, string characterId, CancellationToken ct)
    {
        await EnsureIdentityAsync(user, ct);
        await EnsureOwnedAsync(user.Id, characterId, ct);
        var cleanCode = code.Trim().ToUpperInvariant();
        var match = await Query().SingleOrDefaultAsync(item => item.InviteCode == cleanCode, ct)
            ?? throw new InvalidOperationException("Комната с таким кодом не найдена.");
        if (match.HostUserId == user.Id)
            throw new InvalidOperationException("Передай код другу — нельзя войти в собственную комнату.");
        if (match.Status != "waiting" || match.GuestUserId is not null)
            throw new InvalidOperationException("Эта комната уже занята или бой завершён.");
        match.GuestUserId = user.Id;
        match.GuestUser = user;
        match.GuestCharacterId = characterId;
        match.Status = "active";
        match.UpdatedAt = DateTimeOffset.UtcNow;
        match.Version++;
        await db.SaveChangesAsync(ct);
        return ToDto(match, user.Id);
    }

    public async Task<PvpMatchDto?> CurrentAsync(User user, CancellationToken ct)
    {
        var match = await Query()
            .Where(item => (item.HostUserId == user.Id || item.GuestUserId == user.Id)
                           && (item.Status == "waiting" || item.Status == "active"))
            .OrderByDescending(item => item.UpdatedAt)
            .FirstOrDefaultAsync(ct);
        return match is null ? null : ToDto(match, user.Id);
    }

    public async Task<PvpMatchDto> GetAsync(User user, Guid id, CancellationToken ct)
    {
        var match = await ParticipantMatchAsync(user, id, ct);
        return ToDto(match, user.Id);
    }

    public async Task<PvpMatchDto> MoveAsync(User user, Guid id, string move, CancellationToken ct)
    {
        var cleanMove = move.Trim().ToLowerInvariant();
        if (!Moves.Contains(cleanMove)) throw new InvalidOperationException("Неизвестный приём.");
        var match = await ParticipantMatchAsync(user, id, ct);
        if (match.Status != "active") throw new InvalidOperationException("Бой ещё не начался или уже завершён.");

        var isHost = match.HostUserId == user.Id;
        if (isHost)
        {
            if (match.HostMove is not null) return ToDto(match, user.Id);
            match.HostMove = cleanMove;
        }
        else
        {
            if (match.GuestMove is not null) return ToDto(match, user.Id);
            match.GuestMove = cleanMove;
        }

        if (match.HostMove is not null && match.GuestMove is not null)
            ResolveRound(match);
        match.UpdatedAt = DateTimeOffset.UtcNow;
        match.Version++;
        await db.SaveChangesAsync(ct);
        return ToDto(match, user.Id);
    }

    public async Task CancelAsync(User user, Guid id, CancellationToken ct)
    {
        var match = await ParticipantMatchAsync(user, id, ct);
        if (match.HostUserId != user.Id || match.Status != "waiting")
            throw new InvalidOperationException("Закрыть можно только свою комнату до начала боя.");
        match.Status = "cancelled";
        match.UpdatedAt = DateTimeOffset.UtcNow;
        match.Version++;
        await db.SaveChangesAsync(ct);
    }

    private void ResolveRound(PvpMatch match)
    {
        match.LastHostMove = match.HostMove;
        match.LastGuestMove = match.GuestMove;
        match.LastRoundWinnerId = null;
        if (match.HostMove != match.GuestMove)
        {
            var hostWins = Beats(match.HostMove!, match.GuestMove!);
            match.LastRoundWinnerId = hostWins ? match.HostUserId : match.GuestUserId;
            if (hostWins) match.HostScore++;
            else match.GuestScore++;
        }
        match.HostMove = null;
        match.GuestMove = null;
        match.Round++;

        if (match.HostScore < 2 && match.GuestScore < 2) return;
        match.Status = "completed";
        match.WinnerUserId = match.HostScore > match.GuestScore ? match.HostUserId : match.GuestUserId;
        var winner = match.WinnerUserId == match.HostUserId ? match.HostUser : match.GuestUser!;
        winner.PvpWins++;
    }

    private static bool Beats(string first, string second) =>
        (first, second) is ("attack", "skill") or ("skill", "guard") or ("guard", "attack");

    private async Task<PvpMatch> ParticipantMatchAsync(User user, Guid id, CancellationToken ct) =>
        await Query().SingleOrDefaultAsync(
            item => item.Id == id && (item.HostUserId == user.Id || item.GuestUserId == user.Id), ct)
        ?? throw new InvalidOperationException("Поединок не найден.");

    private IQueryable<PvpMatch> Query() => db.PvpMatches
        .Include(item => item.HostUser)
        .Include(item => item.GuestUser)
        .Include(item => item.WinnerUser);

    private async Task EnsureOwnedAsync(int userId, string characterId, CancellationToken ct)
    {
        var owned = await db.UserEntities.AnyAsync(
            item => item.UserId == userId && item.Entity.Slug == characterId, ct);
        if (!owned) throw new InvalidOperationException("Выбранного хранителя нет в коллекции.");
    }

    private async Task EnsureIdentityAsync(User user, CancellationToken ct)
    {
        if (user.PublicCode is null)
        {
            user.PublicCode = await NewCodeAsync(ct);
            user.DisplayName ??= $"Игрок {user.PublicCode}";
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task<string> NewCodeAsync(CancellationToken ct)
    {
        string code;
        do
        {
            code = new string(Enumerable.Range(0, 6)
                .Select(_ => CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)]).ToArray());
        } while (await db.Users.AnyAsync(item => item.PublicCode == code, ct)
                 || await db.PvpMatches.AnyAsync(item => item.InviteCode == code, ct));
        return code;
    }

    private static string DisplayName(User user) => user.DisplayName ?? $"Игрок {user.PublicCode}";

    private static PvpMatchDto ToDto(PvpMatch match, int userId)
    {
        var isHost = match.HostUserId == userId;
        var opponent = isHost ? match.GuestUser : match.HostUser;
        PvpRoundDto? lastRound = null;
        if (match.LastHostMove is not null && match.LastGuestMove is not null)
        {
            var yourMove = isHost ? match.LastHostMove : match.LastGuestMove;
            var opponentMove = isHost ? match.LastGuestMove : match.LastHostMove;
            var outcome = match.LastRoundWinnerId is null
                ? "draw"
                : match.LastRoundWinnerId == userId ? "won" : "lost";
            lastRound = new PvpRoundDto(yourMove, opponentMove, outcome);
        }
        return new PvpMatchDto(
            match.Id,
            match.InviteCode,
            match.Status,
            match.Round,
            isHost ? match.HostScore : match.GuestScore,
            isHost ? match.GuestScore : match.HostScore,
            isHost ? match.HostCharacterId : match.GuestCharacterId!,
            isHost ? match.GuestCharacterId : match.HostCharacterId,
            opponent is null ? null : DisplayName(opponent),
            isHost ? match.HostMove is not null : match.GuestMove is not null,
            lastRound,
            match.Status == "completed" ? match.WinnerUserId == userId : null);
    }
}
