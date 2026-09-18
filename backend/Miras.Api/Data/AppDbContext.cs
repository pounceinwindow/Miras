using Microsoft.EntityFrameworkCore;
using Miras.Api.Models;

namespace Miras.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Entity> Entities => Set<Entity>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<UserEntity> UserEntities => Set<UserEntity>();
    public DbSet<Encounter> Encounters => Set<Encounter>();
    public DbSet<Battle> Battles => Set<Battle>();
    public DbSet<PveBattle> PveBattles => Set<PveBattle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // --- User ---
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Username).HasMaxLength(100).IsRequired();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.GameTokenHash).HasMaxLength(64);
            e.HasIndex(u => u.GameTokenHash).IsUnique();
        });

        // --- Entity ---
        modelBuilder.Entity<Entity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Slug).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
        });

        // --- Location ---
        modelBuilder.Entity<Location>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.NfcToken).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.NfcToken).IsUnique();
            e.HasOne(x => x.Entity).WithMany(x => x.Locations).HasForeignKey(x => x.EntityId);
        });

        // --- Question ---
        modelBuilder.Entity<Question>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Entity).WithMany(x => x.Questions).HasForeignKey(x => x.EntityId);
            e.Property(x => x.CorrectOption).HasMaxLength(1).IsRequired();
        });

        // --- UserEntity ---
        modelBuilder.Entity<UserEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User).WithMany(x => x.UserEntities).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Entity).WithMany().HasForeignKey(x => x.EntityId);
            e.HasIndex(x => new { x.UserId, x.EntityId }).IsUnique();
        });

        // --- Encounter ---
        modelBuilder.Entity<Encounter>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User).WithMany(x => x.Encounters).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Entity).WithMany().HasForeignKey(x => x.EntityId);
            e.HasOne(x => x.Location).WithMany(x => x.Encounters).HasForeignKey(x => x.LocationId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        });

        // --- Battle ---
        modelBuilder.Entity<Battle>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User).WithMany(x => x.Battles).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.PlayerEntity).WithMany().HasForeignKey(x => x.PlayerEntityId);
            e.HasOne(x => x.EnemyEntity).WithMany().HasForeignKey(x => x.EnemyEntityId);
            e.Property(x => x.Result).HasMaxLength(20);
        });

        modelBuilder.Entity<PveBattle>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.StateJson).HasColumnType("jsonb");
            e.Property(x => x.Version).IsConcurrencyToken();
            e.HasOne(x => x.User).WithMany(x => x.PveBattles).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Encounter).WithMany().HasForeignKey(x => x.EncounterId);
            e.HasIndex(x => new { x.UserId, x.UpdatedAt });
        });

        // ========== SEED DATA ==========
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // --- Seed User ---
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "batyr",
            ChakChak = 100,
            CreatedAt = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero)
        });

        // --- Seed Entities ---
        var shurale = new Entity
        {
            Id = 1,
            Name = "Шурале",
            Slug = "shurale",
            Category = "Дух леса",
            Description = "Лесной дух из татарских сказок, озорной и хитрый. Любит щекотать заблудившихся путников.",
            Story = "В дремучем лесу, где вековые дубы переплетают свои кроны, обитает Шурале — лесной дух с длинными пальцами и рогом на лбу. Он известен тем, что заманивает путников в чащу и щекочет их до изнеможения. Но однажды храбрый дровосек по имени Былтыр перехитрил Шурале, зажав его пальцы в расщелине бревна. С тех пор Шурале стал осторожнее, но не утратил своего озорного нрава. Эту историю рассказал великий татарский поэт Габдулла Тукай в своей знаменитой поэме.",
            BaseHp = 100,
            BaseAttack = 18,
            BaseDefense = 12,
            AbilityName = "Корни леса",
            AbilityDescription = "Шурале призывает корни деревьев, нанося мощный удар и замедляя врага.",
            AbilityPower = 35
        };

        var suAnasy = new Entity
        {
            Id = 2,
            Name = "Су анасы",
            Slug = "su-anasy",
            Category = "Водный дух",
            Description = "Водяная, хозяйка рек и озёр. Расчёсывает золотые волосы на берегу под лунным светом.",
            Story = "На берегах озера Кабан в лунные ночи можно увидеть Су анасы — водяную деву с длинными золотыми волосами. Она сидит на камне и расчёсывает их золотым гребнем. Говорят, если кто-то сумеет завладеть её гребнем, она исполнит любое желание. Но горе тому, кто разгневает хозяйку вод — она утащит его на дно. Старики рассказывают, что Су анасы охраняет сокровища ханов, спрятанные на дне Кабана при падении Казани.",
            BaseHp = 95,
            BaseAttack = 20,
            BaseDefense = 10,
            AbilityName = "Лунный прилив",
            AbilityDescription = "Су анасы обрушивает волну лунной воды, исцеляя себя и нанося урон врагу.",
            AbilityPower = 30
        };

        var syuyumbike = new Entity
        {
            Id = 3,
            Name = "Башня Сююмбике",
            Slug = "syuyumbike",
            Category = "Историческая святыня",
            Description = "Падающая башня Казанского Кремля, символ мудрости и верности царицы Сююмбике.",
            Story = "Башня Сююмбике — одна из падающих башен мира, стоящая в сердце Казанского Кремля. По легенде, царица Сююмбике, последняя правительница Казанского ханства, бросилась с её вершины, не желая подчиниться Ивану Грозному. Она попросила построить башню в семь ярусов за семь дней, и каждый день возводился новый ярус. Когда башня была готова, Сююмбике поднялась на самый верх и шагнула в вечность, став символом свободы и верности своему народу.",
            BaseHp = 110,
            BaseAttack = 15,
            BaseDefense = 16,
            AbilityName = "Свет памяти",
            AbilityDescription = "Башня озаряется светом прошлого, повышая защиту и ослабляя атаку врага.",
            AbilityPower = 25
        };

        var kereml = new Entity
        {
            Id = 4,
            Name = "Казанский Кремль",
            Slug = "kereml",
            Category = "Крепость-памятник",
            Description = "Белокаменная крепость, объект ЮНЕСКО. Вечный страж на слиянии Волги и Казанки.",
            Story = "Казанский Кремль — древняя цитадель, стоящая на холме у слияния рек Волги и Казанки уже более тысячи лет. Он помнит булгарских князей, ханов Золотой Орды и казанских правителей. По легенде, крепость была основана на месте, где колдун-змей Зилант свил своё гнездо. Жители изгнали змея, и он поселился на озере Кабан, а в память о победе Зилант стал символом города. Стены Кремля хранят дух тысячелетий и силу всех народов, живших под его защитой.",
            BaseHp = 120,
            BaseAttack = 14,
            BaseDefense = 18,
            AbilityName = "Каменная печать",
            AbilityDescription = "Кремль обрушивает каменные стены на врага, нанося огромный урон.",
            AbilityPower = 40
        };

        modelBuilder.Entity<Entity>().HasData(shurale, suAnasy, syuyumbike, kereml);

        // --- Seed Locations ---
        modelBuilder.Entity<Location>().HasData(
            new Location { Id = 1, Name = "Лесопарк Лебяжье", EntityId = 1, NfcToken = "SHURALE_NFC" },
            new Location { Id = 2, Name = "Озеро Кабан", EntityId = 2, NfcToken = "SUANASY_NFC" },
            new Location { Id = 3, Name = "Башня Сююмбике", EntityId = 3, NfcToken = "SYUYUMBIKE_NFC" },
            new Location { Id = 4, Name = "Казанский Кремль", EntityId = 4, NfcToken = "ABC123" }
        );

        // --- Seed Questions: Шурале ---
        modelBuilder.Entity<Question>().HasData(
            new Question
            {
                Id = 1, EntityId = 1,
                Text = "Как зовут дровосека, который перехитрил Шурале в поэме Тукая?",
                OptionA = "Батыр", OptionB = "Былтыр", OptionC = "Алтынчеч", OptionD = "Камыр",
                CorrectOption = "B"
            },
            new Question
            {
                Id = 2, EntityId = 1,
                Text = "Чем Шурале любит мучить заблудившихся путников?",
                OptionA = "Пугает криками", OptionB = "Запутывает дороги", OptionC = "Щекочет до изнеможения", OptionD = "Прячет вещи",
                CorrectOption = "C"
            },
            new Question
            {
                Id = 3, EntityId = 1,
                Text = "Какой отличительный признак внешности Шурале?",
                OptionA = "Крылья за спиной", OptionB = "Рог на лбу", OptionC = "Хвост с кисточкой", OptionD = "Три глаза",
                CorrectOption = "B"
            },
            // --- Seed Questions: Су анасы ---
            new Question
            {
                Id = 4, EntityId = 2,
                Text = "Чем Су анасы расчёсывает свои волосы на берегу?",
                OptionA = "Серебряной расчёской", OptionB = "Деревянным гребнем", OptionC = "Золотым гребнем", OptionD = "Костяным гребнем",
                CorrectOption = "C"
            },
            new Question
            {
                Id = 5, EntityId = 2,
                Text = "На берегу какого озера по легенде обитает Су анасы?",
                OptionA = "Озеро Кабан", OptionB = "Озеро Лебяжье", OptionC = "Озеро Раифское", OptionD = "Голубые озёра",
                CorrectOption = "A"
            },
            new Question
            {
                Id = 6, EntityId = 2,
                Text = "Что, по легенде, охраняет Су анасы на дне озера?",
                OptionA = "Древние книги", OptionB = "Волшебный источник", OptionC = "Сокровища ханов", OptionD = "Подводный дворец",
                CorrectOption = "C"
            },
            // --- Seed Questions: Башня Сююмбике ---
            new Question
            {
                Id = 7, EntityId = 3,
                Text = "Сколько ярусов у Башни Сююмбике по легенде?",
                OptionA = "Пять", OptionB = "Шесть", OptionC = "Семь", OptionD = "Восемь",
                CorrectOption = "C"
            },
            new Question
            {
                Id = 8, EntityId = 3,
                Text = "Кем была Сююмбике?",
                OptionA = "Дочерью купца", OptionB = "Последней правительницей Казанского ханства", OptionC = "Женой Тукая", OptionD = "Легендарной воительницей",
                CorrectOption = "B"
            },
            new Question
            {
                Id = 9, EntityId = 3,
                Text = "Чем знаменита Башня Сююмбике среди архитектурных памятников мира?",
                OptionA = "Самая высокая в России", OptionB = "Построена без единого гвоздя", OptionC = "Является падающей башней", OptionD = "Полностью из мрамора",
                CorrectOption = "C"
            },
            // --- Seed Questions: Казанский Кремль ---
            new Question
            {
                Id = 10, EntityId = 4,
                Text = "У слияния каких рек стоит Казанский Кремль?",
                OptionA = "Волга и Кама", OptionB = "Волга и Казанка", OptionC = "Кама и Свияга", OptionD = "Казанка и Булак",
                CorrectOption = "B"
            },
            new Question
            {
                Id = 11, EntityId = 4,
                Text = "Какое мифическое существо стало символом Казани?",
                OptionA = "Единорог", OptionB = "Грифон", OptionC = "Зилант", OptionD = "Феникс",
                CorrectOption = "C"
            },
            new Question
            {
                Id = 12, EntityId = 4,
                Text = "Какой статус имеет Казанский Кремль?",
                OptionA = "Памятник регионального значения", OptionB = "Объект ЮНЕСКО", OptionC = "Музей-заповедник", OptionD = "Национальный парк",
                CorrectOption = "B"
            }
        );
    }
}
