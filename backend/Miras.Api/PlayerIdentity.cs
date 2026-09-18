using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
namespace Miras.Api;

public sealed class PlayerIdentity(IConfiguration config, IHostEnvironment environment, IHttpClientFactory clients)
{
    public bool UsesSupabase => !string.IsNullOrWhiteSpace(config["Supabase:Url"]);
    public bool AllowsGuest => environment.IsDevelopment() && !UsesSupabase;
    public static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    public async Task<Guid?> Resolve(HttpContext context, GameDb db, CancellationToken cancellationToken)
    {
        var header = context.Request.Headers.Authorization.ToString();
        if (!AuthenticationHeaderValue.TryParse(header, out var parsed) || !parsed.Scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(parsed.Parameter))
            return null;
        var token = parsed.Parameter;
        if (token.Length > 8192)
            return null;
        if (UsesSupabase)
        {
            // Validate with Auth rather than trusting unverified JWT claims. Works with both legacy and asymmetric keys.
            using var request = new HttpRequestMessage(HttpMethod.Get, config["Supabase:Url"]!.TrimEnd('/') + "/auth/v1/user");
            request.Headers.Authorization = new("Bearer", token);
            request.Headers.Add("apikey", config["Supabase:AnonKey"]);
            using var response = await clients.CreateClient("auth").SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return null;
            using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            return json.RootElement.TryGetProperty("id", out var id) && Guid.TryParse(id.GetString(), out var guid) ? guid : null;
        }
        if (!AllowsGuest)
            return null;
        var hash = Hash(token);
        var player = await db.Players.AsNoTracking().SingleOrDefaultAsync(p => p.TokenHash == hash, cancellationToken);
        return player?.GuestExpiresAt > DateTimeOffset.UtcNow ? player.Id : null;
    }
}
