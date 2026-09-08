using EmployeeManagementSystem.Business.DTOs.Profile;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Profile
{
    public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequestDto>
    {
        public UpdateProfileRequestValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("Firstname cant be empty")
                .Length(2, 50)
                .WithMessage("First name must be between 2 and 50 characters.");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .WithMessage("Last name is required.")
                .Length(1, 50)
                .WithMessage("Last name must be between 1 and 50 characters.");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("Phone number is required.")
                .Matches(@"^[6-9]\d{9}$")
                .WithMessage("Please enter a valid 10-digit Indian mobile number.");
        }
    }
}
