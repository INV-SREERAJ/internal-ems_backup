using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveYearConfiguration
{
    public class CreateLeaveYearConfigurationRequestValidator : AbstractValidator<CreateLeaveYearConfigurationRequest>
    {
        public CreateLeaveYearConfigurationRequestValidator()
        {
            RuleFor(x => x.Year)
                .InclusiveBetween(1000, 9999).WithMessage("Year must be a 4-digit number between 1000 and 9999.");

            RuleFor(x => x.LeaveTypeId)
                .GreaterThan(0).WithMessage("LeaveTypeId must be greater than 0.");

            RuleFor(x => x.AllocatedDays)
                .InclusiveBetween(1, 365).WithMessage("AllocatedDays must be between 1 and 365.");
        }
    }
}
