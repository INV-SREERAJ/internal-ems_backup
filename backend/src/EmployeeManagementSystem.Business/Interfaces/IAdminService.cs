using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IAdminService
    {
        Task<Result<CreateEmployeeResponse>> CreateEmployeeAsync(CreateEmployeeRequest request);

        Task<Result<PagedResponse<EmployeeListDto>>> GetEmployeesAsync(EmployeeQueryParameters parameters);
        Task<Result<bool>> UpdateEmployeeStatusAsync(string employeeCode, EmployeeStatus status, string currentEmployeeCode);

        Task<Result<EmployeeDetailsResponseDto>> GetEmployeeDetailsAsync(string employeeCode);

        Task<Result<EmployeeDetailsResponseDto>> UpdateEmployeeAsync(string employeeCode, UpdateEmployeeRequest request);

        Task<Result> DeleteEmployeeAsync(string employeeCode, string currentEmployeeCode);

        Task<Result> ChangeReportingManagerAsync(string employeeCode, string managerEmployeeCode);

        Task<Result> ResetUserPasswordAsync(string employeeCode);
    }
}
