using Miras.Api.Pve;

namespace Miras.Api.Dtos;

public sealed record OwnedCharacterDto(string Id, int Level, DateTimeOffset CapturedAt);
public sealed record GameModesDto(bool Pve, bool Encounters, bool Pvp);
public sealed record GameProgressDto(
    List<OwnedCharacterDto> Collection,
    Dictionary<string, DateTimeOffset> Cooldowns,
    int Wins,
    object? Battle,
    PveState? Pve,
    long PveUpdatedAt,
    List<string> Challenges,
    GameModesDto Modes);
public sealed record GameResultDto(GameProgressDto Progress, string? Outcome = null);
