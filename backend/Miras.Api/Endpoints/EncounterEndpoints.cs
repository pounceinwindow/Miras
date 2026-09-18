using Miras.Api.Dtos;
using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class EncounterEndpoints
{
    public static void MapEncounterEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/encounters").WithTags("Encounters");

        group.MapPost("/start", async (StartEncounterRequest request, EncounterService encounterService, CancellationToken ct) =>
        {
            try
            {
                var encounter = await encounterService.StartEncounterAsync(request, ct);
                return Results.Ok(encounter);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("StartEncounter")
        .WithSummary("Начать encounter по NFC-метке");

        group.MapGet("/{encounterId:int}/questions", async (int encounterId, QuizService quizService, CancellationToken ct) =>
        {
            try
            {
                var questions = await quizService.GetQuestionsAsync(encounterId, ct);
                return Results.Ok(questions);
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        })
        .WithName("GetQuestions")
        .WithSummary("Получить вопросы для encounter (без правильных ответов)");

        group.MapPost("/{encounterId:int}/submit", async (int encounterId, SubmitQuizRequest request, QuizService quizService, CancellationToken ct) =>
        {
            try
            {
                var result = await quizService.SubmitAnswersAsync(encounterId, request, ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("SubmitQuiz")
        .WithSummary("Отправить ответы на квиз");
    }
}
