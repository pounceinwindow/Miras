using System.Text.Json;
namespace Miras.Api;

public sealed class GameException(string message) : Exception(message);
public sealed record GameCommand(string Type, string? CharacterId = null, int[]? Answers = null, string? BattleId = null, int Turn = 0, string? Action = null);
public sealed record GameResult(Progress Progress, string? Outcome = null);
public sealed class OwnedCharacter
{
    public string Id { get; set; } = ""; public int Level { get; set; } = 1; public DateTimeOffset CapturedAt
    {
        get; set;
    }
}
public sealed class Fighter
{
    public string Id { get; set; } = ""; public int Level
    {
        get; set;
    }
    public int Hp
    {
        get; set;
    }
    public int MaxHp
    {
        get; set;
    }
    public int Energy { get; set; } = 2;
}
public sealed class Battle
{
    public string Id { get; set; } = ""; public Fighter Player { get; set; } = new(); public Fighter Enemy { get; set; } = new(); public int Turn { get; set; } = 1; public string Status { get; set; } = "active"; public List<string> Log { get; set; } = [];
}
public sealed class Progress
{
    public int Balance
    {
        get; set;
    }
    public List<OwnedCharacter> Collection { get; set; } = []; public Dictionary<string, DateTimeOffset> Cooldowns { get; set; } = []; public int Wins
    {
        get; set;
    }
    public Battle? Battle
    {
        get; set;
    }
}
public sealed record CharacterRules(int Attack, int Health, string Skill, int[] Answers);
public static class Rules
{
    public const int MaxLevel = 10, WinReward = 25;
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public static readonly IReadOnlyDictionary<string, CharacterRules> Characters = new Dictionary<string, CharacterRules>
    {
        ["shurale"] = new(16, 100, "Корни леса", [0, 1, 2]),
        ["syuyumbike"] = new(15, 110, "Свет памяти", [1, 0, 2]),
        ["su-anasy"] = new(17, 95, "Лунный прилив", [1, 2, 0]),
        ["kereml"] = new(14, 120, "Каменная печать", [1, 0, 2])
    };
    public static string EnemyIntent(int turn) => turn % 3 == 0 ? "skill" : turn % 3 == 2 ? "guard" : "attack";
    public static Fighter Fighter(string id, int level)
    {
        var hp = Characters[id].Health + (level - 1) * 12;
        return new()
        {
            Id = id,
            Level = level,
            Hp = hp,
            MaxHp = hp
        };
    }
}
public sealed class GameEngine(TimeProvider clock)
{
    public GameResult Execute(Progress progress, GameCommand command)
    {
        if (command.Type == "sync")
            return new(progress);
        if (command.Type == "battleTurn")
        {
            var battle = progress.Battle ?? throw new GameException("Сначала начни поединок");
            if (battle.Id != command.BattleId || battle.Turn != command.Turn)
                throw new GameException("Ход уже обработан. Обнови состояние боя.");
            TakeTurn(battle, command.Action);
            if (battle.Status == "won")
            {
                progress.Balance += Rules.WinReward;
                progress.Wins++;
            }
            return new(progress);
        }
        if (command.Type is not ("capture" or "upgrade" or "startBattle"))
            throw new GameException("Неизвестное действие");
        var id = command.CharacterId;
        if (id is null || !Rules.Characters.TryGetValue(id, out var character))
            throw new GameException("Персонаж не найден");
        var owned = progress.Collection.Find(c => c.Id == id);
        if (command.Type == "capture")
        {
            if (owned is not null)
                throw new GameException("Персонаж уже в коллекции");
            var now = clock.GetUtcNow();
            if (progress.Cooldowns.TryGetValue(id, out var until) && until > now)
                throw new GameException("Повторная попытка будет доступна через сутки после ошибки");
            if (command.Answers is not { Length: 3 } answers || answers.Any(a => a < 0 || a > 2))
                throw new GameException("Ответь на все три вопроса");
            if (answers.SequenceEqual(character.Answers))
            {
                progress.Collection.Add(new()
                {
                    Id = id,
                    CapturedAt = now
                });
                progress.Cooldowns.Remove(id);
                return new(progress, "captured");
            }
            progress.Cooldowns[id] = now.AddHours(24);
            return new(progress, "failed");
        }
        if (owned is null)
            throw new GameException("Сначала пригласи персонажа в коллекцию");
        if (command.Type == "upgrade")
        {
            if (owned.Level >= Rules.MaxLevel)
                throw new GameException("Достигнут максимальный уровень");
            var cost = owned.Level * 30;
            if (progress.Balance < cost)
                throw new GameException("Недостаточно чак-чака. Победи в поединке!");
            progress.Balance -= cost;
            owned.Level++;
        }
        else
        {
            if (progress.Battle?.Status == "active")
                throw new GameException("Сначала заверши текущий бой");
            var enemyId = id == "shurale" ? "kereml" : "shurale";
            progress.Battle = new()
            {
                Id = Guid.NewGuid().ToString(),
                Player = Rules.Fighter(id, owned.Level),
                Enemy = Rules.Fighter(enemyId, owned.Level),
                Log = ["Тренировочный поединок начался. Первый ход за тобой."]
            };
        }
        return new(progress);
    }
    public static void TakeTurn(Battle battle, string? action)
    {
        if (battle.Status != "active")
            throw new GameException("Бой уже завершён");
        if (action is not ("attack" or "guard" or "skill"))
            throw new GameException("Неизвестный приём");
        var player = battle.Player;
        var enemy = battle.Enemy;
        if (action == "skill" && player.Energy < 3)
            throw new GameException("Для приёма нужно 3 энергии");
        var intent = Rules.EnemyIntent(battle.Turn);
        static int Damage(Fighter f) => Rules.Characters[f.Id].Attack + (f.Level - 1) * 3;
        static int Rounded(double value) => (int)Math.Floor(value + .5);
        if (action == "guard")
        {
            player.Energy = Math.Min(5, player.Energy + 1);
            battle.Log.Add("Ты защищаешься и восстанавливаешь энергию.");
        }
        else
        {
            var hit = Rounded(Damage(player) * (action == "skill" ? 2 : 1) * (intent == "guard" ? .4 : 1));
            enemy.Hp = Math.Max(0, enemy.Hp - hit);
            player.Energy = action == "skill" ? player.Energy - 3 : Math.Min(5, player.Energy + 1);
            battle.Log.Add($"{(action == "skill" ? Rules.Characters[player.Id].Skill : "Твоя атака")}: −{hit} здоровья сопернику.");
        }
        if (enemy.Hp == 0)
        {
            battle.Status = "won";
            battle.Log.Add($"Победа! Награда: {Rules.WinReward} чак-чака.");
        }
        else if (intent != "guard")
        {
            var hit = Rounded(Damage(enemy) * (intent == "skill" ? 1.8 : 1) * (action == "guard" ? .3 : 1));
            player.Hp = Math.Max(0, player.Hp - hit);
            battle.Log.Add($"{(intent == "skill" ? "Особый приём соперника" : "Атака соперника")}: −{hit} здоровья.");
            if (player.Hp == 0)
            {
                battle.Status = "lost";
                battle.Log.Add("В этот раз победил соперник. Попробуй другую тактику!");
            }
        }
        else
            battle.Log.Add("Соперник защищается и пропускает атаку.");
        battle.Turn++;
        if (battle.Turn > 40 && battle.Status == "active")
        {
            battle.Status = "lost";
            battle.Log.Add("Время поединка вышло.");
        }
        battle.Log = battle.Log.TakeLast(12).ToList();
    }
}
