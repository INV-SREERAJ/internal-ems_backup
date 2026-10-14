using EmployeeManagementSystem.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

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
                    "[AllocatedDays] >= 0 AND [UsedDays] >= 0 AND [PendingDays] >= 0 " +
                    "AND [UsedDays] + [PendingDays] <= [AllocatedDays]");
            });
            builder.HasKey(x => x.Id);

            // one balance per employee per leave type per year
            builder.HasIndex(x => new { x.EmployeeId, x.LeaveTypeId, x.Year })
                .IsUnique();

            builder.HasOne(x => x.Employee)
                .WithMany()
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.LeaveType)
                .WithMany(x => x.Balances)
                .HasForeignKey(x => x.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // calculated in code, not a column
            builder.Ignore(x => x.AvailableDays);

            builder.Property(x => x.RowVersion)
                .IsRowVersion();
        }
    }
}
