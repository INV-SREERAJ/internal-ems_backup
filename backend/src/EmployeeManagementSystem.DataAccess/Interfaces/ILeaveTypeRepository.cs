using EmployeeManagementSystem.DataAccess.Entities;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface ILeaveTypeRepository
    {
        Task<List<LeaveType>> GetAllAsync(bool activeOnly = false);
        Task<LeaveType?> GetByIdAsync(int id, bool trackChanges = true);
        Task<bool> NameExistsAsync(string name, int? excludeId = null);
        Task<bool> CodeExistsAsync(string code, int? excludeId = null);
        Task AddAsync(LeaveType leaveType);
        void Update(LeaveType leaveType);
        Task<bool> SaveChangesAsync();
    }
}
