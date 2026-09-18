using Miras.Api;
namespace Miras.Api.Tests;

public sealed class FakeClock : TimeProvider
{
    public DateTimeOffset Now = new(2026, 9, 18, 12, 0, 0, TimeSpan.Zero); public override DateTimeOffset GetUtcNow() => Now;
}
public class GameTests
{
    readonly FakeClock clock = new();
    [Fact]
    public void CaptureAndCooldown()
    {
        var engine = new GameEngine(clock);
        var p = new Progress();
        Assert.Equal("failed", engine.Execute(p, new("capture", "shurale", [1, 1, 1])).Outcome);
        Assert.Equal(clock.Now.AddHours(24), p.Cooldowns["shurale"]);
        Assert.Throws<GameException>(() => engine.Execute(p, new("capture", "shurale", [0, 1, 2])));
        clock.Now = clock.Now.AddHours(24);
        Assert.Equal("captured", engine.Execute(p, new("capture", "shurale", [0, 1, 2])).Outcome);
        Assert.Equal(1, p.Collection.Single().Level);
        Assert.Throws<GameException>(() => engine.Execute(p, new("capture", "shurale", [0, 1, 2])));
    }
    [Theory]
    [InlineData("shurale")]
    [InlineData("syuyumbike")]
    [InlineData("su-anasy")]
    [InlineData("kereml")]
    public void BattleCanBeWonAndRewardsOnlyOnce(string id)
    {
        var engine = new GameEngine(clock);
        var p = new Progress();
        engine.Execute(p, new("capture", id, Rules.Characters[id].Answers));
        engine.Execute(p, new("startBattle", id));
        var b = p.Battle!;
        while (b.Status == "active")
        {
            var intent = Rules.EnemyIntent(b.Turn);
            var action = intent == "skill" ? "guard" : intent != "guard" && b.Player.Energy >= 3 ? "skill" : "attack";
            engine.Execute(p, new("battleTurn", BattleId: b.Id, Turn: b.Turn, Action: action));
        }
        Assert.Equal("won", b.Status);
        Assert.Equal(25, p.Balance);
        Assert.Equal(1, p.Wins);
        Assert.Throws<GameException>(() => engine.Execute(p, new("battleTurn", BattleId: b.Id, Turn: b.Turn, Action: "attack")));
        Assert.Equal(25, p.Balance);
    }
    [Fact]
    public void UpgradeRequiresFundsAndHasLevelCap()
    {
        var engine = new GameEngine(clock);
        var p = new Progress();
        engine.Execute(p, new("capture", "shurale", [0, 1, 2]));
        Assert.Throws<GameException>(() => engine.Execute(p, new("upgrade", "shurale")));
        p.Balance = 60;
        engine.Execute(p, new("upgrade", "shurale"));
        Assert.Equal(30, p.Balance);
        Assert.Equal(2, p.Collection[0].Level);
        p.Collection[0].Level = 10;
        Assert.Throws<GameException>(() => engine.Execute(p, new("upgrade", "shurale")));
    }
    [Fact]
    public void RejectsInvalidCommands()
    {
        var engine = new GameEngine(clock);
        var p = new Progress();
        Assert.Throws<GameException>(() => engine.Execute(p, new("hack")));
        Assert.Throws<GameException>(() => engine.Execute(p, new("capture", "missing", [0, 1, 2])));
        Assert.Throws<GameException>(() => engine.Execute(p, new("capture", "shurale", [0])));
        Assert.Throws<GameException>(() => engine.Execute(p, new("startBattle", "shurale")));
    }
    [Fact]
    public void RejectsRepeatedTurnAndInsufficientEnergy()
    {
        var engine = new GameEngine(clock);
        var p = new Progress();
        engine.Execute(p, new("capture", "shurale", [0, 1, 2]));
        engine.Execute(p, new("startBattle", "shurale"));
        var b = p.Battle!;
        Assert.Throws<GameException>(() => engine.Execute(p, new("battleTurn", BattleId: b.Id, Turn: 1, Action: "skill")));
        engine.Execute(p, new("battleTurn", BattleId: b.Id, Turn: 1, Action: "attack"));
        Assert.Throws<GameException>(() => engine.Execute(p, new("battleTurn", BattleId: b.Id, Turn: 1, Action: "attack")));
    }
}
