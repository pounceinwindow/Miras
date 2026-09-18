namespace Miras.Api.Models;

public enum EncounterStatus
{
    Started,
    ReadyForBattle,
    Failed,
    Completed
}

public class Encounter
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EntityId { get; set; }
    public int LocationId { get; set; }

    public EncounterStatus Status { get; set; } = EncounterStatus.Started;

    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? RetryAt { get; set; }

    public User User { get; set; } = null!;
    public Entity Entity { get; set; } = null!;
    public Location Location { get; set; } = null!;
}
