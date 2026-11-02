using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface ILeaveYearConfigurationService
    {
        Task<Result<List<LeaveYearConfigurationResponse>>> GetByYearAsync(int year);
        Task<Result<LeaveYearConfigurationResponse>> GetByIdAsync(int id);
        Task<Result<LeaveYearConfigurationResponse>> CreateAsync(CreateLeaveYearConfigurationRequest request);
        Task<Result<LeaveYearConfigurationResponse>> UpdateAsync(int id, UpdateLeaveYearConfigurationRequest request);
        Task<Result<LeaveYearConfigurationResponse>> SetActiveStatusAsync(int id, bool isActive);
    }
}
