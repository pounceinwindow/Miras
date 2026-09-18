using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Miras.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Entities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Story = table.Column<string>(type: "text", nullable: false),
                    BaseHp = table.Column<int>(type: "integer", nullable: false),
                    BaseAttack = table.Column<int>(type: "integer", nullable: false),
                    BaseDefense = table.Column<int>(type: "integer", nullable: false),
                    AbilityName = table.Column<string>(type: "text", nullable: false),
                    AbilityDescription = table.Column<string>(type: "text", nullable: false),
                    AbilityPower = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Entities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ChakChak = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: false),
                    NfcToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_Entities_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Questions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EntityId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    OptionA = table.Column<string>(type: "text", nullable: false),
                    OptionB = table.Column<string>(type: "text", nullable: false),
                    OptionC = table.Column<string>(type: "text", nullable: false),
                    OptionD = table.Column<string>(type: "text", nullable: false),
                    CorrectOption = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Questions_Entities_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserEntities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Xp = table.Column<int>(type: "integer", nullable: false),
                    ObtainedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserEntities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserEntities_Entities_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserEntities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Encounters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: false),
                    LocationId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RetryAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Encounters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Encounters_Entities_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Encounters_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Encounters_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Battles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PlayerEntityId = table.Column<int>(type: "integer", nullable: false),
                    EnemyEntityId = table.Column<int>(type: "integer", nullable: false),
                    Result = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reward = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    PlayerCurrentHp = table.Column<int>(type: "integer", nullable: false),
                    EnemyCurrentHp = table.Column<int>(type: "integer", nullable: false),
                    PlayerMaxHp = table.Column<int>(type: "integer", nullable: false),
                    EnemyMaxHp = table.Column<int>(type: "integer", nullable: false),
                    PlayerAttack = table.Column<int>(type: "integer", nullable: false),
                    PlayerDefense = table.Column<int>(type: "integer", nullable: false),
                    EnemyAttack = table.Column<int>(type: "integer", nullable: false),
                    EnemyDefense = table.Column<int>(type: "integer", nullable: false),
                    Turn = table.Column<int>(type: "integer", nullable: false),
                    PlayerAbilityUsed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Battles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Battles_Entities_EnemyEntityId",
                        column: x => x.EnemyEntityId,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Battles_UserEntities_PlayerEntityId",
                        column: x => x.PlayerEntityId,
                        principalTable: "UserEntities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Battles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Entities",
                columns: new[] { "Id", "AbilityDescription", "AbilityName", "AbilityPower", "BaseAttack", "BaseDefense", "BaseHp", "Category", "Description", "Name", "Slug", "Story" },
                values: new object[,]
                {
                    { 1, "Шурале призывает корни деревьев, нанося мощный удар и замедляя врага.", "Корни леса", 35, 18, 12, 100, "Дух леса", "Лесной дух из татарских сказок, озорной и хитрый. Любит щекотать заблудившихся путников.", "Шурале", "shurale", "В дремучем лесу, где вековые дубы переплетают свои кроны, обитает Шурале — лесной дух с длинными пальцами и рогом на лбу. Он известен тем, что заманивает путников в чащу и щекочет их до изнеможения. Но однажды храбрый дровосек по имени Былтыр перехитрил Шурале, зажав его пальцы в расщелине бревна. С тех пор Шурале стал осторожнее, но не утратил своего озорного нрава. Эту историю рассказал великий татарский поэт Габдулла Тукай в своей знаменитой поэме." },
                    { 2, "Су анасы обрушивает волну лунной воды, исцеляя себя и нанося урон врагу.", "Лунный прилив", 30, 20, 10, 95, "Водный дух", "Водяная, хозяйка рек и озёр. Расчёсывает золотые волосы на берегу под лунным светом.", "Су анасы", "su-anasy", "На берегах озера Кабан в лунные ночи можно увидеть Су анасы — водяную деву с длинными золотыми волосами. Она сидит на камне и расчёсывает их золотым гребнем. Говорят, если кто-то сумеет завладеть её гребнем, она исполнит любое желание. Но горе тому, кто разгневает хозяйку вод — она утащит его на дно. Старики рассказывают, что Су анасы охраняет сокровища ханов, спрятанные на дне Кабана при падении Казани." },
                    { 3, "Башня озаряется светом прошлого, повышая защиту и ослабляя атаку врага.", "Свет памяти", 25, 15, 16, 110, "Историческая святыня", "Падающая башня Казанского Кремля, символ мудрости и верности царицы Сююмбике.", "Башня Сююмбике", "syuyumbike", "Башня Сююмбике — одна из падающих башен мира, стоящая в сердце Казанского Кремля. По легенде, царица Сююмбике, последняя правительница Казанского ханства, бросилась с её вершины, не желая подчиниться Ивану Грозному. Она попросила построить башню в семь ярусов за семь дней, и каждый день возводился новый ярус. Когда башня была готова, Сююмбике поднялась на самый верх и шагнула в вечность, став символом свободы и верности своему народу." },
                    { 4, "Кремль обрушивает каменные стены на врага, нанося огромный урон.", "Каменная печать", 40, 14, 18, 120, "Крепость-памятник", "Белокаменная крепость, объект ЮНЕСКО. Вечный страж на слиянии Волги и Казанки.", "Казанский Кремль", "kereml", "Казанский Кремль — древняя цитадель, стоящая на холме у слияния рек Волги и Казанки уже более тысячи лет. Он помнит булгарских князей, ханов Золотой Орды и казанских правителей. По легенде, крепость была основана на месте, где колдун-змей Зилант свил своё гнездо. Жители изгнали змея, и он поселился на озере Кабан, а в память о победе Зилант стал символом города. Стены Кремля хранят дух тысячелетий и силу всех народов, живших под его защитой." }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "ChakChak", "CreatedAt", "Username" },
                values: new object[] { 1, 100, new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "batyr" });

            migrationBuilder.InsertData(
                table: "Locations",
                columns: new[] { "Id", "EntityId", "Name", "NfcToken" },
                values: new object[,]
                {
                    { 1, 1, "Лесопарк Лебяжье", "SHURALE_NFC" },
                    { 2, 2, "Озеро Кабан", "SUANASY_NFC" },
                    { 3, 3, "Башня Сююмбике", "SYUYUMBIKE_NFC" },
                    { 4, 4, "Казанский Кремль", "ABC123" }
                });

            migrationBuilder.InsertData(
                table: "Questions",
                columns: new[] { "Id", "CorrectOption", "EntityId", "OptionA", "OptionB", "OptionC", "OptionD", "Text" },
                values: new object[,]
                {
                    { 1, "B", 1, "Батыр", "Былтыр", "Алтынчеч", "Камыр", "Как зовут дровосека, который перехитрил Шурале в поэме Тукая?" },
                    { 2, "C", 1, "Пугает криками", "Запутывает дороги", "Щекочет до изнеможения", "Прячет вещи", "Чем Шурале любит мучить заблудившихся путников?" },
                    { 3, "B", 1, "Крылья за спиной", "Рог на лбу", "Хвост с кисточкой", "Три глаза", "Какой отличительный признак внешности Шурале?" },
                    { 4, "C", 2, "Серебряной расчёской", "Деревянным гребнем", "Золотым гребнем", "Костяным гребнем", "Чем Су анасы расчёсывает свои волосы на берегу?" },
                    { 5, "A", 2, "Озеро Кабан", "Озеро Лебяжье", "Озеро Раифское", "Голубые озёра", "На берегу какого озера по легенде обитает Су анасы?" },
                    { 6, "C", 2, "Древние книги", "Волшебный источник", "Сокровища ханов", "Подводный дворец", "Что, по легенде, охраняет Су анасы на дне озера?" },
                    { 7, "C", 3, "Пять", "Шесть", "Семь", "Восемь", "Сколько ярусов у Башни Сююмбике по легенде?" },
                    { 8, "B", 3, "Дочерью купца", "Последней правительницей Казанского ханства", "Женой Тукая", "Легендарной воительницей", "Кем была Сююмбике?" },
                    { 9, "C", 3, "Самая высокая в России", "Построена без единого гвоздя", "Является падающей башней", "Полностью из мрамора", "Чем знаменита Башня Сююмбике среди архитектурных памятников мира?" },
                    { 10, "B", 4, "Волга и Кама", "Волга и Казанка", "Кама и Свияга", "Казанка и Булак", "У слияния каких рек стоит Казанский Кремль?" },
                    { 11, "C", 4, "Единорог", "Грифон", "Зилант", "Феникс", "Какое мифическое существо стало символом Казани?" },
                    { 12, "B", 4, "Памятник регионального значения", "Объект ЮНЕСКО", "Музей-заповедник", "Национальный парк", "Какой статус имеет Казанский Кремль?" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Battles_EnemyEntityId",
                table: "Battles",
                column: "EnemyEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_PlayerEntityId",
                table: "Battles",
                column: "PlayerEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_UserId",
                table: "Battles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_EntityId",
                table: "Encounters",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_LocationId",
                table: "Encounters",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_UserId",
                table: "Encounters",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Entities_Slug",
                table: "Entities",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Locations_EntityId",
                table: "Locations",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_NfcToken",
                table: "Locations",
                column: "NfcToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_EntityId",
                table: "Questions",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_UserEntities_EntityId",
                table: "UserEntities",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_UserEntities_UserId_EntityId",
                table: "UserEntities",
                columns: new[] { "UserId", "EntityId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Battles");

            migrationBuilder.DropTable(
                name: "Encounters");

            migrationBuilder.DropTable(
                name: "Questions");

            migrationBuilder.DropTable(
                name: "UserEntities");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Entities");
        }
    }
}
