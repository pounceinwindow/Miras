using Microsoft.EntityFrameworkCore;
namespace Miras.Api;
// One aggregate per player makes capture, wallet and rewards one atomic update.
// Version is an optimistic concurrency token: a stale request never overwrites progress.
public sealed class Player
{
    public Guid Id
    {
        get; set;
    }
    public string? TokenHash
    {
        get; set;
    }
    public DateTimeOffset? GuestExpiresAt
    {
        get; set;
    }
    public string ProgressJson { get; set; } = "{}";
    public long Version
    {
        get; set;
    }
}
public sealed class GameDb(DbContextOptions<GameDb> options) : DbContext(options)
{
    public DbSet<Player> Players => Set<Player>();
    protected override void OnModelCreating(ModelBuilder builder)
    {
        var player = builder.Entity<Player>();
        player.HasKey(x => x.Id);
        player.HasIndex(x => x.TokenHash).IsUnique();
        player.Property(x => x.TokenHash).HasMaxLength(64);
        player.Property(x => x.Version).IsConcurrencyToken();
    }
}
