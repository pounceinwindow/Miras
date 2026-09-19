using Microsoft.EntityFrameworkCore;
using Miras.Api.Dtos;
using Miras.Api.Models;
using Miras.Api.Services;

namespace Miras.Api.Tests;

public class EncounterAndQuizTests
{
    [Fact]
    public async Task StartEncounter_CreatesEncounterSuccessfully()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new EncounterService(db);

        var encounter = await service.StartEncounterAsync(new StartEncounterRequest(1, "ABC123"), default);

        Assert.NotNull(encounter);
        Assert.Equal("Казанский Кремль", encounter.EntityName);
        Assert.Equal("Started", encounter.Status);
    }

    [Fact]
    public async Task StartEncounter_ThrowsIfAlreadyCaptured()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new EncounterService(db);

        db.UserEntities.Add(new UserEntity { UserId = 1, EntityId = 4 });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.StartEncounterAsync(new StartEncounterRequest(1, "ABC123"), default));
    }

    [Fact]
    public async Task StartEncounter_ThrowsIfCooldownActive()
    {
        using var db = TestDbHelper.CreateContext();
        var service = new EncounterService(db);

        db.Encounters.Add(new Encounter
        {
            UserId = 1,
            EntityId = 4,
            LocationId = 4,
            Status = EncounterStatus.Failed,
            RetryAt = DateTimeOffset.UtcNow.AddHours(12)
        });
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.StartEncounterAsync(new StartEncounterRequest(1, "ABC123"), default));

        Assert.Contains("Повторная попытка будет доступна", ex.Message);
    }

    [Fact]
    public async Task Quiz_CorrectAnswers_OpensBattleWithoutCapturing()
    {
        using var db = TestDbHelper.CreateContext();
        var encounterService = new EncounterService(db);
        var quizService = new QuizService(db);

        var encounter = await encounterService.StartEncounterAsync(new StartEncounterRequest(1, "ABC123"), default);
        var questions = await quizService.GetQuestionsAsync(encounter.EncounterId, default);

        Assert.Equal(3, questions.Count);

        // Kremlin questions are 10, 11, 12 with answers B, C, B
        var answers = new List<AnswerDto>
        {
            new(10, "B"),
            new(11, "C"),
            new(12, "B")
        };

        var result = await quizService.SubmitAnswersAsync(encounter.EncounterId, new SubmitQuizRequest(answers), default);

        Assert.True(result.Success);
        Assert.Equal("ReadyForBattle", result.Status);
        Assert.Null(result.ObtainedEntity);

        // Verify in DB
        var owned = await db.UserEntities.AnyAsync(ue => ue.UserId == 1 && ue.EntityId == 4);
        Assert.False(owned);
    }

    [Fact]
    public async Task Quiz_WrongAnswers_SetsFailedAndCooldown()
    {
        using var db = TestDbHelper.CreateContext();
        var encounterService = new EncounterService(db);
        var quizService = new QuizService(db);

        var encounter = await encounterService.StartEncounterAsync(new StartEncounterRequest(1, "ABC123"), default);

        var wrongAnswers = new List<AnswerDto>
        {
            new(10, "A"),
            new(11, "A"),
            new(12, "A")
        };

        var result = await quizService.SubmitAnswersAsync(encounter.EncounterId, new SubmitQuizRequest(wrongAnswers), default);

        Assert.False(result.Success);
        Assert.Equal("Failed", result.Status);
        Assert.NotNull(result.RetryAt);
        Assert.True(result.RetryAt > DateTimeOffset.UtcNow.AddHours(23));

        // Verify no character was added
        var owned = await db.UserEntities.AnyAsync(ue => ue.UserId == 1 && ue.EntityId == 4);
        Assert.False(owned);
    }
}
