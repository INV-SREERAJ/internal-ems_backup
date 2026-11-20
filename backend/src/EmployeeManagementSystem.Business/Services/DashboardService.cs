using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Manager;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(IEmployeeRepository employeeRepository, ILogger<DashboardService> logger)
        {
            _employeeRepository = employeeRepository;
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
    }
}
