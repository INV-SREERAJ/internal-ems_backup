using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class LeaveCalendarService : ILeaveCalendarService
    {
        private readonly ILeaveRequestRepository _leaveRequestRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<LeaveCalendarService> _logger;

        public LeaveCalendarService(
            ILeaveRequestRepository leaveRequestRepository,
            IEmployeeRepository employeeRepository,
            ILogger<LeaveCalendarService> logger)
        {
            _leaveRequestRepository = leaveRequestRepository;
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<Result<List<LeaveCalendarItem>>> GetCalendarAsync(string callerCode, string role, GetLeaveCalendarQuery query)
        {
            var trimmedCode = callerCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Caller {CallerCode} with role {Role} fetching leave calendar from {From} to {To}",
                trimmedCode, role, query.From, query.To);

            var caller = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (caller == null)
            {
                _logger.LogWarning("Get calendar failed: caller {CallerCode} not found", trimmedCode);
                return Result<List<LeaveCalendarItem>>.Fail(ErrorType.NotFound, "Caller not found.");
            }

            int? employeeId = null;
            int? managerId = null;

            if (string.Equals(role, "Employee", StringComparison.OrdinalIgnoreCase))
            {
                employeeId = caller.Id;
            }
            else if (string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase))
            {
                managerId = caller.Id;
            }
            else if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                // Admin sees all approved requests; employeeId and managerId remain null
            }
            else
            {
                _logger.LogWarning("Get calendar failed: invalid or unauthorized role {Role} for caller {CallerCode}", role, trimmedCode);
                return Result<List<LeaveCalendarItem>>.Fail(ErrorType.Unauthorized, "User is not authorized.");
            }

            var requests = await _leaveRequestRepository.GetApprovedInRangeAsync(query.From, query.To, employeeId, managerId);

            var items = requests.Select(r => new LeaveCalendarItem
            {
                LeaveRequestId = r.Id,
                EmployeeCode = r.Employee?.EmployeeCode ?? string.Empty,
                EmployeeName = r.Employee != null ? $"{r.Employee.FirstName} {r.Employee.LastName}".Trim() : string.Empty,
                LeaveTypeId = r.LeaveTypeId,
                LeaveTypeName = r.LeaveType?.Name ?? string.Empty,
                LeaveTypeCode = r.LeaveType?.Code ?? string.Empty,
                FromDate = r.FromDate,
                ToDate = r.ToDate,
                NumberOfDays = r.NumberOfDays
            }).ToList();

            _logger.LogInformation("Caller {CallerCode} with role {Role} retrieved {Count} calendar leave items for range {From} to {To}",
                trimmedCode, role, items.Count, query.From, query.To);

            return Result<List<LeaveCalendarItem>>.Ok(items);
        }
    }
}

