namespace Miras.Api.Models;

public class Entity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;

    public int BaseHp { get; set; }
    public int BaseAttack { get; set; }
    public int BaseDefense { get; set; }

    public string AbilityName { get; set; } = string.Empty;
    public string AbilityDescription { get; set; } = string.Empty;
    public int AbilityPower { get; set; }

    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<Location> Locations { get; set; } = [];
}
