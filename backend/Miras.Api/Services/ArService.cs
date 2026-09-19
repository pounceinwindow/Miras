using System.Data;
using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;

namespace Miras.Api.Services;

public record ArBundleResult(byte[] MindBytes, ArBundleManifest Manifest);

public interface IArService
{
    Task<ArBundleResult?> GetNearbyBundleAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
}

public class ArService : IArService
{
    private readonly AppDbContext _db;
    private readonly IMindStorage _mindStorage;
    private const double SearchRadiusMeters = 500.0;
    private const int MaxTargets = 10;

    public ArService(AppDbContext db, IMindStorage mindStorage)
    {
        _db = db;
        _mindStorage = mindStorage;
    }

    private record NearbyPointRow(int Id, int EntityId, string? MindFilePath);

    public async Task<ArBundleResult?> GetNearbyBundleAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        List<NearbyPointRow> nearbyPoints;

        // Check if database provider is relational (PostgreSQL)
        if (_db.Database.IsRelational())
        {
            var conn = _db.Database.GetDbConnection();
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync(cancellationToken);
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
SELECT id, entity_id, mind_file_path
FROM locations
WHERE is_active = TRUE
  AND ST_DWithin(
    position,
    ST_SetSRID(ST_MakePoint(@longitude, @latitude), 4326)::geography,
    500
  )
ORDER BY ST_Distance(
  position,
  ST_SetSRID(ST_MakePoint(@longitude, @latitude), 4326)::geography
)
LIMIT 10;";

            var pLon = cmd.CreateParameter();
            pLon.ParameterName = "@longitude";
            pLon.Value = longitude;
            cmd.Parameters.Add(pLon);

            var pLat = cmd.CreateParameter();
            pLat.ParameterName = "@latitude";
            pLat.Value = latitude;
            cmd.Parameters.Add(pLat);

            nearbyPoints = new List<NearbyPointRow>();
            using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                int id = reader.GetInt32(0);
                int entityId = reader.GetInt32(1);
                string? mindFilePath = reader.IsDBNull(2) ? null : reader.GetString(2);
                nearbyPoints.Add(new NearbyPointRow(id, entityId, mindFilePath));
            }
        }
        else
        {
            // Fallback for InMemory test provider
            var allActive = await _db.Locations
                .Where(l => l.IsActive)
                .ToListAsync(cancellationToken);

            nearbyPoints = allActive
                .Select(l => new
                {
                    Location = l,
                    Distance = CalculateHaversineDistanceMeters(latitude, longitude, l.Latitude, l.Longitude)
                })
                .Where(x => x.Distance <= SearchRadiusMeters)
                .OrderBy(x => x.Distance)
                .Take(MaxTargets)
                .Select(x => new NearbyPointRow(x.Location.Id, x.Location.EntityId, x.Location.MindFilePath))
                .ToList();
        }

        if (nearbyPoints.Count == 0)
        {
            return null;
        }

        var filesToMerge = new List<MindFileInput>();
        foreach (var point in nearbyPoints)
        {
            var mindBytes = await _mindStorage.GetMindFileAsync(
                point.MindFilePath ?? $"mind/location_{point.Id}.mind",
                point.EntityId.ToString(),
                cancellationToken
            );

            if (mindBytes != null && mindBytes.Length > 0)
            {
                filesToMerge.Add(new MindFileInput(
                    point.Id.ToString(),
                    point.EntityId.ToString(),
                    mindBytes
                ));
            }
        }

        if (filesToMerge.Count == 0)
        {
            return null;
        }

        var merged = MindMerger.MergeMindFiles(filesToMerge);
        return new ArBundleResult(merged.MergedMindBytes, merged.Manifest);
    }

    private static double CalculateHaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadiusMeters = 6371000.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLon = (lon2 - lon1) * Math.PI / 180.0;

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusMeters * c;
    }
}
