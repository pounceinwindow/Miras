namespace Miras.Api.Models;

public class Question
{
    public int Id { get; set; }
    public int EntityId { get; set; }
    public string Text { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;

    public string CorrectOption { get; set; } = string.Empty;

    public Entity Entity { get; set; } = null!;
}
