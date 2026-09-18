using Microsoft.EntityFrameworkCore;
using Miras.Api.Data;
using Miras.Api.Dtos;
using Miras.Api.Models;

namespace Miras.Api.Services;

public class BattleService(AppDbContext db)
{
    public const int WinReward = 20;
    private const int MinDamage = 5;

    private static int CalcStat(int baseStat, int level, int perLevel) => baseStat + (level - 1) * perLevel;

    public async Task<BattleStateDto> StartBattleAsync(StartBattleRequest request, CancellationToken ct)
    {
        var userEntity = await db.UserEntities
            .Include(ue => ue.Entity)
            .Include(ue => ue.User)
            .FirstOrDefaultAsync(ue => ue.UserId == request.UserId && ue.EntityId == request.EntityId, ct)
            ?? throw new InvalidOperationException("Персонаж не найден в коллекции.");

        // Check no active battle
        var activeBattle = await db.Battles
            .AnyAsync(b => b.UserId == request.UserId && b.Result == "Ongoing", ct);
        if (activeBattle)
            throw new InvalidOperationException("Сначала заверши текущий бой.");

        // Pick a random enemy (different from player's entity)
        var allEntities = await db.Entities.ToListAsync(ct);
        var enemies = allEntities.Where(e => e.Id != request.EntityId).ToList();
        var enemy = enemies[Random.Shared.Next(enemies.Count)];
        var enemyLevel = Math.Max(1, userEntity.Level - 1 + Random.Shared.Next(3)); // level -1 to +1

        var playerHp = CalcStat(userEntity.Entity.BaseHp, userEntity.Level, 15);
        var playerAtk = CalcStat(userEntity.Entity.BaseAttack, userEntity.Level, 4);
        var playerDef = CalcStat(userEntity.Entity.BaseDefense, userEntity.Level, 3);
        var enemyHp = CalcStat(enemy.BaseHp, enemyLevel, 15);
        var enemyAtk = CalcStat(enemy.BaseAttack, enemyLevel, 4);
        var enemyDef = CalcStat(enemy.BaseDefense, enemyLevel, 3);

        var battle = new Battle
        {
            UserId = request.UserId,
            PlayerEntityId = userEntity.Id,
            EnemyEntityId = enemy.Id,
            Result = "Ongoing",
            StartedAt = DateTimeOffset.UtcNow,
            PlayerCurrentHp = playerHp,
            PlayerMaxHp = playerHp,
            PlayerAttack = playerAtk,
            PlayerDefense = playerDef,
            EnemyCurrentHp = enemyHp,
            EnemyMaxHp = enemyHp,
            EnemyAttack = enemyAtk,
            EnemyDefense = enemyDef,
            Turn = 1
        };

        db.Battles.Add(battle);
        await db.SaveChangesAsync(ct);

        return new BattleStateDto(
            battle.Id,
            new FighterDto(userEntity.Entity.Name, playerHp, playerHp, playerAtk, playerDef, userEntity.Level, userEntity.Entity.AbilityName),
            new FighterDto(enemy.Name, enemyHp, enemyHp, enemyAtk, enemyDef, enemyLevel, enemy.AbilityName),
            "Ongoing"
        );
    }

    public async Task<TurnResultDto> AttackAsync(int battleId, CancellationToken ct)
    {
        var battle = await GetActiveBattleAsync(battleId, ct);

        // Player attacks enemy
        var playerDmg = Math.Max(MinDamage, (int)(battle.PlayerAttack - battle.EnemyDefense * 0.5));
        battle.EnemyCurrentHp = Math.Max(0, battle.EnemyCurrentHp - playerDmg);

        var enemyDmg = 0;
        string message;

        if (battle.EnemyCurrentHp <= 0)
        {
            return await FinishBattle(battle, "Victory", playerDmg, 0, ct);
        }

        // Enemy attacks back
        enemyDmg = Math.Max(MinDamage, (int)(battle.EnemyAttack - battle.PlayerDefense * 0.5));
        battle.PlayerCurrentHp = Math.Max(0, battle.PlayerCurrentHp - enemyDmg);

        if (battle.PlayerCurrentHp <= 0)
        {
            return await FinishBattle(battle, "Defeat", playerDmg, enemyDmg, ct);
        }

        battle.Turn++;
        message = $"Ты нанёс {playerDmg} урона. Противник ответил на {enemyDmg}.";
        await db.SaveChangesAsync(ct);

        return new TurnResultDto(playerDmg, enemyDmg, battle.PlayerCurrentHp, battle.EnemyCurrentHp, false, null, null, message);
    }

    public async Task<TurnResultDto> UseAbilityAsync(int battleId, CancellationToken ct)
    {
        var battle = await GetActiveBattleAsync(battleId, ct);

        if (battle.PlayerAbilityUsed)
            throw new InvalidOperationException("Способность уже использована в этом бою.");

        battle.PlayerAbilityUsed = true;

        // Load player entity to get ability power
        var playerUe = await db.UserEntities
            .Include(ue => ue.Entity)
            .FirstAsync(ue => ue.Id == battle.PlayerEntityId, ct);

        var abilityPower = playerUe.Entity.AbilityPower;
        var playerDmg = Math.Max(MinDamage, (int)(abilityPower + battle.PlayerAttack * 0.5 - battle.EnemyDefense * 0.3));
        battle.EnemyCurrentHp = Math.Max(0, battle.EnemyCurrentHp - playerDmg);

        if (battle.EnemyCurrentHp <= 0)
        {
            return await FinishBattle(battle, "Victory", playerDmg, 0, ct);
        }

        // Enemy attacks back
        var enemyDmg = Math.Max(MinDamage, (int)(battle.EnemyAttack - battle.PlayerDefense * 0.5));
        battle.PlayerCurrentHp = Math.Max(0, battle.PlayerCurrentHp - enemyDmg);

        if (battle.PlayerCurrentHp <= 0)
        {
            return await FinishBattle(battle, "Defeat", playerDmg, enemyDmg, ct);
        }

        battle.Turn++;
        await db.SaveChangesAsync(ct);

        return new TurnResultDto(
            playerDmg, enemyDmg,
            battle.PlayerCurrentHp, battle.EnemyCurrentHp,
            false, null, null,
            $"{playerUe.Entity.AbilityName}! Нанесено {playerDmg} урона. Противник ответил на {enemyDmg}."
        );
    }

    private async Task<Battle> GetActiveBattleAsync(int battleId, CancellationToken ct)
    {
        var battle = await db.Battles.FindAsync([battleId], ct)
            ?? throw new InvalidOperationException("Бой не найден.");

        if (battle.Result != "Ongoing")
            throw new InvalidOperationException("Бой уже завершён.");

        return battle;
    }

    private async Task<TurnResultDto> FinishBattle(Battle battle, string result, int playerDmg, int enemyDmg, CancellationToken ct)
    {
        battle.Result = result;
        battle.CompletedAt = DateTimeOffset.UtcNow;

        int? reward = null;
        string message;

        if (result == "Victory")
        {
            battle.Reward = WinReward;
            var user = await db.Users.FindAsync([battle.UserId], ct);
            if (user != null)
            {
                user.ChakChak += WinReward;
            }
            reward = WinReward;
            message = $"Победа! Ты получаешь {WinReward} чак-чака!";
        }
        else
        {
            message = "Поражение. Попробуй другую тактику!";
        }

        await db.SaveChangesAsync(ct);

        return new TurnResultDto(
            playerDmg, enemyDmg,
            battle.PlayerCurrentHp, battle.EnemyCurrentHp,
            true, result, reward, message
        );
    }
}
