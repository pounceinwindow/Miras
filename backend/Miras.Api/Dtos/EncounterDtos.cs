namespace Miras.Api.Dtos;

public record StartEncounterRequest(int UserId, string LocationToken);

public record EncounterDto(
    int EncounterId,
    int EntityId,
    string EntityName,
    string EntityStory,
    string LocationName,
    string Status,
    DateTimeOffset StartedAt,
    DateTimeOffset? RetryAt
);
