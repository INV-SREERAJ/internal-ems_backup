using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagementSystem.DataAccess.Configurations
{
    public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
    {
        public void Configure(EntityTypeBuilder<Employee> builder)
        {
            builder.ToTable("Employees");

            builder.HasKey(u => u.Id);

            builder.HasIndex(u => u.Email)
                   .IsUnique();

            builder.Property(u => u.EmployeeCode)
                   .IsRequired()
                   .HasMaxLength(20);

            builder.Property(u => u.FirstName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(u => u.LastName)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(u => u.Email)
                   .IsRequired()
                   .HasMaxLength(150);

            builder.Property(u => u.PhoneNumber)
                   .HasMaxLength(20);

            builder.Property(u => u.PasswordHash)
                   .IsRequired()
                   .HasMaxLength(255);

            builder.Property(u => u.TokenVersion)
                   .HasDefaultValue(0);

            builder.Property(u => u.Status)
                .HasDefaultValue(EmployeeStatus.Active);

            builder.Property(u => u.MustChangePassword)
                   .HasDefaultValue(true);

            builder.Property(e => e.Role)
                .HasMaxLength(20);

            builder.HasOne(u => u.Manager)
                   .WithMany(u => u.Employees)
                   .HasForeignKey(u => u.ManagerId)
                   .OnDelete(DeleteBehavior.Restrict);


        }
    }
}
