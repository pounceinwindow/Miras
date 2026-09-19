namespace Miras.Api.Models;

public class PveBattle
{
    public Guid Id { get; set; }
    public int UserId { get; set; }
    public int? EncounterId { get; set; }
    public string StateJson { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool RewardApplied { get; set; }
    public uint Version { get; set; }

    public User User { get; set; } = null!;
    public Encounter? Encounter { get; set; }
}
