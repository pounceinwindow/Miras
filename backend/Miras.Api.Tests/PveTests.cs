using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Miras.Api.Pve;
using Miras.Api.Services;

namespace Miras.Api.Tests;

public class PveTests
{
    [Fact]
    public void Wave_CleansesRoot_AndReflectsProjectile()
    {
        var battle = PveEngine.Create(Guid.NewGuid(), [("su-anasy", 1)], "shurale", "training");
        battle.Paused = false;
        battle.Player.RootUntil = 50;
        battle.Player.Lane = battle.Enemy.Lane = 1;
        battle.NextPlayerAttack = 999;
        battle.NextEnemyAttack = 1;

        Assert.True(PveEngine.Cast(battle, "player", 0));
        Assert.Equal(0, battle.Player.RootUntil);
        var enemyHp = battle.Enemy.Hp;
        PveEngine.Step(battle, 13);

        Assert.Equal(battle.Player.MaxHp, battle.Player.Hp);
        Assert.True(battle.Enemy.Hp < enemyHp);
    }

    [Fact]
    public void Seal_IsGroundDamage_AndClosesLane()
    {
        var battle = PveEngine.Create(Guid.NewGuid(), [("su-anasy", 1)], "kereml", "training");
        battle.Paused = false;
        battle.Player.ReflectUntil = 100;

        Assert.True(PveEngine.Cast(battle, "enemy", 1));
        PveEngine.Step(battle, PveEngine.Skills["seal"].Windup);

        Assert.True(battle.Player.Hp < battle.Player.MaxHp);
        Assert.Contains(battle.Seals, item => item.Side == "player" && item.Lane == 1);
    }

    [Fact]
    public async Task EncounterVictory_CapturesExactlyOnce()
    {
        using var db = TestDbHelper.CreateContext();
        var user = await db.Users.SingleAsync(item => item.Id == 1);
        user.ChakChak = 0;
        var service = new GameService(db);

        var quiz = await service.ExecuteAsync(user, Command("""
            {"type":"capture","characterId":"shurale","tagId":"forest-01","answers":[0,1,2]}
            """), default);
        Assert.Equal("ready", quiz.Outcome);
        Assert.DoesNotContain(quiz.Progress.Collection, item => item.Id == "shurale");

        var started = await service.ExecuteAsync(user, Command("""
            {"type":"pveStart","characterId":"su-anasy","target":"shurale","mode":"encounter"}
            """), default);
        var battle = started.Progress.Pve!;
        var row = await db.PveBattles.SingleAsync(item => item.Id == Guid.Parse(battle.Id));
        battle.Paused = false;
        battle.Enemy.Hp = 1;
        battle.Enemy.Lane = battle.Player.Lane;
        battle.NextPlayerAttack = 1;
        row.StateJson = JsonSerializer.Serialize(battle, PveEngine.Json);
        row.UpdatedAt = DateTimeOffset.UtcNow.AddMilliseconds(-1400);
        await db.SaveChangesAsync();

        var command = $$"""{"type":"pve","battleId":"{{battle.Id}}","action":"poll"}""";
        var won = await service.ExecuteAsync(user, Command(command), default);
        Assert.Equal("won", won.Progress.Pve!.Status);
        Assert.Contains(won.Progress.Collection, item => item.Id == "shurale");

        var replay = await service.ExecuteAsync(user, Command(command), default);
        Assert.Equal(1, replay.Progress.Wins);
    }

    private static JsonElement Command(string json) =>
        JsonDocument.Parse(json).RootElement.Clone();
}
