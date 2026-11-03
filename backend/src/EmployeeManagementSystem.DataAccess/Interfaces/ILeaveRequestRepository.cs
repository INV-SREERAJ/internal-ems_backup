using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface ILeaveRequestRepository
    {
        Task<bool> HasOverlapAsync(int employeeId, DateOnly from, DateOnly to);
        Task AddAsync(LeaveRequest request);
        Task<LeaveRequest?> GetByIdWithDetailsAsync(int id, bool trackChanges = false);
        Task<bool> SaveChangesAsync();
    }
}
