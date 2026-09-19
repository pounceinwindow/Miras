using System.Text.Json;
using System.Text.Json.Serialization;

namespace Miras.Api.Pve;

public sealed class CombatantState
{
    public string Id { get; set; } = "";
    public int Level { get; set; }
    public int Hp { get; set; }
    public int MaxHp { get; set; }
    public int Lane { get; set; } = 1;
    public int RootUntil { get; set; }
    public int ReflectUntil { get; set; }
    public int MistUntil { get; set; }
    public int WeakUntil { get; set; }
    public int Shield { get; set; }
    public int ShieldUntil { get; set; }
    public int MoveReady { get; set; }
    public int[] SkillReady { get; set; } = [0, 0];
}

public sealed class ThreatState
{
    public int Id { get; set; }
    public string Owner { get; set; } = "";
    public string Kind { get; set; } = "";
    public int[] Lanes { get; set; } = [];
    public int Due { get; set; }
    public int Damage { get; set; }
    public int Duration { get; set; }
}

public sealed class SealState
{
    public string Side { get; set; } = "";
    public int Lane { get; set; }
    public int Until { get; set; }
}

public sealed class PveState
{
    public string Id { get; set; } = "";
    public string Mode { get; set; } = "training";
    public string Target { get; set; } = "";
    public CombatantState Player { get; set; } = new();
    public List<CombatantState> Reserves { get; set; } = [];
    public CombatantState Enemy { get; set; } = new();
    public double BossDamageScale { get; set; } = 0.65;
    public int Tick { get; set; }
    public string Status { get; set; } = "active";
    public bool Paused { get; set; } = true;
    public List<ThreatState> Threats { get; set; } = [];
    public List<SealState> Seals { get; set; } = [];
    public int Seq { get; set; }
    public int NextPlayerAttack { get; set; } = 10;
    public int NextEnemyAttack { get; set; } = 25;
    public int NextEnemyMove { get; set; } = 50;
    public int NextEnemySkill { get; set; } = 40;
    public int EnemySkill { get; set; }
    public List<string> Log { get; set; } = [];
}

public sealed record FighterRule(int Hp, int Attack, string[] Skills);
public sealed record SkillRule(string Name, int Cooldown, int Damage, int Windup, int Duration);

public static class PveEngine
{
    public const int TickMs = 100;
    public const int MaxTicks = 900;
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static readonly IReadOnlyDictionary<string, FighterRule> Fighters =
        new Dictionary<string, FighterRule>
        {
            ["su-anasy"] = new(110, 14, ["wave", "comb"]),
            ["shurale"] = new(130, 9, ["tickle", "mist"]),
            ["syuyumbike"] = new(140, 8, ["will", "voice"]),
            ["kereml"] = new(155, 8, ["wall", "seal"])
        };

    public static readonly IReadOnlyDictionary<string, SkillRule> Skills =
        new Dictionary<string, SkillRule>
        {
            ["wave"] = new("Обратная волна", 60, 14, 4, 16),
            ["comb"] = new("Золотой гребень", 90, 8, 8, 20),
            ["tickle"] = new("Щекотка", 85, 12, 14, 20),
            ["mist"] = new("Лесной морок", 100, 0, 0, 30),
            ["will"] = new("Воля ханбике", 100, 22, 0, 40),
            ["voice"] = new("Глас Казани", 100, 12, 15, 40),
            ["wall"] = new("Белокаменная стена", 100, 32, 0, 40),
            ["seal"] = new("Печать ворот", 100, 16, 16, 40)
        };

    public static PveState Create(Guid id, IReadOnlyList<(string Id, int Level)> heroes, string target, string mode)
    {
        if (heroes.Count == 0 || heroes.Count > 3 || heroes.Any(hero => !Fighters.ContainsKey(hero.Id)) || !Fighters.ContainsKey(target))
            throw new InvalidOperationException("Неизвестный хранитель.");
        var enemy = Fighter(target, mode == "training" ? heroes[0].Level : 1);
        var hpScale = heroes.Count == 1 ? 0.78 : heroes.Count == 2 ? 1.25 : 1.75;
        var bossDamageScale = heroes.Count == 1 ? 0.65 : heroes.Count == 2 ? 0.85 : 1.05;
        enemy.Hp = enemy.MaxHp = (int)Math.Round(enemy.Hp * hpScale, MidpointRounding.AwayFromZero);
        return new PveState
        {
            Id = id.ToString(),
            Mode = mode,
            Target = target,
            Player = Fighter(heroes[0].Id, heroes[0].Level),
            Reserves = heroes.Skip(1).Select(hero => Fighter(hero.Id, hero.Level)).ToList(),
            Enemy = enemy,
            BossDamageScale = bossDamageScale,
            Log = ["Следи за отмеченными позициями. Обычная атака срабатывает на одной дорожке с врагом."]
        };
    }

