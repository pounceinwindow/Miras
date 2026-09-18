namespace Miras.Api.Dtos;

public record LocationDto(
    int Id,
    string Name,
    double Latitude,
    double Longitude,
    int EntityId,
    string EntityName,
    string Status
);
