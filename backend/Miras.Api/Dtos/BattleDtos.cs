namespace Miras.Api.Dtos;

public record StartBattleRequest(int UserId, int EntityId);

public record FighterDto(
    string Name,
    int Hp,
    int MaxHp,
    int Attack,
    int Defense,
    int Level,
    string? AbilityName
);

public record BattleStateDto(
    int BattleId,
    FighterDto Player,
    FighterDto Enemy,
    string Status
);

public record TurnResultDto(
    int PlayerDamageDealt,
    int EnemyDamageDealt,
    int PlayerHp,
    int EnemyHp,
    bool BattleFinished,
    string? Result,
    int? RewardChakChak,
    string Message
);
