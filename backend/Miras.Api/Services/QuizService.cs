using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;

namespace Miras.Api.Services;

public class QuizService(AppDbContext db)
{
    public async Task<List<QuestionDto>> GetQuestionsAsync(int encounterId, CancellationToken ct)
    {
        var encounter = await db.Encounters.FindAsync([encounterId], ct)
            ?? throw new InvalidOperationException("Encounter не найден.");

        var questions = await db.Questions
            .Where(q => q.EntityId == encounter.EntityId)
            .Select(q => new QuestionDto(
                q.Id,
                q.EntityId,
                q.Text,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD
            ))
            .ToListAsync(ct);

        return questions;
    }

    public async Task<QuizResultDto> SubmitAnswersAsync(int encounterId, SubmitQuizRequest request, CancellationToken ct)
    {
        var encounter = await db.Encounters
            .Include(e => e.Entity)
            .FirstOrDefaultAsync(e => e.Id == encounterId, ct)
            ?? throw new InvalidOperationException("Encounter не найден.");

        if (encounter.Status != EncounterStatus.Started)
            throw new InvalidOperationException("Этот encounter уже завершён.");

        var questions = await db.Questions
            .Where(q => q.EntityId == encounter.EntityId)
            .ToListAsync(ct);

        if (request.Answers.Count != questions.Count ||
            request.Answers.Select(a => a.QuestionId).Distinct().Count() != questions.Count ||
            request.Answers.Any(a => questions.All(q => q.Id != a.QuestionId)))
            throw new InvalidOperationException($"Нужно ответить на все {questions.Count} вопроса.");

        var allCorrect = request.Answers.All(a =>
        {
            var question = questions.FirstOrDefault(q => q.Id == a.QuestionId);
            return question != null && string.Equals(question.CorrectOption, a.Answer, StringComparison.OrdinalIgnoreCase);
        });

        if (allCorrect)
        {
            encounter.Status = EncounterStatus.ReadyForBattle;
            await db.SaveChangesAsync(ct);
            return new QuizResultDto(true, "ReadyForBattle", "Ответы верны. Победи хранителя, чтобы добавить его в коллекцию!", null, null);
        }
        else
        {
            encounter.Status = EncounterStatus.Failed;
            encounter.RetryAt = DateTimeOffset.UtcNow.AddHours(24);
            await db.SaveChangesAsync(ct);

            return new QuizResultDto(false, "Failed", "Неверные ответы. Попробуй через 24 часа.", encounter.RetryAt, null);
        }
    }
}
