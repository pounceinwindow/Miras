using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Miras.Api.Dtos;
using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class ArEndpoints
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static void MapArEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ar").WithTags("AR");

        group.MapPost("/bundle", async (ArBundleRequest request, IArService arService, CancellationToken ct) =>
        {
            // 1. Проверка корректности latitude/longitude
            if (!request.Latitude.HasValue || !request.Longitude.HasValue)
            {
                return Results.BadRequest(new ArErrorResponse(
                    "INVALID_COORDINATES",
                    "Latitude and Longitude are required."
                ));
            }

            double lat = request.Latitude.Value;
            double lon = request.Longitude.Value;

            if (double.IsNaN(lat) || double.IsInfinity(lat) || lat < -90.0 || lat > 90.0)
            {
                return Results.BadRequest(new ArErrorResponse(
                    "INVALID_COORDINATES",
                    "Latitude must be a valid number between -90.0 and 90.0."
                ));
            }

            if (double.IsNaN(lon) || double.IsInfinity(lon) || lon < -180.0 || lon > 180.0)
            {
                return Results.BadRequest(new ArErrorResponse(
                    "INVALID_COORDINATES",
                    "Longitude must be a valid number between -180.0 and 180.0."
                ));
            }

            // 2. Поиск точек в радиусе 500 м и сборка бандла
            var bundle = await arService.GetNearbyBundleAsync(lat, lon, ct);

            // Если в радиусе 500 м ничего нет: HTTP 404
            if (bundle == null || bundle.Manifest.Targets.Count == 0)
            {
                return Results.Json(
                    new ArErrorResponse("NO_AR_TARGETS_NEARBY"),
                    statusCode: StatusCodes.Status404NotFound
                );
            }

            // 3. Формирование multipart-ответа: mind + manifest
            var boundary = "----MirasBoundary" + Guid.NewGuid().ToString("N");
            var multipart = new MultipartFormDataContent(boundary);

            // Часть 1: mind — файл nearby.mind, application/octet-stream
            var mindContent = new ByteArrayContent(bundle.MindBytes);
            mindContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            multipart.Add(mindContent, "mind", "nearby.mind");

            // Часть 2: manifest — JSON, application/json
            var manifestJson = JsonSerializer.Serialize(bundle.Manifest, JsonOptions);
            var manifestContent = new StringContent(manifestJson, Encoding.UTF8, "application/json");
            multipart.Add(manifestContent, "manifest", "manifest.json");

            return new MultipartResult(multipart);
        })
        .WithName("GetArBundle")
        .Produces(StatusCodes.Status200OK, contentType: "multipart/form-data")
        .Produces<ArErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ArErrorResponse>(StatusCodes.Status404NotFound)
        .WithSummary("Получить бандл .mind и манифест ближайших точек интереса для MindAR (радиус 500 м)");
    }
}

public class MultipartResult : IResult
{
    private readonly MultipartFormDataContent _content;

    public MultipartResult(MultipartFormDataContent content)
    {
        _content = content;
    }

    public async Task ExecuteAsync(HttpContext httpContext)
    {
        httpContext.Response.ContentType = _content.Headers.ContentType!.ToString();
        httpContext.Response.StatusCode = StatusCodes.Status200OK;
        await _content.CopyToAsync(httpContext.Response.Body);
    }
}
