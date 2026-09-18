using Miras.Api.Dtos;
using Miras.Api.Models;
using Miras.Api.Services;

namespace Miras.Api.Tests;

public class BattleTests
{
    [Fact]
    public async Task Battle_AttackDealsDamage()
    {
        using var db = TestDbHelper.CreateContext();
        var battleService = new BattleService(db);

        // Give user a character
        db.UserEntities.Add(new UserEntity
        {
            UserId = 1,
            EntityId = 1, // Shurale
            Level = 1
        });
        await db.SaveChangesAsync();

        var battle = await battleService.StartBattleAsync(new StartBattleRequest(1, 1), default);
        Assert.NotNull(battle);
        Assert.Equal("Ongoing", battle.Status);

        var turn = await battleService.AttackAsync(battle.BattleId, default);
        Assert.True(turn.PlayerDamageDealt >= 5);
        Assert.True(turn.EnemyHp < battle.Enemy.Hp);
    }

    [Fact]
    public async Task Battle_AbilityCanOnlyBeUsedOnce()
    {
        using var db = TestDbHelper.CreateContext();
        var battleService = new BattleService(db);

        db.UserEntities.Add(new UserEntity
        {
            UserId = 1,
            EntityId = 1,
            Level = 1
        });
        await db.SaveChangesAsync();

        var battle = await battleService.StartBattleAsync(new StartBattleRequest(1, 1), default);
        var firstAbility = await battleService.UseAbilityAsync(battle.BattleId, default);

        Assert.True(firstAbility.PlayerDamageDealt > 0);

        // If battle not finished, second attempt must throw
        if (!firstAbility.BattleFinished)
        {
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                battleService.UseAbilityAsync(battle.BattleId, default));
        }
    }

    [Fact]
    public async Task Battle_VictoryAwardsChakChak()
    {
        using var db = TestDbHelper.CreateContext();
        var battleService = new BattleService(db);

        db.UserEntities.Add(new UserEntity
        {
            UserId = 1,
            EntityId = 1,
            Level = 5 // strong level to win fast
        });
        await db.SaveChangesAsync();

        var battle = await battleService.StartBattleAsync(new StartBattleRequest(1, 1), default);

        // Keep attacking until battle is finished
        TurnResultDto turn = null!;
        for (int i = 0; i < 30; i++)
        {
            turn = await battleService.AttackAsync(battle.BattleId, default);
            if (turn.BattleFinished)
                break;
        }

        Assert.True(turn.BattleFinished);
        if (turn.Result == "Victory")
        {
            Assert.Equal(BattleService.WinReward, turn.RewardChakChak);
            var user = await db.Users.FindAsync(1);
            Assert.Equal(100 + BattleService.WinReward, user!.ChakChak);
        }
    }
}
