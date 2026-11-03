using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveBalance
{
    public class GetLeaveBalancesRequestValidator : AbstractValidator<GetLeaveBalancesRequest>
    {
        public GetLeaveBalancesRequestValidator()
        {
            RuleFor(x => x.Year)
                .InclusiveBetween(1000, 9999).WithMessage("Year must be a 4-digit number between 1000 and 9999.");
        }
    }
}
