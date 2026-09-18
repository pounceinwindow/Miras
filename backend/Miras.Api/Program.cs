using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Miras.Api;
var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("Game");
if (!builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(builder.Configuration["Supabase:Url"])) throw new InvalidOperationException("Configure Supabase Auth before production startup.");
if (!string.IsNullOrWhiteSpace(builder.Configuration["Supabase:Url"]) && string.IsNullOrWhiteSpace(builder.Configuration["Supabase:AnonKey"])) throw new InvalidOperationException("Supabase:AnonKey is required.");
if (!builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(connection)) throw new InvalidOperationException("ConnectionStrings:Game is required in production.");
builder.Services.AddDbContext<GameDb>(options => { if (string.IsNullOrWhiteSpace(connection)) options.UseSqlite("Data Source=miras.db"); else options.UseNpgsql(connection); });
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<GameEngine>();
builder.Services.AddScoped<PlayerIdentity>();
builder.Services.AddHttpClient("auth", client => client.Timeout = TimeSpan.FromSeconds(10));
var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173", "http://127.0.0.1:5173"];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new() { PermitLimit = 120, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.OnRejected = async (ctx, ct) => { await ctx.HttpContext.Response.WriteAsJsonAsync(new { error = "Слишком много запросов. Подожди минуту." }, ct); };
});
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16 * 1024);
var app = builder.Build();
app.UseCors();
app.UseRateLimiter();
app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (GameException e) { context.Response.StatusCode = 400; await context.Response.WriteAsJsonAsync(new { error = e.Message }); }
    catch (DbUpdateConcurrencyException) { context.Response.StatusCode = 409; await context.Response.WriteAsJsonAsync(new { error = "Прогресс изменился в другой вкладке. Обнови страницу." }); }
    catch (HttpRequestException) { context.Response.StatusCode = 503; await context.Response.WriteAsJsonAsync(new { error = "Сервис входа временно недоступен." }); }
});
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "miras-api" }));
app.MapPost("/api/auth/guest", async (GameDb db, PlayerIdentity identity, CancellationToken ct) =>
{
    if (!identity.AllowsGuest)
        return Results.NotFound();
    var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    var player = new Player { Id = Guid.NewGuid(), TokenHash = PlayerIdentity.Hash(token), GuestExpiresAt = DateTimeOffset.UtcNow.AddDays(30), ProgressJson = JsonSerializer.Serialize(new Progress(), Rules.Json) };
    db.Players.Add(player);
    await db.SaveChangesAsync(ct);
    return Results.Ok(new
    {
        token,
        playerId = player.Id
    });
});
app.MapPost("/api/game", async (GameCommand command, HttpContext context, GameDb db, PlayerIdentity identity, GameEngine engine, CancellationToken ct) =>
{
    var userId = await identity.Resolve(context, db, ct);
    if (userId is null)
        return Results.Json(new
        {
            error = "Нужно войти в игру. Гостевая сессия могла истечь."
        }, statusCode: 401);
    var player = await db.Players.SingleOrDefaultAsync(p => p.Id == userId, ct);
    if (player is null)
    {
        player = new()
        {
            Id = userId.Value
        };
        db.Players.Add(player);
    }
    var progress = JsonSerializer.Deserialize<Progress>(player.ProgressJson, Rules.Json) ?? new();
    var result = engine.Execute(progress, command);
    player.ProgressJson = JsonSerializer.Serialize(progress, Rules.Json);
    player.Version++;
    try
    {
        await db.SaveChangesAsync(ct);
    }
    catch (DbUpdateException) when (db.Entry(player).State == EntityState.Added) { return Results.Json(new { error = "Профиль создаётся в другой вкладке. Обнови страницу." }, statusCode: 409); }
    return Results.Ok(result);
});
// Prototype schema bootstrap. Production uses the reviewed SQL script before startup.
if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<GameDb>().Database.EnsureCreatedAsync();
}
app.Run();
public partial class Program;
