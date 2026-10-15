using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface ILeaveTypeService
    {
        Task<Result<List<LeaveTypeResponse>>> GetAllAsync(bool activeOnly = false);

        Task<Result<LeaveTypeResponse>> GetByIdAsync(int id);
        Task<Result<LeaveTypeResponse>> CreateAsync(CreateLeaveTypeRequest request);
        Task<Result<LeaveTypeResponse>> UpdateAsync(int id, UpdateLeaveTypeRequest request);
        Task<Result<LeaveTypeResponse>> SetActiveStatusAsync(int id, bool isActive);
    }
}
