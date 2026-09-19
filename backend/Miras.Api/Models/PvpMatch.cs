namespace Miras.Api.Models;

public class PvpMatch
{
    public Guid Id { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public int HostUserId { get; set; }
    public int? GuestUserId { get; set; }
    public string HostCharacterId { get; set; } = string.Empty;
    public string? GuestCharacterId { get; set; }
    public int Round { get; set; } = 1;
    public int HostScore { get; set; }
    public int GuestScore { get; set; }
    public string? HostMove { get; set; }
    public string? GuestMove { get; set; }
    public string? LastHostMove { get; set; }
    public string? LastGuestMove { get; set; }
    public int? LastRoundWinnerId { get; set; }
    public int? WinnerUserId { get; set; }
    public string Status { get; set; } = "waiting";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public uint Version { get; set; }

    public User HostUser { get; set; } = null!;
    public User? GuestUser { get; set; }
    public User? WinnerUser { get; set; }
}
