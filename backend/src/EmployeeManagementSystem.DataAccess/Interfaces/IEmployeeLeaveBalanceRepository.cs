using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Models;

namespace EmployeeManagementSystem.DataAccess.Interfaces
{
    public interface IEmployeeLeaveBalanceRepository
    {
        Task<List<int>> GetActiveEmployeeIdsAsync();
        Task<List<EmployeeLeaveBalance>> GetByConfigurationIdAsync(int configurationId, bool trackChanges = true);
        Task<List<EmployeeLeaveUsage>> GetUsageExceedingAsync(int leaveTypeId, int year, int allocatedDays);
        Task<List<LeaveBalanceSummary>> GetSummariesAsync(int employeeId, int year);
        Task<LeaveBalanceSummary?> GetSummaryAsync(int employeeId, int leaveTypeId, int year);
        Task<List<int>> GetYearsAsync(int employeeId);
        Task AddRangeAsync(IEnumerable<EmployeeLeaveBalance> balances);
        Task<bool> SaveChangesAsync();
    }
}
