using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementSystem.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RefactorStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Employees",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
                UPDATE Employees SET Status =
                CASE
                    WHEN IsDeleted = 1 THEN 3
                    WHEN IsActive = 0 THEN 2
                    ELSE 1
                END");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Employees");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Employees");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "Employees",
                columns: new[] { "Id", "CreatedAt", "Email", "EmployeeCode", "FirstName", "IsActive", "LastName", "ManagerId", "MustChangePassword", "PasswordHash", "PhoneNumber", "Role", "UpdatedAt" },
                values: new object[] { 1, new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "admin@ems.com", "ADM20260001", "System", true, "Admin", null, true, "$2a$12$j6rZXXE38.Thjp6aP1gqN.l5vhHT3Ym32VRq/ns4Edi3HQloOEAKO", "9999999999", "Admin", new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Unspecified) });
        }
    }
}
