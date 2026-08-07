using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators
{
    public class EmployeeQueryParametersValidator : AbstractValidator<EmployeeQueryParameters>
    {
        public EmployeeQueryParametersValidator()
        {
            RuleFor(x => x.Role)
            .Must(role =>
                string.IsNullOrWhiteSpace(role) ||
                Enum.TryParse<Role>(role, true, out _))
            .WithMessage("Role must be one of: Admin, Manager, Employee.");

            RuleFor(x => x.SortBy)
                .Must(sort =>
                    string.IsNullOrWhiteSpace(sort) ||
                    new[] { "name", "email", "role", "employeeCode", "createdAt" }
                        .Contains(sort, StringComparer.OrdinalIgnoreCase))
                .WithMessage("Invalid sort field.");

            RuleFor(x => x.PageNumber)
                .GreaterThan(0);

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100);
        }
    }
}
