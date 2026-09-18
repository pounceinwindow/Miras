namespace Miras.Api.Models;

public class UserEntity
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EntityId { get; set; }

    public int Level { get; set; } = 1;
    public int Xp { get; set; }

    public DateTimeOffset ObtainedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;
    public Entity Entity { get; set; } = null!;
}
