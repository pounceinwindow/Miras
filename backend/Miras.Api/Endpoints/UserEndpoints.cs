using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;
using Miras.Api.Services;

namespace Miras.Api.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users");

        group.MapPost("/", async (CreateUserRequest request, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return Results.BadRequest(new { error = "Username обязателен." });

            var exists = await db.Users.AnyAsync(u => u.Username == request.Username, ct);
            if (exists)
                return Results.Conflict(new { error = "Пользователь с таким именем уже существует." });

            var user = new User
            {
                Username = request.Username.Trim(),
                ChakChak = 100,
                CreatedAt = DateTimeOffset.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/users/{user.Id}", new UserDto(user.Id, user.Username, user.CreatedAt));
        })
        .WithName("CreateUser")
        .WithSummary("Создать нового пользователя");

        group.MapGet("/{userId:int}", async (int userId, AppDbContext db, CancellationToken ct) =>
        {
            var user = await db.Users
                .Where(u => u.Id == userId)
                .Select(u => new UserDto(u.Id, u.Username, u.CreatedAt))
                .FirstOrDefaultAsync(ct);
            return user is null ? Results.NotFound(new { error = "Пользователь не найден." }) : Results.Ok(user);
        })
        .WithName("GetUser")
        .WithSummary("Получить профиль пользователя");

        group.MapGet("/{userId:int}/collection", async (int userId, CollectionService collectionService, CancellationToken ct) =>
        {
            var collection = await collectionService.GetCollectionAsync(userId, ct);
            return Results.Ok(collection);
        })
        .WithName("GetUserCollection")
        .WithSummary("Получить коллекцию персонажей пользователя");
    }
}
