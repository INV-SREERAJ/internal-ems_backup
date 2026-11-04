using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveRequest
{
    public class ApplyLeaveRequestValidator : AbstractValidator<ApplyLeaveRequest>
    {
        public ApplyLeaveRequestValidator()
        {
            RuleFor(x => x.LeaveTypeId)
                .GreaterThan(0).WithMessage("LeaveTypeId must be greater than 0.");

            RuleFor(x => x.FromDate)
                .Must(d => d != default).WithMessage("FromDate is required.");

            RuleFor(x => x.FromDate)
                .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("Leave cannot be applied for past dates.");

            RuleFor(x => x.ToDate)
                .Must(d => d != default).WithMessage("ToDate is required.");

            RuleFor(x => x)
                .Must(x => x.FromDate <= x.ToDate)
                .WithMessage("FromDate must be less than or equal to ToDate.")
                .When(x => x.FromDate != default && x.ToDate != default);

            RuleFor(x => x)
                .Must(x => x.FromDate.Year == x.ToDate.Year)
                .WithMessage("Leave request must be within the same calendar year.")
                .When(x => x.FromDate != default && x.ToDate != default && x.FromDate <= x.ToDate);

            RuleFor(x => x.Reason)
                .Must(r => !string.IsNullOrWhiteSpace(r))
                .WithMessage("Reason is required.")
                .Must(r => r == null || r.Trim().Length <= 500)
                .WithMessage("Reason cannot exceed 500 characters.");

            RuleFor(x => x)
                .Must(x => WorkingDayCalculator.Count(x.FromDate, x.ToDate) > 0)
                .WithMessage("The selected date range must include at least one working day (Monday to Friday).")
                .When(x => x.FromDate != default && x.ToDate != default && x.FromDate <= x.ToDate);
        }
    }
}
