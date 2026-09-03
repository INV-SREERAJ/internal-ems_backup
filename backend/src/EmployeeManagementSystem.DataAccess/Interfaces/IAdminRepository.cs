
using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IAdminRepository
    {
        Task<(IEnumerable<Employee> employees, int TotalCount)> GetEmployeesAsync(EmployeeQueryParameters parameters);
        Task<string?> GetLastEmployeeCodeAsync(int year);
        Task<(int Total, int Active, int Inactive, System.Collections.Generic.Dictionary<EmployeeManagementSystem.DataAccess.Entities.Enums.Role, int> Roles)> GetDashboardStatsAsync();


    }
}

