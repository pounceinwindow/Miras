namespace Miras.Api.Models;

public class Location
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string NfcToken { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public Entity Entity { get; set; } = null!;
    public ICollection<Encounter> Encounters { get; set; } = [];
}
