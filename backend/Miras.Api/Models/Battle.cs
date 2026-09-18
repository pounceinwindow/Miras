namespace Miras.Api.Models;

public class Battle
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PlayerEntityId { get; set; }
    public int EnemyEntityId { get; set; }

    public string Result { get; set; } = "Ongoing";
    public int Reward { get; set; }

    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }

    // Live battle state
    public int PlayerCurrentHp { get; set; }
    public int EnemyCurrentHp { get; set; }
    public int PlayerMaxHp { get; set; }
    public int EnemyMaxHp { get; set; }
    public int PlayerAttack { get; set; }
    public int PlayerDefense { get; set; }
    public int EnemyAttack { get; set; }
    public int EnemyDefense { get; set; }
    public int Turn { get; set; } = 1;
    public bool PlayerAbilityUsed { get; set; }

    public User User { get; set; } = null!;
    public UserEntity PlayerEntity { get; set; } = null!;
    public Entity EnemyEntity { get; set; } = null!;
}
