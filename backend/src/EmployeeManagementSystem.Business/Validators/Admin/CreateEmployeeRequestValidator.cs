using EmployeeManagementSystem.Business.DTOs.Admin;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Admin
{
    public class CreateEmployeeRequestValidator : AbstractValidator<CreateEmployeeRequest>
    {
        public CreateEmployeeRequestValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("First name is required.")
                .Length(2, 50)
                .WithMessage("First name must be between 2 and 50 characters.");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .WithMessage("Last name is required.")
                .Length(1, 50)
                .WithMessage("Last name must be between 1 and 50 characters.");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required.")
                .EmailAddress()
                .WithMessage("Enter a valid email address.")
                .MaximumLength(100)
                .WithMessage("Email cannot exceed 100 characters.");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("Phone number is required.")
                .Matches(@"^[6-9]\d{9}$")
                .WithMessage("Please enter a valid 10-digit Indian mobile number.");

            RuleFor(x => x.Role)
                .IsInEnum()
                .WithMessage("Please select a valid role.");

            RuleFor(x => x.ManagerEmployeeCode)
                .Matches(@"^EMP\d{8}$")
                .When(x => !string.IsNullOrWhiteSpace(x.ManagerEmployeeCode))
                .WithMessage("Manager employee code must be in the format EMP2026XXXX.");
        }
    }
}