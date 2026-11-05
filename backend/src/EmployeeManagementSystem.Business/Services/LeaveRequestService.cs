using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.common;
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

        public async Task<Result<PagedResponse<MyLeaveRequestListItem>>> GetMyRequestsAsync(string employeeCode, LeaveRequestFilter filter)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Employee {EmployeeCode} fetching leave requests page {Page}", trimmedCode, filter.Page);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Get my requests failed: employee not found: {EmployeeCode}", trimmedCode);
                return Result<PagedResponse<MyLeaveRequestListItem>>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            LeaveStatus? status = null;
            if (!string.IsNullOrWhiteSpace(filter.Status) &&
                Enum.TryParse<LeaveStatus>(filter.Status.Trim(), ignoreCase: true, out var parsedStatus) &&
                Enum.IsDefined(typeof(LeaveStatus), parsedStatus))
            {
                status = parsedStatus;
            }

            var query = new LeaveRequestQuery
            {
                EmployeeId = employee.Id,
                ManagerId = null,
                EmployeeCode = null,
                Search = filter.Search,
                LeaveTypeId = filter.LeaveTypeId,
                Status = status,
                Year = filter.Year,
                FromDate = filter.FromDate,
                ToDate = filter.ToDate,
                Page = filter.Page,
                PageSize = filter.PageSize
            };

            var (items, totalCount) = await _leaveRequestRepository.GetPagedAsync(query);

            var mappedItems = items.Select(MapToListItem).ToList();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

            _logger.LogInformation("Employee {EmployeeCode} fetched {Count} leave requests for page {Page}", trimmedCode, mappedItems.Count, filter.Page);

            var response = new PagedResponse<MyLeaveRequestListItem>
            {
                Data = mappedItems,
                PageNumber = filter.Page,
                PageSize = filter.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };

            return Result<PagedResponse<MyLeaveRequestListItem>>.Ok(response);
        }

        private static MyLeaveRequestListItem MapToListItem(LeaveRequest request)
        {
            return new MyLeaveRequestListItem
            {
                Id = request.Id,
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
                CreatedAt = EnsureUtc(request.CreatedAt),
                UpdatedAt = EnsureUtc(request.UpdatedAt)
            };
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
                id, LeaveStatus.Pending, LeaveStatus.Cancelled,
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

        public Task<Result<LeaveRequestResponse>> ApproveAsManagerAsync(string managerCode, int id) =>
            ReviewAsync(managerCode, id, approve: true, rejectionReason: null, restrictToDirectReports: true);

        private async Task<Result<LeaveRequestResponse>> ReviewAsync(string actorCode, int id, bool approve, string? rejectionReason, bool restrictToDirectReports)
        {
            var code = actorCode?.Trim() ?? string.Empty;
            var verb = approve ? "approve" : "reject";
            _logger.LogInformation("User {ActorCode} attempting to {Verb} leave request {LeaveRequestId}", code, verb, id);

            var actor = await _employeeRepository.GetByEmployeeCodeAsync(code, trackChanges: false);
            if(actor == null)
            {
                _logger.LogWarning("Leave {Verb} failed: actor not found: {ActorCode}", verb, code);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var request = await _leaveRequestRepository.GetByIdWithDetailsAsync(id, trackChanges: false);

            if(request == null || (restrictToDirectReports && request.Employee.ManagerId != actor.Id))
            {
                _logger.LogWarning("Leave {Verb} failed: request {LeaveRequestId} not found in scope of {ActorCode}", verb, id, code);
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }

            var allowed = approve ? request.Status == LeaveStatus.Pending
                    : request.Status == LeaveStatus.Pending || request.Status == LeaveStatus.Approved;

            if (!allowed)
            {
                _logger.LogWarning("Leave {Verb} failed: request {LeaveRequestId} is {Status}", verb, id, request.Status);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict,
                    approve ? "Only pending leave requests can be approved."
                            : "Only pending or approved leave requests can be rejected.");
            }

            var expected = request.Status;
            var newStatus = approve ? LeaveStatus.Approved : LeaveStatus.Rejected;
            if (!approve && request.Status == LeaveStatus.Approved && request.FromDate < DateOnly.FromDateTime(DateTime.UtcNow))
            {
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict, "Cannot reject an approved leave that has already started or passed.");
            }
            var now = DateTime.UtcNow;

            var history = new LeaveRequestHistory
            {
                PreviousStatus = expected,
                NewStatus = newStatus,
                PerformedById = actor.Id,
                PerformedAt = now,
                Comments = rejectionReason
            };

            var changed = await _leaveRequestRepository.TryTransitionAsync(id, expected, newStatus, actor.Id, now, rejectionReason, history);

            if (!changed)
            {
                _logger.LogWarning("Leave {Verb} failed: request {LeaveRequestId} changed by another operation", verb, id);
                return Result<LeaveRequestResponse>.Fail(ErrorType.Conflict,
                    "The leave request was changed by another operation. Please refresh and try again.");
            }

            var reloaded = await _leaveRequestRepository.GetByIdWithDetailsAsync(id, trackChanges: false);
            if(reloaded == null)
            {
                return Result<LeaveRequestResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }
            _logger.LogInformation("Leave request {LeaveRequestId} {Status} by {ActorCode}", id, newStatus, code);

            await NotifyEmployeeAsync(reloaded, approve, rejectionReason);   // after commit; never changes the result

            return Result<LeaveRequestResponse>.Ok(MapToResponse(reloaded));
        }

        private async Task NotifyEmployeeAsync(LeaveRequest request, bool approved, string? rejectionReason)
        {
            try
            {
                var employee = request.Employee;
                var name = $"{employee.FirstName} {employee.LastName}".Trim();

                if (approved)
                    await _emailService.SendLeaveApprovedNotification(
                        employee.Email, name, request.LeaveType.Name,
                        request.FromDate, request.ToDate, request.NumberOfDays);
                else
                    await _emailService.SendLeaveRejectedNotification(
                        employee.Email, name, request.LeaveType.Name,
                        request.FromDate, request.ToDate, request.NumberOfDays, rejectionReason!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send leave decision email for leave request {LeaveRequestId}", request.Id);
            }
        }

        public Task<Result<LeaveRequestResponse>> RejectAsManagerAsync(string managerCode, int id, RejectLeaveRequest request) =>
            ReviewAsync(managerCode, id, approve: false, request.RejectionReason.Trim(), restrictToDirectReports: true);

        public Task<Result<LeaveRequestResponse>> ApproveAsAdminAsync(string adminCode, int id)=>
            ReviewAsync(adminCode, id, approve: true, rejectionReason: null, restrictToDirectReports: false);

        public Task<Result<LeaveRequestResponse>> RejectAsAdminAsync(string adminCode, int id, RejectLeaveRequest request) =>
            ReviewAsync(adminCode, id, approve: false, request.RejectionReason.Trim(), restrictToDirectReports: false);
        public Task<Result<LeaveRequestHistoryResponse>> GetMyHistoryAsync(string employeeCode, int id) =>
            GetHistoryInternalAsync(employeeCode, id, ScopeType.Employee);

        public Task<Result<LeaveRequestHistoryResponse>> GetManagerHistoryAsync(string managerCode, int id) =>
            GetHistoryInternalAsync(managerCode, id, ScopeType.Manager);

        public Task<Result<LeaveRequestHistoryResponse>> GetAdminHistoryAsync(int id) =>
            GetHistoryInternalAsync(null, id, ScopeType.Admin);

        private enum ScopeType { Employee, Manager, Admin }

        private async Task<Result<LeaveRequestHistoryResponse>> GetHistoryInternalAsync(string? callerCode, int id, ScopeType scope)
        {
            var trimmedCode = callerCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Fetching history for leave request {LeaveRequestId} with scope {Scope} by caller {CallerCode}", id, scope, trimmedCode);

            Employee? caller = null;
            if (scope != ScopeType.Admin)
            {
                caller = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
                if (caller == null)
                {
                    _logger.LogWarning("Get history failed: caller not found: {CallerCode}", trimmedCode);
                    return Result<LeaveRequestHistoryResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
                }
            }

            var request = await _leaveRequestRepository.GetByIdWithDetailsAsync(id, trackChanges: false);

            if (request == null)
            {
                _logger.LogWarning("Get history failed: request {LeaveRequestId} not found", id);
                return Result<LeaveRequestHistoryResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }

            if (scope == ScopeType.Employee && request.EmployeeId != caller!.Id)
            {
                _logger.LogWarning("Get history failed: request {LeaveRequestId} does not belong to employee {CallerCode}", id, trimmedCode);
                return Result<LeaveRequestHistoryResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }

            if (scope == ScopeType.Manager && request.Employee.ManagerId != caller!.Id)
            {
                _logger.LogWarning("Get history failed: request {LeaveRequestId} employee is not a direct report of manager {CallerCode}", id, trimmedCode);
                return Result<LeaveRequestHistoryResponse>.Fail(ErrorType.NotFound, "Leave request not found.");
            }

            var history = await _leaveRequestRepository.GetHistoryAsync(id);

            var items = history.Select(h => new LeaveRequestHistoryItem
            {
                Id = h.Id,
                Action = LeaveHistoryActionMapper.GetAction(h.PreviousStatus, h.NewStatus),
                PreviousStatus = h.PreviousStatus?.ToString(),
                NewStatus = h.NewStatus.ToString(),
                PerformedByEmployeeCode = h.PerformedBy?.EmployeeCode ?? string.Empty,
                PerformedByName = h.PerformedBy != null ? $"{h.PerformedBy.FirstName} {h.PerformedBy.LastName}".Trim() : string.Empty,
                PerformedAt = EnsureUtc(h.PerformedAt),
                Comments = h.Comments
            }).ToList();

            _logger.LogInformation("History for leave request {LeaveRequestId} retrieved successfully with {Count} entries", id, items.Count);

            return Result<LeaveRequestHistoryResponse>.Ok(new LeaveRequestHistoryResponse
            {
                LeaveRequestId = id,
                History = items
            });
        }
    }
}
