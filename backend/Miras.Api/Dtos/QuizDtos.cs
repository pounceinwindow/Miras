namespace Miras.Api.Dtos;

public record QuestionDto(
    int Id,
    int EntityId,
    string Text,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD
);

public record AnswerDto(int QuestionId, string Answer);

public record SubmitQuizRequest(List<AnswerDto> Answers);

public record QuizResultDto(
    bool Success,
    string Status,
    string Message,
    DateTimeOffset? RetryAt,
    UserCollectionItemDto? ObtainedEntity
);
