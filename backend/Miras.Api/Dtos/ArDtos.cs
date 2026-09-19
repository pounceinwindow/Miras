using System.Text.Json.Serialization;

namespace Miras.Api.Dtos;

public record ArBundleRequest(
    [property: JsonPropertyName("latitude")] double? Latitude,
    [property: JsonPropertyName("longitude")] double? Longitude
);

public record ArTargetManifestItem(
    [property: JsonPropertyName("targetIndex")] int TargetIndex,
    [property: JsonPropertyName("locationId")] string LocationId,
    [property: JsonPropertyName("entityId")] string EntityId
);

public record ArBundleManifest(
    [property: JsonPropertyName("targets")] List<ArTargetManifestItem> Targets
);

public record ArErrorResponse(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("message"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Message = null
);
