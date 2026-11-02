using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveYearConfiguration
{
    public class UpdateLeaveYearConfigurationRequestValidator : AbstractValidator<UpdateLeaveYearConfigurationRequest>
    {
        public UpdateLeaveYearConfigurationRequestValidator()
        {
            RuleFor(x => x.AllocatedDays)
                .InclusiveBetween(1, 365).WithMessage("AllocatedDays must be between 1 and 365.");
        }
    }
}
