using EmployeeManagementSystem.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagementSystem.DataAccess.Configurations
{
    public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
    {
        public void Configure(EntityTypeBuilder<LeaveRequest> builder)
        {
            builder.ToTable("LeaveRequests", table =>
            {
                table.HasCheckConstraint("CK_LeaveRequests_Dates", "[ToDate] >= [FromDate]");
                table.HasCheckConstraint("CK_LeaveRequests_NumberOfDays", "[NumberOfDays] > 0");
            });

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Reason)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(x => x.RejectionReason)
                .HasMaxLength(500);

            builder.HasOne(x => x.Employee)
                .WithMany()
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.LeaveType)
                .WithMany(x => x.LeaveRequests)
                .HasForeignKey(x => x.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.Restrict);

            // overlap check and "my requests" list
            builder.HasIndex(x => new { x.EmployeeId, x.FromDate, x.ToDate });
            builder.HasIndex(x => new { x.EmployeeId, x.Year, x.Status });

            // manager / admin lists filtered by status
            builder.HasIndex(x => x.Status);

            builder.Property(x => x.RowVersion)
                .IsRowVersion();
        }
    }
}