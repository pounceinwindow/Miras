using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Models;

namespace Miras.Api.Services;

public sealed class GameAuthService(
    AppDbContext db,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory)
{
    public async Task<User?> ResolveAsync(HttpRequest request, CancellationToken ct)
    {
        var header = request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
        var token = header[7..].Trim();
        if (string.IsNullOrWhiteSpace(token)) return null;

        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
        var guest = await db.Users.SingleOrDefaultAsync(item => item.GameTokenHash == hash, ct);
        if (guest is not null) return guest;

        var url = configuration["Supabase:Url"]?.TrimEnd('/');
        var key = configuration["Supabase:PublishableKey"];
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(key)) return null;

        using var authRequest = new HttpRequestMessage(HttpMethod.Get, $"{url}/auth/v1/user");
        authRequest.Headers.TryAddWithoutValidation("apikey", key);
        authRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var response = await httpClientFactory.CreateClient().SendAsync(authRequest, ct);
        if (!response.IsSuccessStatusCode) return null;
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        if (!json.RootElement.TryGetProperty("id", out var idElement)) return null;
        var supabaseId = idElement.GetString();
        if (string.IsNullOrWhiteSpace(supabaseId)) return null;

        var user = await db.Users.SingleOrDefaultAsync(item => item.SupabaseUserId == supabaseId, ct);
        if (user is not null) return user;

        user = new User
        {
            SupabaseUserId = supabaseId,
            Username = $"supabase-{supabaseId[..Math.Min(12, supabaseId.Length)]}",
            ChakChak = 0
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user;
    }
}