    private static CombatantState Fighter(string id, int level)
    {
        var hp = Fighters[id].Hp + (level - 1) * 12;
        return new CombatantState { Id = id, Level = level, Hp = hp, MaxHp = hp };
    }

    public static bool Move(PveState battle, string side, int lane)
    {
        var fighter = Side(battle, side);
        if (battle.Status != "active" || battle.Paused || lane is < 0 or > 2 ||
            fighter.Lane == lane || fighter.RootUntil > battle.Tick || fighter.MoveReady > battle.Tick ||
            battle.Seals.Any(item => item.Side == side && item.Lane == lane && item.Until > battle.Tick))
            return false;
        fighter.Lane = lane;
        fighter.MoveReady = battle.Tick + 4;
        return true;
    }

    public static bool Cast(PveState battle, string side, int slot)
    {
        var fighter = Side(battle, side);
        var target = Side(battle, Other(side));
        if (battle.Status != "active" || battle.Paused || slot is < 0 or > 1 ||
            fighter.SkillReady[slot] > battle.Tick)
            return false;
        var skill = Fighters[fighter.Id].Skills[slot];
        var rule = Skills[skill];
        fighter.SkillReady[slot] = battle.Tick + rule.Cooldown;
        var baseDamage = rule.Damage + (fighter.Level - 1) * 2;
        var damage = side == "enemy" ? (int)Math.Ceiling(baseDamage * battle.BossDamageScale) : baseDamage;
        switch (skill)
        {
            case "wave":
                fighter.RootUntil = 0;
                fighter.ReflectUntil = battle.Tick + rule.Duration;
                AddThreat(battle, side, skill, [fighter.Lane], damage, rule.Windup);
                break;
            case "mist":
                fighter.MistUntil = battle.Tick + rule.Duration;
                break;
            case "will":
            case "wall":
                fighter.Shield = baseDamage;
                fighter.ShieldUntil = battle.Tick + rule.Duration;
                fighter.RootUntil = skill == "wall" ? battle.Tick + 20 : 0;
                break;
            default:
                AddThreat(
                    battle,
                    side,
                    skill,
                    skill == "voice" ? [target.Lane, (target.Lane + 1) % 3] : [target.Lane],
                    damage,
                    rule.Windup,
                    rule.Duration);
                break;
        }
        Note(battle, $"{(side == "player" ? "Ты" : "Соперник")}: {rule.Name}");
        return true;
    }

    public static void Step(PveState battle, int ticks)
    {
        for (var index = 0; index < ticks && battle.Status == "active" && !battle.Paused; index++)
        {
            battle.Tick++;
            battle.Seals.RemoveAll(item => item.Until <= battle.Tick);
            foreach (var fighter in new[] { battle.Player, battle.Enemy })
                if (fighter.ShieldUntil <= battle.Tick) fighter.Shield = 0;

            var due = battle.Threats.Where(item => item.Due <= battle.Tick).ToList();
            battle.Threats.RemoveAll(item => item.Due <= battle.Tick);
            foreach (var threat in due) Resolve(battle, threat);

            if (battle.Player.Hp <= 0 && battle.Reserves.Any(item => item.Hp > 0))
            {
                var next = battle.Reserves.FindIndex(item => item.Hp > 0);
                var defeated = battle.Player;
                battle.Player = battle.Reserves[next];
                battle.Reserves[next] = defeated;
                Note(battle, $"В бой выходит {battle.Player.Id}");
            }

            if (battle.Player.Hp <= 0 || battle.Tick >= MaxTicks) battle.Status = "lost";
            else if (battle.Enemy.Hp <= 0) battle.Status = "won";
            if (battle.Status != "active")
            {
                battle.Threats.Clear();
                Note(battle, battle.Status == "won" ? "Победа!" : "Поражение. Попробуй другую тактику.");
                break;
            }

            if (battle.Tick >= battle.NextEnemyMove)
            {
                var lane = (battle.Enemy.Lane + (battle.Enemy.Id == "shurale" ? 2 : 1)) % 3;
                Move(battle, "enemy", lane);
                battle.NextEnemyMove = battle.Tick + 50;
            }
            if (battle.Tick >= battle.NextEnemySkill)
            {
                Cast(battle, "enemy", battle.EnemySkill);
                battle.EnemySkill = 1 - battle.EnemySkill;
                battle.NextEnemySkill = battle.Tick + 45;
            }
            AutoAttack(battle, "player");
            AutoAttack(battle, "enemy");
        }
    }

