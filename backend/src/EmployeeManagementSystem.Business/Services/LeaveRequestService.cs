using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ILeaveRequestRepository _leaveRequestRepository;
        private readonly IEmployeeLeaveBalanceRepository _balanceRepository;
        private readonly ILeaveTypeRepository _leaveTypeRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LeaveRequestService> _logger;

        public LeaveRequestService(
            ILeaveRequestRepository leaveRequestRepository,
            IEmployeeLeaveBalanceRepository balanceRepository,
            ILeaveTypeRepository leaveTypeRepository,
            IEmployeeRepository employeeRepository,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<LeaveRequestService> logger)
        {
            _leaveRequestRepository = leaveRequestRepository;
            _balanceRepository = balanceRepository;
            _leaveTypeRepository = leaveTypeRepository;
            _employeeRepository = employeeRepository;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<Result<LeaveRequestResponse>> ApplyAsync(string employeeCode, ApplyLeaveRequest request)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Employee {EmployeeCode} applying for leave type {LeaveTypeId} from {FromDate} to {ToDate}",
                trimmedCode, request.LeaveTypeId, request.FromDate, request.ToDate);

            // 1. Leave type exists and active check
            var leaveType = await _leaveTypeRepository.GetByIdAsync(request.LeaveTypeId, trackChanges: false);
            if (leaveType == null)
            {
                _logger.LogWarning("Leave application failed: leave type {LeaveTypeId} not found", request.LeaveTypeId);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Leave type not found.");
            }

            if (!leaveType.IsActive)
            {
                _logger.LogWarning("Leave application failed: leave type {LeaveTypeId} is inactive", request.LeaveTypeId);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "Leave type is inactive.");
            }

            // 2. Employee exists check
            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Leave application failed: employee not found: {EmployeeCode}", trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            // 3. Overlap check
            var hasOverlap = await _leaveRequestRepository.HasOverlapAsync(employee.Id, request.FromDate, request.ToDate);
            if (hasOverlap)
            {
                _logger.LogWarning("Leave application failed: dates overlap existing request for employee {EmployeeCode}", trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "Leave dates overlap an existing pending or approved request.");
            }

            // 4. Balance and availability check
            var summary = await _balanceRepository.GetSummaryAsync(employee.Id, request.LeaveTypeId, request.FromDate.Year);
            if (summary == null)
            {
                _logger.LogWarning("Leave application failed: no balance for employee {EmployeeCode}, leave type {LeaveTypeId}, year {Year}",
                    trimmedCode, request.LeaveTypeId, request.FromDate.Year);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "No leave balance exists for this leave type and year.");
            }

            var workingDays = WorkingDayCalculator.Count(request.FromDate, request.ToDate);
            var availableDays = summary.AllocatedDays - summary.UsedDays - summary.PendingDays;

            if (availableDays < workingDays)
            {
                _logger.LogWarning("Leave application failed: insufficient balance for employee {EmployeeCode}. Available: {Available}, Required: {Required}",
                    trimmedCode, availableDays, workingDays);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "Insufficient leave balance.");
            }

            // 5. Build LeaveRequest and history entry
            var now = DateTime.UtcNow;
            var leaveRequest = new LeaveRequest
            {
                EmployeeId = employee.Id,
                LeaveTypeId = request.LeaveTypeId,
                FromDate = request.FromDate,
                ToDate = request.ToDate,
                NumberOfDays = workingDays,
                Reason = request.Reason.Trim(),
                Status = LeaveStatus.Pending,
                CreatedAt = now,
                UpdatedAt = now
            };

            leaveRequest.History.Add(new LeaveRequestHistory
            {
                PreviousStatus = null,
                NewStatus = LeaveStatus.Pending,
                PerformedById = employee.Id,
                PerformedAt = now,
                Comments = null
            });

            // 6. Save changes
            await _leaveRequestRepository.AddAsync(leaveRequest);
            await _leaveRequestRepository.SaveChangesAsync();

            // 7. Reload with details
            var reloadedRequest = await _leaveRequestRepository.GetByIdWithDetailsAsync(leaveRequest.Id, trackChanges: false);
            if (reloadedRequest == null)
            {
                _logger.LogWarning("Failed to reload created leave request for employee {EmployeeCode}", trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Failed to load created leave request.");
            }

            _logger.LogInformation("Leave request {LeaveRequestId} created successfully for employee {EmployeeCode}", reloadedRequest.Id, trimmedCode);

            // 8. Send email to reporting manager if present
            await NotifyReportingManagerAsync(reloadedRequest);

            return Result<LeaveRequestResponse>.Ok(MapToResponse(reloadedRequest));
        }

        public async Task<Result<LeaveRequestResponse>> GetMyRequestByIdAsync(string employeeCode, int id)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Employee {EmployeeCode} fetching leave request {LeaveRequestId}", trimmedCode, id);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Get request failed: employee not found: {EmployeeCode}", trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var request = await _leaveRequestRepository.GetByIdWithDetailsAsync(id, trackChanges: false);
            if (request == null || request.EmployeeId != employee.Id)
            {
                _logger.LogWarning("Leave request not found or unauthorized access: RequestId {LeaveRequestId}, EmployeeCode {EmployeeCode}", id, trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }

            return Result<LeaveRequestResponse>.Ok(MapToResponse(request));
        }

        private async Task NotifyReportingManagerAsync(LeaveRequest request)
        {
            var manager = request.Employee?.Manager;
            if (manager == null)
            {
                _logger.LogInformation("Employee {EmployeeId} has no reporting manager; skipping email notification.", request.EmployeeId);
                return;
            }

            try
            {
                var baseUrl = _configuration["LeaveReviewBaseUrl"]
                              ?? _configuration["FrontendBaseUrl"]
                              ?? "http://localhost:5173/manager/leave-requests";

                var reviewUrl = $"{baseUrl.TrimEnd('/')}/{request.Id}";
                var employeeFullName = $"{request.Employee!.FirstName} {request.Employee.LastName}".Trim();
                var managerFullName = $"{manager.FirstName} {manager.LastName}".Trim();

                await _emailService.SendLeaveApplicationNotificationAsync(
                    managerEmail: manager.Email,
                    managerName: managerFullName,
                    employeeName: employeeFullName,
                    leaveTypeName: request.LeaveType.Name,
                    fromDate: request.FromDate,
                    toDate: request.ToDate,
                    numberOfDays: request.NumberOfDays,
                    reason: request.Reason,
                    reviewUrl: reviewUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send leave application notification email to manager for leave request {LeaveRequestId}", request.Id);
            }
        }

        private static LeaveRequestResponse MapToResponse(LeaveRequest request)
        {
            return new LeaveRequestResponse
            {
                Id = request.Id,
                EmployeeCode = request.Employee?.EmployeeCode ?? string.Empty,
                LeaveTypeId = request.LeaveTypeId,
                LeaveTypeName = request.LeaveType?.Name ?? string.Empty,
                LeaveTypeCode = request.LeaveType?.Code ?? string.Empty,
                Year = request.FromDate.Year,
                FromDate = request.FromDate,
                ToDate = request.ToDate,
                NumberOfDays = request.NumberOfDays,
                Reason = request.Reason,
                Status = request.Status.ToString(),
                RejectionReason = request.Status == LeaveStatus.Rejected ? request.RejectionReason : null,
                ReviewedByName = request.ReviewedBy != null
                    ? $"{request.ReviewedBy.FirstName} {request.ReviewedBy.LastName}".Trim()
                    : null,
                ReviewedAt = EnsureUtc(request.ReviewedAt),
                CreatedAt = EnsureUtc(request.CreatedAt),
                UpdatedAt = EnsureUtc(request.UpdatedAt)
            };
        }

        private static DateTime EnsureUtc(DateTime dt)
        {
            return dt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                : dt.ToUniversalTime();
        }

        private static DateTime? EnsureUtc(DateTime? dt)
        {
            return dt.HasValue ? EnsureUtc(dt.Value) : null;
        }

        public async Task<Result<LeaveRequestResponse>> CancelAsync(string employeeCode, int id)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Employee {EmployeeCode} cancelling leave request {LeaveRequestId}", trimmedCode, id);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Cancel failed: employee not found: {EmployeeCode}", trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var request = await _leaveRequestRepository.GetByIdWithDetailsAsync(id, trackChanges: false);
            if (request == null || request.EmployeeId != employee.Id)
            {
                _logger.LogWarning("Cancel failed: request {LeaveRequestId} not found for {EmployeeCode}", id, trimmedCode);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }

            if (request.Status != LeaveStatus.Pending)
            {
                _logger.LogWarning("Cancel failed: request {LeaveRequestId} is {Status}", id, request.Status);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "Only pending leave requests can be cancelled.");
            }

            var now = DateTime.UtcNow;
            var history = new LeaveRequestHistory
            {
                PreviousStatus = LeaveStatus.Pending,
                NewStatus = LeaveStatus.Cancelled,
                PerformedById = employee.Id,
                PerformedAt = now,
                Comments = null
            };

            var changed = await _leaveRequestRepository.TryTransitionAsync(
                id, new[] { LeaveStatus.Pending }, LeaveStatus.Cancelled,
                reviewedById: null, reviewedAt: null, rejectionReason: null, history);

            if (!changed)
            {
                _logger.LogWarning("Cancel failed: request {LeaveRequestId} was changed by another operation", id);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "The leave request was changed by another operation. Please refresh and try again.");
            }

            var reloaded = await _leaveRequestRepository.GetByIdWithDetailsAsync(id, trackChanges: false);
            if (reloaded == null)
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Leave request not found.");

            _logger.LogInformation("Leave request {LeaveRequestId} cancelled by {EmployeeCode}", id, trimmedCode);
            return Result<LeaveRequestResponse>.Ok(MapToResponse(reloaded));
        }
    }
}
