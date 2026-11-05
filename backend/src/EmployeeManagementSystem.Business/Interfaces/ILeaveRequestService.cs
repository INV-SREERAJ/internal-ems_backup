using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface ILeaveRequestService
    {
        Task<Result<LeaveRequestResponse>> ApplyAsync(string employeeCode, ApplyLeaveRequest request);
        Task<Result<LeaveRequestResponse>> GetMyRequestByIdAsync(string employeeCode, int id);
        Task<Result<LeaveRequestResponse>> CancelAsync(string employeeCode, int id);
        Task<Result<LeaveRequestResponse>> ApproveAsManagerAsync(string managerCode, int id);
        Task<Result<LeaveRequestResponse>> RejectAsManagerAsync(string managerCode, int id, RejectLeaveRequest request);
        Task<Result<LeaveRequestResponse>> ApproveAsAdminAsync(string adminCode, int id);
        Task<Result<LeaveRequestResponse>> RejectAsAdminAsync(string adminCode, int id, RejectLeaveRequest request);
        Task<Result<PagedResponse<MyLeaveRequestListItem>>> GetMyRequestsAsync(string employeeCode, LeaveRequestFilter filter);
        Task<Result<LeaveRequestHistoryResponse>> GetMyHistoryAsync(string employeeCode, int id);
        Task<Result<LeaveRequestHistoryResponse>> GetManagerHistoryAsync(string managerCode, int id);
        Task<Result<LeaveRequestHistoryResponse>> GetAdminHistoryAsync(int id);
    }
}
