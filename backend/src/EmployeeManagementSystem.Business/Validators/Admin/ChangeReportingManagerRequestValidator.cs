using EmployeeManagementSystem.Business.DTOs.Admin;
using FluentValidation;
using Microsoft.VisualBasic;

public class ChangeReportingManagerRequestValidator
    : AbstractValidator<ChangeReportingManagerRequest>
{
    public ChangeReportingManagerRequestValidator()
    {
        RuleFor(x => x.ManagerEmployeeCode)
            .NotEmpty()
            .WithMessage("Manager employee code is required.")
            .MaximumLength(12)
            .Matches(@"^EMP\d{8}$")
            .WithMessage("Invalid manager employee code format.");
    }
}