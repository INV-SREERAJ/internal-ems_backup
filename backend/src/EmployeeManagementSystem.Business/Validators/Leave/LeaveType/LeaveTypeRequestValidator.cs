using EmployeeManagementSystem.Business.DTOs.Leave.LeaveType;
using FluentValidation;
using System.Text.RegularExpressions;

public abstract class LeaveTypeRequestValidator<T> : AbstractValidator<T>
    where T : CreateLeaveTypeRequest
{
    private static readonly Regex CodePattern = new("^[A-Za-z0-9]+$", RegexOptions.Compiled);

    protected LeaveTypeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .Must(n => n == null || n.Trim().Length <= 100)
            .WithMessage("Name cannot exceed 100 characters.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required.")
            .Must(c => c == null || c.Trim().Length <= 20)
            .WithMessage("Code cannot exceed 20 characters.")
            .Must(c => c == null || CodePattern.IsMatch(c.Trim()))
            .WithMessage("Code can contain letters and numbers only.");

        RuleFor(x => x.Description)
            .Must(d => d == null || d.Trim().Length <= 500)
            .WithMessage("Description cannot exceed 500 characters.");
    }
}