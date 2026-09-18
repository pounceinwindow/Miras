using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;

namespace Miras.Api.Services;

public class CollectionService(AppDbContext db)
{
    public async Task<List<UserCollectionItemDto>> GetCollectionAsync(int userId, CancellationToken ct)
    {
        return await db.UserEntities
            .Where(ue => ue.UserId == userId)
            .Include(ue => ue.Entity)
            .Select(ue => new UserCollectionItemDto(
                ue.Id,
                ue.EntityId,
                ue.Entity.Name,
                ue.Entity.Slug,
                ue.Entity.Category,
                ue.Level,
                ue.Xp,
                ue.ObtainedAt,
                ue.Entity.BaseHp + (ue.Level - 1) * 15,
                ue.Entity.BaseAttack + (ue.Level - 1) * 4,
                ue.Entity.BaseDefense + (ue.Level - 1) * 3,
                ue.Entity.AbilityName
            ))
            .ToListAsync(ct);
    }
}
