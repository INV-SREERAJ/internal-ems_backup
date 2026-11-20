using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Employee;
using EmployeeManagementSystem.Business.DTOs.Manager;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IDashboardService
    {
        Task<Result<AdminDashboardStatsDto>> GetAdminDashboardStatsAsync();
        Task<Result<ManagerDashboardStatsDto>> GetManagerDashboardStatsAsync(string managerCode);
        Task<Result<EmployeeDashboardDto>> GetEmployeeDashboardAsync(string employeeCode);
    }
}
