using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Miras.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFriendPvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "Users",
                type: "character varying(24)",
                maxLength: 24,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PublicCode",
                table: "Users",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PvpWins",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SupabaseUserId",
                table: "Users",
                type: "character varying(36)",
                maxLength: 36,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PvpMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InviteCode = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    HostUserId = table.Column<int>(type: "integer", nullable: false),
                    GuestUserId = table.Column<int>(type: "integer", nullable: true),
                    HostCharacterId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GuestCharacterId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Round = table.Column<int>(type: "integer", nullable: false),
                    HostScore = table.Column<int>(type: "integer", nullable: false),
                    GuestScore = table.Column<int>(type: "integer", nullable: false),
                    HostMove = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    GuestMove = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LastHostMove = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LastGuestMove = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    LastRoundWinnerId = table.Column<int>(type: "integer", nullable: true),
                    WinnerUserId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PvpMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PvpMatches_Users_GuestUserId",
                        column: x => x.GuestUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PvpMatches_Users_HostUserId",
                        column: x => x.HostUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PvpMatches_Users_WinnerUserId",
                        column: x => x.WinnerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayName", "PublicCode", "PvpWins", "SupabaseUserId" },
                values: new object[] { null, null, 0, null });

            migrationBuilder.CreateIndex(
                name: "IX_Users_PublicCode",
                table: "Users",
                column: "PublicCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_SupabaseUserId",
                table: "Users",
                column: "SupabaseUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PvpMatches_GuestUserId_Status",
                table: "PvpMatches",
                columns: new[] { "GuestUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PvpMatches_HostUserId_Status",
                table: "PvpMatches",
                columns: new[] { "HostUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PvpMatches_InviteCode",
                table: "PvpMatches",
                column: "InviteCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PvpMatches_WinnerUserId",
                table: "PvpMatches",
                column: "WinnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PvpMatches");

            migrationBuilder.DropIndex(
                name: "IX_Users_PublicCode",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_SupabaseUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PublicCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PvpWins",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SupabaseUserId",
                table: "Users");
        }
    }
}
