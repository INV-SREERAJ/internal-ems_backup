using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByIdAsync(int id, bool trackChanges = true);
        Task<Employee?> GetByEmployeeCodeAsync(string employeeCode, bool trackChanges = true);
        Task<Employee?> GetByEmailAsync(string email, bool trackChanges = true);
        Task<bool> EmailExistsAsync(string email);
        Task<Employee> AddEmployeeAsync(Employee employee);
        Task UpdateAsync(Employee employee);
        Task<bool> SaveChangesAsync();

        // Consolidated query operations for Employee aggregate
        Task<(IEnumerable<Employee> Employees, int TotalCount)> GetPagedAsync(
            EmployeeQueryParameters parameters,
            int? managerId = null);

        Task<Employee?> GetAssignedEmployeeAsync(int managerId, string employeeCode);
        Task<string?> GetLastEmployeeCodeAsync(int year);
        Task<bool> HasDirectReportsAsync(int managerId);
        Task<bool> HasSubordinateManagersAsync(int managerId);
        Task<(int Total, int Active, int Inactive, Dictionary<Role, int> Roles)> GetAdminDashboardStatsAsync();
        Task<(int Total, int Active, int Inactive)> GetManagerDashboardStatsAsync(int managerId);
    }
}
