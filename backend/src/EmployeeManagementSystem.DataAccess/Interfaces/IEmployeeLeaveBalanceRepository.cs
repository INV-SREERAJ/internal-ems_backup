using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Models;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IEmployeeLeaveBalanceRepository
    {
        Task<List<int>> GetActiveEmployeeIdsAsync();
        Task<List<EmployeeLeaveBalance>> GetByConfigurationIdAsync(int configurationId, bool trackChanges = true);
        Task<List<EmployeeLeaveUsage>> GetUsageExceedingAsync(int leaveTypeId, int year, int allocatedDays);
        Task AddRangeAsync(IEnumerable<EmployeeLeaveBalance> balances);
        Task<bool> SaveChangesAsync();
    }
}
