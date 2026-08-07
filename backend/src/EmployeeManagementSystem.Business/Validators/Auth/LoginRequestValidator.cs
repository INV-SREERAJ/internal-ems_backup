using EmployeeManagementSystem.Business.DTOs.Auth;
using FluentValidation;

namespace EmployeeManagementSystem.Business.Validators.Admin
{
    public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Enter an email")
                .EmailAddress()
                .WithMessage("Enter a valid email address");


            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required.");
        }
    }

}
