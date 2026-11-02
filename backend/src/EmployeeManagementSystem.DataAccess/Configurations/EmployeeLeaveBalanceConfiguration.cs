using EmployeeManagementSystem.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagementSystem.DataAccess.Configurations
{
    public class EmployeeLeaveBalanceConfiguration : IEntityTypeConfiguration<EmployeeLeaveBalance>
    {
        public void Configure(EntityTypeBuilder<EmployeeLeaveBalance> builder)
        {
            builder.ToTable("EmployeeLeaveBalances", table =>
            {
                table.HasCheckConstraint(
                    "CK_EmployeeLeaveBalances_Days",
                    "[AllocatedDays] >= 0 ");
            });
            builder.HasKey(x => x.Id);

            // one balance per employee per leave type per year
            builder.HasIndex(x => new { x.EmployeeId, x.LeaveYearConfigurationId })
                .IsUnique();

            builder.HasOne(x => x.Employee)
                .WithMany()
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.LeaveYearConfiguration)
                .WithMany(x => x.Balances)
                .HasForeignKey(x => x.LeaveYearConfigurationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
