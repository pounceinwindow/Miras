namespace Miras.Api.Dtos;

public sealed record PvpProfileDto(string Name, string Code, int Wins);
public sealed record UpdatePvpProfileRequest(string Name);
public sealed record CreatePvpMatchRequest(string CharacterId);
public sealed record JoinPvpMatchRequest(string Code, string CharacterId);
public sealed record PvpMoveRequest(string Move);
public sealed record PvpLeaderboardEntryDto(int Rank, string Name, int Wins);
public sealed record PvpRoundDto(string YourMove, string OpponentMove, string Outcome);
public sealed record PvpMatchDto(
    Guid Id,
    string Code,
    string Status,
    int Round,
    int YourScore,
    int OpponentScore,
    string YourCharacterId,
    string? OpponentCharacterId,
    string? OpponentName,
    bool HasSubmittedMove,
    PvpRoundDto? LastRound,
    bool? YouWon);
