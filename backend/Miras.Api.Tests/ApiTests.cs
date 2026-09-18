using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Miras.Api;
namespace Miras.Api.Tests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    public ApiFactory()
    {
        connection.Open();
    }
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureServices(services => { services.RemoveAll<DbContextOptions<GameDb>>(); services.AddDbContext<GameDb>(options => options.UseSqlite(connection)); });
    }
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
            connection.Dispose();
    }
}
public class ApiTests
{
    [Fact]
    public async Task AuthIsolationAndPersistence()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/game", new
        {
            type = "sync"
        })).StatusCode);
        var guest = await (await client.PostAsync("/api/auth/guest", null)).Content.ReadFromJsonAsync<Guest>();
        client.DefaultRequestHeaders.Authorization = new("Bearer", guest!.Token);
        var capture = await client.PostAsJsonAsync("/api/game", new
        {
            type = "capture",
            characterId = "shurale",
            answers = new[] { 0, 1, 2 }
        });
        capture.EnsureSuccessStatusCode();
        var state = await (await client.PostAsJsonAsync("/api/game", new
        {
            type = "sync"
        })).Content.ReadFromJsonAsync<GameResult>();
        Assert.Single(state!.Progress.Collection);
        Assert.Equal(0, state.Progress.Balance);
        using var other = factory.CreateClient();
        var second = await (await other.PostAsync("/api/auth/guest", null)).Content.ReadFromJsonAsync<Guest>();
        other.DefaultRequestHeaders.Authorization = new("Bearer", second!.Token);
        var isolated = await (await other.PostAsJsonAsync("/api/game", new
        {
            type = "sync"
        })).Content.ReadFromJsonAsync<GameResult>();
        Assert.Empty(isolated!.Progress.Collection);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/game", new
        {
            type = "upgrade",
            characterId = "shurale",
            balance = 99999
        })).StatusCode);
    }
    [Fact]
    public async Task ConcurrencyTokenRejectsStaleWalletUpdate()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<GameDb>().UseSqlite(connection).Options;
        await using var first = new GameDb(options);
        await first.Database.EnsureCreatedAsync();
        var id = Guid.NewGuid();
        first.Players.Add(new()
        {
            Id = id
        });
        await first.SaveChangesAsync();
        await using var second = new GameDb(options);
        var stale = await second.Players.SingleAsync();
        var fresh = await first.Players.SingleAsync();
        fresh.Version++;
        fresh.ProgressJson = "{\"balance\":25}";
        await first.SaveChangesAsync();
        stale.Version++;
        stale.ProgressJson = "{\"balance\":50}";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
    }
    private record Guest(string Token, Guid PlayerId);
}
