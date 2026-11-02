using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveYearConfiguration
{
    public class GetLeaveYearConfigurationsRequestValidator : AbstractValidator<GetLeaveYearConfigurationsRequest>
    {
        public GetLeaveYearConfigurationsRequestValidator()
        {
            RuleFor(x => x.Year)
                .InclusiveBetween(1000, 9999).WithMessage("Year must be a 4-digit number between 1000 and 9999.");
        }
    }
}
