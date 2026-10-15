using EmployeeManagementSystem.Business.DTOs.Leave;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Leave
{
    public class CreateLeaveTypeRequestValidator : AbstractValidator<CreateLeaveTypeRequest>
    {
        public CreateLeaveTypeRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Leave type name is required.")
                .MaximumLength(100)
                .WithMessage("Leave type name cannot exceed 100 characters.");

            RuleFor(x => x.Code)
                .NotEmpty()
                .WithMessage("Leave type code is required.")
                .MaximumLength(20)
                .WithMessage("Leave type code cannot exceed 20 characters.")
                .Matches("^[A-Za-z0-9]+$")
                .WithMessage("Leave type code must contain only letters and numbers.");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Description cannot exceed 500 characters.");
        }
    }
}
