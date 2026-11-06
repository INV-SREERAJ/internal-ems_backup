using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface ILeaveRequestRepository
    {
        Task<bool> HasOverlapAsync(int employeeId, DateOnly from, DateOnly to);
        Task AddAsync(LeaveRequest request);
        Task<LeaveRequest?> GetByIdWithDetailsAsync(int id, bool trackChanges = false);
        Task<bool> SaveChangesAsync();
        Task<bool> TryTransitionAsync(
            int id,
            LeaveStatus allowedFrom,
            LeaveStatus newStatus,
            int? reviewedById,
            DateTime? reviewedAt,
            string? rejectionReason,
            LeaveRequestHistory history
        );
        Task<(List<LeaveRequest> Items, int TotalCount)> GetPagedAsync(LeaveRequestQuery q);
        Task<List<LeaveRequestHistory>> GetHistoryAsync(int leaveRequestId);
        Task<List<LeaveRequest>> GetApprovedInRangeAsync(DateOnly from, DateOnly to, int? employeeId, int? managerId);
    }
}
