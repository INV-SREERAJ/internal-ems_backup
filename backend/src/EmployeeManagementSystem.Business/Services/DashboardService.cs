using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Employee;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.DTOs.Manager;
using EmployeeManagementSystem.Business.DTOs.Profile;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILeaveRequestService _leaveRequestService;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(
            IEmployeeRepository employeeRepository,
            ILeaveBalanceService leaveBalanceService,
            ILeaveRequestService leaveRequestService,
            ILogger<DashboardService> logger)
        {
            _employeeRepository = employeeRepository;
            _leaveBalanceService = leaveBalanceService;
            _leaveRequestService = leaveRequestService;
            _logger = logger;
        }

        public async Task<Result<AdminDashboardStatsDto>> GetAdminDashboardStatsAsync()
        {
            _logger.LogInformation("Fetching admin dashboard stats.");
            var stats = await _employeeRepository.GetAdminDashboardStatsAsync();

            var roles = stats.Roles.ToDictionary(
                kvp => kvp.Key.ToString(),
                kvp => kvp.Value);

            return Result<AdminDashboardStatsDto>.Ok(new AdminDashboardStatsDto
            {
                TotalEmployees = stats.Total,
                ActiveEmployees = stats.Active,
                InactiveEmployees = stats.Inactive,
                RoleStats = roles
            });
        }

        public async Task<Result<ManagerDashboardStatsDto>> GetManagerDashboardStatsAsync(string managerCode)
        {
            _logger.LogInformation("Fetching manager dashboard stats for {ManagerCode}.", managerCode);
            var manager = await _employeeRepository.GetByEmployeeCodeAsync(managerCode, trackChanges: false);
            if (manager == null)
            {
                return Result<ManagerDashboardStatsDto>.Fail(ErrorType.NotFound, "Manager not found.");
            }

            var stats = await _employeeRepository.GetManagerDashboardStatsAsync(manager.Id);

            return Result<ManagerDashboardStatsDto>.Ok(new ManagerDashboardStatsDto
            {
                TotalEmployees = stats.Total,
                ActiveEmployees = stats.Active,
                InactiveEmployees = stats.Inactive
            });
        }

        public async Task<Result<EmployeeDashboardDto>> GetEmployeeDashboardAsync(string employeeCode)
        {
            _logger.LogInformation("Fetching employee dashboard data for {EmployeeCode}.", employeeCode);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode, trackChanges: false);
            if (employee == null)
            {
                return Result<EmployeeDashboardDto>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            int currentYear = DateTime.UtcNow.Year;

            // Fetch balances
            var balancesResult = await _leaveBalanceService.GetMyBalancesAsync(employeeCode, currentYear);
            var balances = balancesResult.Success ? balancesResult.Value ?? new List<MyLeaveBalanceResponse>() : new List<MyLeaveBalanceResponse>();

            // Fetch latest request
            var requestsResult = await _leaveRequestService.GetMyRequestsAsync(employeeCode, new LeaveRequestFilter { Page = 1, PageSize = 1 });
            MyLeaveRequestListItem? latestRequest = null;
            if (requestsResult.Success && requestsResult.Value?.Data != null)
            {
                latestRequest = requestsResult.Value.Data.FirstOrDefault();
            }

            // Fetch manager info
            ReportingManagerResponseDto? managerDto = null;
            if (employee.Manager != null)
            {
                managerDto = new ReportingManagerResponseDto
                {
                    ManagerEmployeeCode = employee.Manager.EmployeeCode,
                    ManagerName = $"{employee.Manager.FirstName} {employee.Manager.LastName}",
                    ManagerEmail = employee.Manager.Email,
                    ManagerPhonenumber = employee.Manager.PhoneNumber
                };
            }

            return Result<EmployeeDashboardDto>.Ok(new EmployeeDashboardDto
            {
                Balances = balances,
                LatestRequest = latestRequest,
                Manager = managerDto
            });
        }
    }
}
