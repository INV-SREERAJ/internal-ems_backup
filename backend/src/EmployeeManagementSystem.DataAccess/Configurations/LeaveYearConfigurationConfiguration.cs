using EmployeeManagementSystem.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagementSystem.DataAccess.Configurations
{
    public class LeaveYearConfigurationConfiguration : IEntityTypeConfiguration<LeaveYearConfiguration>
    {
        public void Configure(EntityTypeBuilder<LeaveYearConfiguration> builder)
        {
            builder.ToTable("LeaveYearConfigurations", table =>
            {
                table.HasCheckConstraint("CK_LeaveYearConfigurations_AllocatedDays", "[AllocatedDays] >= 0");
            });

            builder.HasKey(x => x.Id);

            builder.HasIndex(x => new { x.LeaveTypeId, x.Year })
                .IsUnique();

            builder.HasOne(x => x.LeaveType)
                .WithMany(x => x.YearConfigurations)
                .HasForeignKey(x => x.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(x => x.RowVersion)
                .IsRowVersion();
        }
    }
}
