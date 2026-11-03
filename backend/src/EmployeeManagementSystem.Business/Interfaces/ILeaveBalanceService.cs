using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface ILeaveBalanceService
    {
        Task<Result<List<MyLeaveBalanceResponse>>> GetMyBalancesAsync(string employeeCode, int year);
        Task<Result<List<EmployeeLeaveBalanceResponse>>> GetEmployeeBalancesForAdminAsync(string employeeCode, int year);
        Task<Result<List<EmployeeLeaveBalanceResponse>>> GetEmployeeBalancesForManagerAsync(string managerCode, string employeeCode, int year);
        Task<Result<MyLeaveYearsResponse>> GetMyYearsAsync(string employeeCode);
    }
}
