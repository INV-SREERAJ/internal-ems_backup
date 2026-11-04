using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace EmployeeManagementSystem.Business.Validators.Leave.LeaveRequest
{
    public class RejectLeaveRequestValidator : AbstractValidator<RejectLeaveRequest>
    {
        public RejectLeaveRequestValidator()
        {
            RuleFor(x => x.RejectionReason)
                .NotEmpty().WithMessage("Rejection reason is required.")
                .Must(r => r == null || r.Trim().Length <= 500)
                .WithMessage("Rejection reason cannot exceed 500 characters.");
        }
    }
}
