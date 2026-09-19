using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Endpoints;
using Miras.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Database ---
var connectionString = builder.Configuration.GetConnectionString("PostgreSql");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:PostgreSql is required. Check appsettings.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// --- Services ---
builder.Services.AddScoped<EncounterService>();
builder.Services.AddScoped<QuizService>();
builder.Services.AddScoped<CollectionService>();
builder.Services.AddScoped<GameService>();

// --- Swagger / OpenAPI ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Miras API", Version = "v1", Description = "Backend API для игры по мотивам татарских сказок и легенд" });
});

// --- CORS ---
var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:41739"];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// --- Middleware ---
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "Miras API v1"));
}

// --- Apply migrations & seed on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// --- Health check ---
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "miras-api" }))
    .WithTags("Health");

// --- Map all endpoints ---
app.MapEntityEndpoints();
app.MapUserEndpoints();
app.MapEncounterEndpoints();
app.MapGameEndpoints();

app.Run();

public partial class Program;
