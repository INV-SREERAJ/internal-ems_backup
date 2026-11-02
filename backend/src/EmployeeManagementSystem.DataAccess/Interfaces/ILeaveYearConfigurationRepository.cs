using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface ILeaveYearConfigurationRepository
    {
        Task<List<LeaveYearConfiguration>> GetByYearAsync(int year);
        Task<LeaveYearConfiguration?> GetByIdAsync(int id, bool trackChanges = true);
        Task<List<LeaveYearConfiguration>> GetActiveFromYearAsync(int year);
        Task<bool> ExistsAsync(int leaveTypeId, int year);
        Task AddAsync(LeaveYearConfiguration configuration);
        void Update(LeaveYearConfiguration configuration);
        Task<bool> SaveChangesAsync();
    }
}
