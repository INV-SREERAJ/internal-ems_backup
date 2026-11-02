using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveYearConfiguration
{
    public class ChangeLeaveYearConfigurationStatusRequestValidator : AbstractValidator<ChangeLeaveYearConfigurationStatusRequest>
    {
        public ChangeLeaveYearConfigurationStatusRequestValidator()
        {
            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("isActive is required");
        }
    }
}
