using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByEmployeeCodeAsync(string employeeCode, bool trackChanges = true);
        Task<Employee?> GetByEmailAsync(string email, bool trackChanges = true);

        Task<Employee?> GetByIdAsync(int id, bool trackChanges = true);

        Task UpdateAsync(Employee employee);

        Task<bool> EmailExistsAsync(string email);

        Task<Employee> AddEmployeeAsync(Employee employee);
    }
}
