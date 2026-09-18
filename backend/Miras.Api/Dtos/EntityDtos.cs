namespace Miras.Api.Dtos;

public record EntityListDto(
    int Id,
    string Name,
    string Slug,
    string Category,
    string Description,
    int BaseHp,
    int BaseAttack,
    int BaseDefense
);

public record EntityDetailsDto(
    int Id,
    string Name,
    string Slug,
    string Category,
    string Description,
    string Story,
    int BaseHp,
    int BaseAttack,
    int BaseDefense,
    string AbilityName,
    string AbilityDescription,
    int AbilityPower
);
