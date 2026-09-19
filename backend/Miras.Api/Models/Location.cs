using NetTopologySuite.Geometries;

namespace Miras.Api.Models;

public class Location
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string NfcToken { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public Point Position { get; set; } = null!;
    public string? MindFilePath { get; set; }
    public string? MindFileHash { get; set; }
    public bool IsActive { get; set; } = true;

    public Entity Entity { get; set; } = null!;
    public ICollection<Encounter> Encounters { get; set; } = [];
}
