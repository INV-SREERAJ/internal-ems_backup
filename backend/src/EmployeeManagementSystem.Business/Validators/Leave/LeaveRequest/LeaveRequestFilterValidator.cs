using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveRequest
{
    public abstract class LeaveRequestFilterValidator<T> : AbstractValidator<T>
        where T : LeaveRequestFilter
    {
        protected LeaveRequestFilterValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThanOrEqualTo(1)
                .WithMessage("Page must be greater than or equal to 1.");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("PageSize must be between 1 and 100.");

            RuleFor(x => x.LeaveTypeId)
                .GreaterThan(0)
                .WithMessage("LeaveTypeId must be greater than 0.")
                .When(x => x.LeaveTypeId.HasValue);

            RuleFor(x => x.Year)
                .InclusiveBetween(1000, 9999)
                .WithMessage("Year must be a 4-digit number between 1000 and 9999.")
                .When(x => x.Year.HasValue);

            RuleFor(x => x.Status)
                .Must(status =>
                {
                    if (string.IsNullOrWhiteSpace(status))
                    {
                        return true;
                    }

                    var trimmed = status.Trim();
                    return Enum.TryParse<LeaveStatus>(trimmed, ignoreCase: true, out var parsed)
                           && Enum.IsDefined(typeof(LeaveStatus), parsed)
                           && !int.TryParse(trimmed, out _);
                })
                .WithMessage("Status must be one of: Pending, Approved, Rejected, Cancelled.")
                .When(x => !string.IsNullOrWhiteSpace(x.Status));

            RuleFor(x => x)
                .Must(x => x.FromDate!.Value <= x.ToDate!.Value)
                .WithMessage("FromDate must be less than or equal to ToDate.")
                .When(x => x.FromDate.HasValue && x.ToDate.HasValue);
        }
    }

    public class ConcreteLeaveRequestFilterValidator : LeaveRequestFilterValidator<LeaveRequestFilter>
    {
    }

    public class ConcreteTeamLeaveRequestFilterValidator : LeaveRequestFilterValidator<TeamLeaveRequestFilter>
    {
        public ConcreteTeamLeaveRequestFilterValidator()
        {
            RuleFor(x => x.EmployeeCode)
                .Must(code => !string.IsNullOrWhiteSpace(code))
                .WithMessage("EmployeeCode cannot be blank when provided.")
                .MaximumLength(20)
                .WithMessage("EmployeeCode cannot exceed 20 characters.")
                .When(x => x.EmployeeCode != null);
        }
    }
}

