using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Admin
{
    public class UpdateEmployeeStatusRequestValidator : AbstractValidator<UpdateEmployeeStatusRequest>
    {
        public UpdateEmployeeStatusRequestValidator()
        {
            RuleFor(x => x.Status)
                .Must(status => status == EmployeeStatus.Active || status == EmployeeStatus.Inactive)
                .WithMessage("Status must be either Active or Inactive. Use the delete endpoint to delete an employee.");
        }
    }
}
