using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface ILeaveYearConfigurationRepository
    {
        Task<List<LeaveYearConfiguration>> GetAllAsync(int? year = null, bool activeOnly = false);
        Task<LeaveYearConfiguration?> GetByIdAsync(int id, bool trackChanges = true);
        Task<bool> ExistsAsync(int leaveTypeId, int year);
        Task AddAsync(LeaveYearConfiguration configuration);
        void Update(LeaveYearConfiguration configuration);
        Task<bool> SaveChangesAsync();
    }
}
