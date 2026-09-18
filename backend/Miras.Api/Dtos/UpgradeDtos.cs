namespace Miras.Api.Dtos;

public record UpgradeResponseDto(
    int UserEntityId,
    int NewLevel,
    int ChakChakSpent,
    int RemainingChakChak,
    StatsDto UpdatedStats
);

public record StatsDto(int Hp, int Attack, int Defense);
