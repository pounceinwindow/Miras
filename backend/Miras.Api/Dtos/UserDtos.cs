namespace Miras.Api.Dtos;

public record UserDto(
    int Id,
    string Username,
    DateTimeOffset CreatedAt
);

public record CreateUserRequest(string Username);

public record UserCollectionItemDto(
    int UserEntityId,
    int EntityId,
    string Name,
    string Slug,
    string Category,
    int Level,
    int Xp,
    DateTimeOffset ObtainedAt,
    int Hp,
    int Attack,
    int Defense,
    string AbilityName
);
