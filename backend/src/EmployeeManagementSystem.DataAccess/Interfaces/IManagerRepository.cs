using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IManagerRepository
    {
        Task<(IEnumerable<Employee> Employees, int TotalCount)> GetAssignedEmployeesAsync(int managerId, EmployeeQueryParameters parameters);
        Task<Employee?> GetAssignedEmployeeAsync(int managerId, string employeeCode);
        Task<bool> HasActiveDirectReportsAsync(int managerId);
        Task<(int Total, int Active, int Inactive)> GetDashboardStatsAsync(int managerId);
    }
}

