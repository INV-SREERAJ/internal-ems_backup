using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Manager;
using EmployeeManagementSystem.DataAccess.Common;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IManagerService
    {
        Task<Result<PagedResponse<EmployeeListDto>>> GetAssignedEmployeesAsync(string managerCode, EmployeeQueryParameters employeeQueryParameters);
        Task<Result<EmployeeDetailsResponseDto>> GetAssignedEmployeeAsync(string managerCode, string employeeCode);
        Task<Result<ManagerDashboardStatsDto>> GetDashboardStatsAsync(string managerCode);
    }
}


