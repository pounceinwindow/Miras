using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Miras.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationPostgisAndMindAr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS postgis;");

            migrationBuilder.DropForeignKey(
                name: "FK_Encounters_Locations_LocationId",
                table: "Encounters");

            migrationBuilder.DropForeignKey(
                name: "FK_Locations_Entities_EntityId",
                table: "Locations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Locations",
                table: "Locations");

            migrationBuilder.RenameTable(
                name: "Locations",
                newName: "locations");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "locations",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "locations",
                newName: "longitude");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "locations",
                newName: "latitude");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "locations",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "NfcToken",
                table: "locations",
                newName: "nfc_token");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "locations",
                newName: "entity_id");

            migrationBuilder.RenameIndex(
                name: "IX_Locations_NfcToken",
                table: "locations",
                newName: "IX_locations_nfc_token");

            migrationBuilder.RenameIndex(
                name: "IX_Locations_EntityId",
                table: "locations",
                newName: "IX_locations_entity_id");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "locations",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "mind_file_hash",
                table: "locations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mind_file_path",
                table: "locations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Point>(
                name: "position",
                table: "locations",
                type: "geography(Point, 4326)",
                nullable: true);

            migrationBuilder.Sql("UPDATE locations SET position = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography WHERE position IS NULL;");

            migrationBuilder.AlterColumn<Point>(
                name: "position",
                table: "locations",
                type: "geography(Point, 4326)",
                nullable: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_locations",
                table: "locations",
                column: "id");

            migrationBuilder.UpdateData(
                table: "locations",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "is_active", "mind_file_hash", "mind_file_path", "position" },
                values: new object[] { true, null, "mind/shurale.mind", (NetTopologySuite.Geometries.Point)new NetTopologySuite.IO.WKTReader().Read("SRID=4326;POINT (49.1495 55.7972)") });

            migrationBuilder.UpdateData(
                table: "locations",
                keyColumn: "id",
                keyValue: 2,
                columns: new[] { "is_active", "mind_file_hash", "mind_file_path", "position" },
                values: new object[] { true, null, "mind/su-anasy.mind", (NetTopologySuite.Geometries.Point)new NetTopologySuite.IO.WKTReader().Read("SRID=4326;POINT (49.1235 55.7797)") });

            migrationBuilder.UpdateData(
                table: "locations",
                keyColumn: "id",
                keyValue: 3,
                columns: new[] { "is_active", "mind_file_hash", "mind_file_path", "position" },
                values: new object[] { true, null, "mind/syuyumbike.mind", (NetTopologySuite.Geometries.Point)new NetTopologySuite.IO.WKTReader().Read("SRID=4326;POINT (49.1051 55.8005)") });

            migrationBuilder.UpdateData(
                table: "locations",
                keyColumn: "id",
                keyValue: 4,
                columns: new[] { "is_active", "mind_file_hash", "mind_file_path", "position" },
                values: new object[] { true, null, "mind/kereml.mind", (NetTopologySuite.Geometries.Point)new NetTopologySuite.IO.WKTReader().Read("SRID=4326;POINT (49.1052 55.7984)") });

            migrationBuilder.CreateIndex(
                name: "idx_locations_position",
                table: "locations",
                column: "position")
                .Annotation("Npgsql:IndexMethod", "GIST");

            migrationBuilder.AddForeignKey(
                name: "FK_Encounters_locations_LocationId",
                table: "Encounters",
                column: "LocationId",
                principalTable: "locations",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_locations_Entities_entity_id",
                table: "locations",
                column: "entity_id",
                principalTable: "Entities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Encounters_locations_LocationId",
                table: "Encounters");

            migrationBuilder.DropForeignKey(
                name: "FK_locations_Entities_entity_id",
                table: "locations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_locations",
                table: "locations");

            migrationBuilder.DropIndex(
                name: "idx_locations_position",
                table: "locations");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "locations");

            migrationBuilder.DropColumn(
                name: "mind_file_hash",
                table: "locations");

            migrationBuilder.DropColumn(
                name: "mind_file_path",
                table: "locations");

            migrationBuilder.DropColumn(
                name: "position",
                table: "locations");

            migrationBuilder.RenameTable(
                name: "locations",
                newName: "Locations");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Locations",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "longitude",
                table: "Locations",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "latitude",
                table: "Locations",
                newName: "Latitude");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Locations",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "nfc_token",
                table: "Locations",
                newName: "NfcToken");

            migrationBuilder.RenameColumn(
                name: "entity_id",
                table: "Locations",
                newName: "EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_locations_nfc_token",
                table: "Locations",
                newName: "IX_Locations_NfcToken");

            migrationBuilder.RenameIndex(
                name: "IX_locations_entity_id",
                table: "Locations",
                newName: "IX_Locations_EntityId");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Locations",
                table: "Locations",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Encounters_Locations_LocationId",
                table: "Encounters",
                column: "LocationId",
                principalTable: "Locations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Locations_Entities_EntityId",
                table: "Locations",
                column: "EntityId",
                principalTable: "Entities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
