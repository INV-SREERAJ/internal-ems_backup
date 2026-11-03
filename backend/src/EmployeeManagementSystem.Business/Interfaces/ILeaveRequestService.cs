using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface ILeaveRequestService
    {
        Task<Result<LeaveRequestResponse>> ApplyAsync(string employeeCode, ApplyLeaveRequest request);
        Task<Result<LeaveRequestResponse>> GetMyRequestByIdAsync(string employeeCode, int id);
    }
}
