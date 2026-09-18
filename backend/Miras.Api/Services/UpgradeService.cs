using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;

namespace Miras.Api.Services;

public class UpgradeService(AppDbContext db)
{
    public const int MaxLevel = 10;

    public static int GetUpgradeCost(int currentLevel) => 20 * (1 << (currentLevel - 1));

    public async Task<UpgradeResponseDto> UpgradeAsync(int userEntityId, CancellationToken ct)
    {
        var userEntity = await db.UserEntities
            .Include(ue => ue.Entity)
            .Include(ue => ue.User)
            .FirstOrDefaultAsync(ue => ue.Id == userEntityId, ct)
            ?? throw new InvalidOperationException("Персонаж не найден в коллекции.");

        if (userEntity.Level >= MaxLevel)
            throw new InvalidOperationException("Достигнут максимальный уровень.");

        var cost = GetUpgradeCost(userEntity.Level);

        if (userEntity.User.ChakChak < cost)
            throw new InvalidOperationException($"Недостаточно чак-чака. Нужно {cost}, у тебя {userEntity.User.ChakChak}.");

        userEntity.User.ChakChak -= cost;
        userEntity.Level++;

        await db.SaveChangesAsync(ct);

        var entity = userEntity.Entity;
        var level = userEntity.Level;

        return new UpgradeResponseDto(
            userEntity.Id,
            level,
            cost,
            userEntity.User.ChakChak,
            new StatsDto(
                entity.BaseHp + (level - 1) * 15,
                entity.BaseAttack + (level - 1) * 4,
                entity.BaseDefense + (level - 1) * 3
            )
        );
    }
}
