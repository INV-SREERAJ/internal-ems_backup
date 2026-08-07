
using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IAdminRepository
    {
        Task<(IEnumerable<Employee> employees, int TotalCount)> GetEmployeesAsync(EmployeeQueryParameters parameters);


        Task<Employee?> GetEmployeeByEmployeeCodeAsync(string employeeCode);

        //enable/disable feature in admin

        Task<string?> GetLastEmployeeCodeAsync(int year);


    }
}
