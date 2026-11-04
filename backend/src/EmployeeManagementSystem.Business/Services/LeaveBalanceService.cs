using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Interfaces;
using EmployeeManagementSystem.DataAccess.Models;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class LeaveBalanceService : ILeaveBalanceService
    {
        private readonly IEmployeeLeaveBalanceRepository _balanceRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<LeaveBalanceService> _logger;

        public LeaveBalanceService(
            IEmployeeLeaveBalanceRepository balanceRepository,
            IEmployeeRepository employeeRepository,
            ILogger<LeaveBalanceService> logger)
        {
            _balanceRepository = balanceRepository;
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<Result<List<MyLeaveBalanceResponse>>> GetMyBalancesAsync(string employeeCode, int year)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Fetching leave balances for employee {EmployeeCode}, year {Year}", trimmedCode, year);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Fetch balances failed, employee not found: {EmployeeCode}", trimmedCode);
                return Result<List<MyLeaveBalanceResponse>>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var summaries = await _balanceRepository.GetSummariesAsync(employee.Id, year);
            var responses = summaries.Select(MapToMyResponse).ToList();

            _logger.LogInformation("Fetched {Count} leave balances for employee {EmployeeCode}, year {Year}", responses.Count, trimmedCode, year);
            return Result<List<MyLeaveBalanceResponse>>.Ok(responses);
        }

        public async Task<Result<List<EmployeeLeaveBalanceResponse>>> GetEmployeeBalancesForAdminAsync(string employeeCode, int year)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Admin fetching leave balances for employee {EmployeeCode}, year {Year}", trimmedCode, year);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Admin fetch balances failed, employee not found: {EmployeeCode}", trimmedCode);
                return Result<List<EmployeeLeaveBalanceResponse>>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var summaries = await _balanceRepository.GetSummariesAsync(employee.Id, year);
            var responses = summaries.Select(s => MapToEmployeeResponse(employee.EmployeeCode, s)).ToList();

            _logger.LogInformation("Admin fetched {Count} leave balances for employee {EmployeeCode}, year {Year}", responses.Count, trimmedCode, year);
            return Result<List<EmployeeLeaveBalanceResponse>>.Ok(responses);
        }

        public async Task<Result<List<EmployeeLeaveBalanceResponse>>> GetEmployeeBalancesForManagerAsync(string managerCode, string employeeCode, int year)
        {
            var trimmedManagerCode = managerCode?.Trim() ?? string.Empty;
            var trimmedEmployeeCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Manager {ManagerCode} fetching leave balances for employee {EmployeeCode}, year {Year}", trimmedManagerCode, trimmedEmployeeCode, year);

            var manager = await _employeeRepository.GetByEmployeeCodeAsync(trimmedManagerCode, trackChanges: false);
            if (manager == null)
            {
                _logger.LogWarning("Manager {ManagerCode} not found", trimmedManagerCode);
                return Result<List<EmployeeLeaveBalanceResponse>>.Fail(ErrorType.NotFound, "Manager not found.");
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedEmployeeCode, trackChanges: false);
            if (employee == null || employee.ManagerId != manager.Id)
            {
                _logger.LogWarning("Manager {ManagerCode} fetch balances failed, employee not found or not a direct report: {EmployeeCode}", trimmedManagerCode, trimmedEmployeeCode);
                return Result<List<EmployeeLeaveBalanceResponse>>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var summaries = await _balanceRepository.GetSummariesAsync(employee.Id, year);
            var responses = summaries.Select(s => MapToEmployeeResponse(employee.EmployeeCode, s)).ToList();

            _logger.LogInformation("Manager {ManagerCode} fetched {Count} leave balances for employee {EmployeeCode}, year {Year}", trimmedManagerCode, responses.Count, trimmedEmployeeCode, year);
            return Result<List<EmployeeLeaveBalanceResponse>>.Ok(responses);
        }

        public async Task<Result<MyLeaveYearsResponse>> GetMyYearsAsync(string employeeCode)
        {
            var trimmedCode = employeeCode?.Trim() ?? string.Empty;
            _logger.LogInformation("Fetching leave balance years for employee {EmployeeCode}", trimmedCode);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(trimmedCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Fetch balance years failed, employee not found: {EmployeeCode}", trimmedCode);
                return Result<MyLeaveYearsResponse>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var years = await _balanceRepository.GetYearsAsync(employee.Id);

            _logger.LogInformation("Fetched {Count} leave balance years for employee {EmployeeCode}", years.Count, trimmedCode);
            return Result<MyLeaveYearsResponse>.Ok(new MyLeaveYearsResponse
            {
                Years = years
            });
        }

        private static MyLeaveBalanceResponse MapToMyResponse(LeaveBalanceSummary s)
        {
            return new MyLeaveBalanceResponse
            {
                LeaveTypeId = s.LeaveTypeId,
                LeaveTypeName = s.LeaveTypeName,
                LeaveTypeCode = s.LeaveTypeCode,
                Year = s.Year,
                AllocatedDays = s.AllocatedDays,
                UsedDays = s.UsedDays,
                PendingDays = s.PendingDays,
                AvailableDays = s.AllocatedDays - s.UsedDays - s.PendingDays
            };
        }

        private static EmployeeLeaveBalanceResponse MapToEmployeeResponse(string employeeCode, LeaveBalanceSummary s)
        {
            return new EmployeeLeaveBalanceResponse
            {
                EmployeeCode = employeeCode,
                LeaveTypeId = s.LeaveTypeId,
                LeaveTypeName = s.LeaveTypeName,
                LeaveTypeCode = s.LeaveTypeCode,
                Year = s.Year,
                AllocatedDays = s.AllocatedDays,
                UsedDays = s.UsedDays,
                PendingDays = s.PendingDays,
                AvailableDays = s.AllocatedDays - s.UsedDays - s.PendingDays
            };
        }
    }
}
