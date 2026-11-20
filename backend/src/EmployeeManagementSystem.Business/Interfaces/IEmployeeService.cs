using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IEmployeeService
    {
        Task<Result<PagedResponse<EmployeeListDto>>> GetEmployeesAsync(EmployeeQueryParameters parameters, string? managerCode = null);
        Task<Result<EmployeeDetailsResponseDto>> GetEmployeeDetailsAsync(string employeeCode, string? managerCode = null);
        Task<Result<CreateEmployeeResponse>> CreateEmployeeAsync(CreateEmployeeRequest request);
        Task<Result<EmployeeDetailsResponseDto>> UpdateEmployeeAsync(string employeeCode, UpdateEmployeeRequest request);
        Task<Result<bool>> UpdateEmployeeStatusAsync(string employeeCode, EmployeeStatus status, string currentEmployeeCode);
        Task<Result> DeleteEmployeeAsync(string employeeCode, string currentEmployeeCode);
        Task<Result> ChangeReportingManagerAsync(string employeeCode, string managerEmployeeCode);
        Task<Result> ResetUserPasswordAsync(string employeeCode);
    }
}