    public static bool Switch(PveState battle, int slot)
    {
        if (slot < 0 || slot >= battle.Reserves.Count || battle.Reserves[slot].Hp <= 0 || battle.Player.MoveReady > battle.Tick)
            return false;
        var lane = battle.Player.Lane;
        (battle.Player, battle.Reserves[slot]) = (battle.Reserves[slot], battle.Player);
        battle.Player.Lane = lane;
        battle.Player.MoveReady = battle.Tick + 15;
        Note(battle, $"В бой выходит {battle.Player.Id}");
        return true;
    }

    private static void AutoAttack(PveState battle, string side)
    {
        var next = side == "player" ? battle.NextPlayerAttack : battle.NextEnemyAttack;
        if (battle.Tick < next) return;
        var fighter = Side(battle, side);
        var target = Side(battle, Other(side));
        if (side == "enemy" || fighter.Lane == target.Lane)
        {
            var damage = Fighters[fighter.Id].Attack + (fighter.Level - 1) * 2;
            if (side == "enemy") damage = (int)Math.Ceiling(damage * battle.BossDamageScale);
            if (fighter.WeakUntil > battle.Tick) damage = (int)Math.Ceiling(damage / 2d);
            AddThreat(battle, side, "shot", [side == "player" ? fighter.Lane : target.Lane], damage, 12);
        }
        if (side == "player") battle.NextPlayerAttack = battle.Tick + 20;
        else battle.NextEnemyAttack = battle.Tick + 20;
    }

    private static void Resolve(PveState battle, ThreatState threat)
    {
        var side = Other(threat.Owner);
        var target = Side(battle, side);
        if (threat.Kind == "seal")
            battle.Seals.AddRange(threat.Lanes.Select(lane => new SealState
                { Side = side, Lane = lane, Until = battle.Tick + threat.Duration }));
        if (!threat.Lanes.Contains(target.Lane)) return;
        if (threat.Kind == "shot" && target.ReflectUntil > battle.Tick)
        {
            Hit(Side(battle, threat.Owner), threat.Damage);
            Note(battle, "Снаряд отражён!");
            return;
        }
        if (threat.Kind == "shot" && target.MistUntil > battle.Tick) return;
        Hit(target, threat.Damage);
        if (threat.Kind is "comb" or "tickle")
            target.RootUntil = Math.Max(target.RootUntil, battle.Tick + threat.Duration);
        if (threat.Kind == "voice") target.WeakUntil = battle.Tick + threat.Duration;
    }

    private static void Hit(CombatantState target, int amount)
    {
        var absorbed = Math.Min(target.Shield, amount);
        target.Shield -= absorbed;
        target.Hp = Math.Max(0, target.Hp - amount + absorbed);
    }

    private static void AddThreat(PveState battle, string owner, string kind, int[] lanes, int damage, int windup, int duration = 0) =>
        battle.Threats.Add(new ThreatState
        {
            Id = ++battle.Seq,
            Owner = owner,
            Kind = kind,
            Lanes = lanes,
            Damage = damage,
            Due = battle.Tick + windup,
            Duration = duration
        });

    private static CombatantState Side(PveState battle, string side) =>
        side == "player" ? battle.Player : battle.Enemy;
    private static string Other(string side) => side == "player" ? "enemy" : "player";
    private static void Note(PveState battle, string text)
    {
        battle.Log.Insert(0, text);
        if (battle.Log.Count > 5) battle.Log.RemoveRange(5, battle.Log.Count - 5);
    }
}
