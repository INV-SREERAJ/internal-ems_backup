using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementSystem.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class DbChangesDone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeLeaveBalances_LeaveTypes_LeaveTypeId",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_EmployeeId_Year_Status",
                table: "LeaveRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_LeaveRequests_Year",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeLeaveBalances_EmployeeId_LeaveTypeId_Year",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeLeaveBalances_LeaveTypeId_Year",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropCheckConstraint(
                name: "CK_EmployeeLeaveBalances_Days",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LeaveYearConfigurations");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "Action",
                table: "LeaveRequestHistories");

            migrationBuilder.DropColumn(
                name: "LeaveTypeId",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropColumn(
                name: "PendingDays",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropColumn(
                name: "UsedDays",
                table: "EmployeeLeaveBalances");

            migrationBuilder.RenameColumn(
                name: "Year",
                table: "EmployeeLeaveBalances",
                newName: "LeaveYearConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeLeaveBalances_EmployeeId_LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances",
                columns: new[] { "EmployeeId", "LeaveYearConfigurationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeLeaveBalances_LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances",
                column: "LeaveYearConfigurationId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_EmployeeLeaveBalances_Days",
                table: "EmployeeLeaveBalances",
                sql: "[AllocatedDays] >= 0 ");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeLeaveBalances_LeaveYearConfigurations_LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances",
                column: "LeaveYearConfigurationId",
                principalTable: "LeaveYearConfigurations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeLeaveBalances_LeaveYearConfigurations_LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeLeaveBalances_EmployeeId_LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeLeaveBalances_LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances");

            migrationBuilder.DropCheckConstraint(
                name: "CK_EmployeeLeaveBalances_Days",
                table: "EmployeeLeaveBalances");

            migrationBuilder.RenameColumn(
                name: "LeaveYearConfigurationId",
                table: "EmployeeLeaveBalances",
                newName: "Year");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LeaveYearConfigurations",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LeaveTypes",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LeaveRequests",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "LeaveRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Action",
                table: "LeaveRequestHistories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LeaveTypeId",
                table: "EmployeeLeaveBalances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PendingDays",
                table: "EmployeeLeaveBalances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "EmployeeLeaveBalances",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<int>(
                name: "UsedDays",
                table: "EmployeeLeaveBalances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_EmployeeId_Year_Status",
                table: "LeaveRequests",
                columns: new[] { "EmployeeId", "Year", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_LeaveRequests_Year",
                table: "LeaveRequests",
                sql: "[Year] = YEAR([FromDate]) AND [Year] = YEAR([ToDate])");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeLeaveBalances_EmployeeId_LeaveTypeId_Year",
                table: "EmployeeLeaveBalances",
                columns: new[] { "EmployeeId", "LeaveTypeId", "Year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeLeaveBalances_LeaveTypeId_Year",
                table: "EmployeeLeaveBalances",
                columns: new[] { "LeaveTypeId", "Year" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_EmployeeLeaveBalances_Days",
                table: "EmployeeLeaveBalances",
                sql: "[AllocatedDays] >= 0 AND [UsedDays] >= 0 AND [PendingDays] >= 0 AND [UsedDays] + [PendingDays] <= [AllocatedDays]");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeLeaveBalances_LeaveTypes_LeaveTypeId",
                table: "EmployeeLeaveBalances",
                column: "LeaveTypeId",
                principalTable: "LeaveTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
