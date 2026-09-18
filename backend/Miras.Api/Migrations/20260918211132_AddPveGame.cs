using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Miras.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPveGame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GameTokenHash",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PveBattles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    EncounterId = table.Column<int>(type: "integer", nullable: true),
                    StateJson = table.Column<string>(type: "jsonb", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RewardApplied = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PveBattles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PveBattles_Encounters_EncounterId",
                        column: x => x.EncounterId,
                        principalTable: "Encounters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PveBattles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "GameTokenHash",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Users_GameTokenHash",
                table: "Users",
                column: "GameTokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PveBattles_EncounterId",
                table: "PveBattles",
                column: "EncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_PveBattles_UserId_UpdatedAt",
                table: "PveBattles",
                columns: new[] { "UserId", "UpdatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PveBattles");

            migrationBuilder.DropIndex(
                name: "IX_Users_GameTokenHash",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "GameTokenHash",
                table: "Users");
        }
    }
}
