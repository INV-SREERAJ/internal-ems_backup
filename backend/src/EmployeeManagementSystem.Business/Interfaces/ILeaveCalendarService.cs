using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface ILeaveCalendarService
    {
        Task<Result<List<LeaveCalendarItem>>> GetCalendarAsync(string callerCode, string role, GetLeaveCalendarQuery query);
    }
}

