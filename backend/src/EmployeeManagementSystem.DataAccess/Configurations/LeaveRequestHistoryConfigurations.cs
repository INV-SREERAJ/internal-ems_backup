using EmployeeManagementSystem.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagementSystem.DataAccess.Configurations
{
    public class LeaveRequestHistoryConfiguration : IEntityTypeConfiguration<LeaveRequestHistory>
    {
        public void Configure(EntityTypeBuilder<LeaveRequestHistory> builder)
        {
            builder.ToTable("LeaveRequestHistories");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Comments)
                .HasMaxLength(500);

            builder.HasOne(x => x.LeaveRequest)
                .WithMany(x => x.History)
                .HasForeignKey(x => x.LeaveRequestId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.PerformedBy)
                .WithMany()
                .HasForeignKey(x => x.PerformedById)
                .OnDelete(DeleteBehavior.Restrict);

            // history timeline of one request
            builder.HasIndex(x => new { x.LeaveRequestId, x.PerformedAt });
        }
    }
}