namespace Miras.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int ChakChak { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? GameTokenHash { get; set; }

    public ICollection<UserEntity> UserEntities { get; set; } = [];
    public ICollection<Encounter> Encounters { get; set; } = [];
    public ICollection<Battle> Battles { get; set; } = [];
    public ICollection<PveBattle> PveBattles { get; set; } = [];
}
