using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveRequest
{
    public class GetLeaveCalendarQueryValidator : AbstractValidator<GetLeaveCalendarQuery>
    {
        public GetLeaveCalendarQueryValidator()
        {
            RuleFor(x => x.From)
                .NotEmpty()
                .WithMessage("From date is required.");

            RuleFor(x => x.To)
                .NotEmpty()
                .WithMessage("To date is required.");

            RuleFor(x => x)
                .Must(x => x.From <= x.To)
                .WithMessage("From date must not be after To date.")
                .When(x => x.From != default && x.To != default);

            RuleFor(x => x)
                .Must(x => (x.To.DayNumber - x.From.DayNumber + 1) <= 62)
                .WithMessage("The range must not exceed 62 days.")
                .When(x => x.From != default && x.To != default && x.From <= x.To);
        }
    }
}

