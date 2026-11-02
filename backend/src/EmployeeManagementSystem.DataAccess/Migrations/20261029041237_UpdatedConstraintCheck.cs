using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementSystem.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedConstraintCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_Status",
                table: "LeaveRequests");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_Status_FromDate_ToDate",
                table: "LeaveRequests",
                columns: new[] { "Status", "FromDate", "ToDate" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_LeaveRequests_Year",
                table: "LeaveRequests",
                sql: "[Year] = YEAR([FromDate]) AND [Year] = YEAR([ToDate])");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_Status_FromDate_ToDate",
                table: "LeaveRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LeaveRequests_Year",
                table: "LeaveRequests");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_Status",
                table: "LeaveRequests",
                column: "Status");
        }
    }
}
