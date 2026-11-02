using EmployeeManagementSystem.Business.DTOs.Leave.LeaveType;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveType
{
    public class ChangeLeaveTypeStatusRequestValidator : AbstractValidator<ChangeLeaveTypeStatusRequest>
    {
        public ChangeLeaveTypeStatusRequestValidator()
        {
            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("isActive is required");
        }
    }
}
