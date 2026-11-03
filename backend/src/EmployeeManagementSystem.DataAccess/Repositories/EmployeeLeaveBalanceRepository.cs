using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using EmployeeManagementSystem.DataAccess.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class EmployeeLeaveBalanceRepository : IEmployeeLeaveBalanceRepository
    {
        private readonly ApplicationDbContext _context;

        public EmployeeLeaveBalanceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<int>> GetActiveEmployeeIdsAsync()
        {
            // CHANGE HERE if only Role == Role.Employee should get balances
            return await _context.Employees
                .AsNoTracking()
                .Where(e => e.Status == EmployeeStatus.Active)
                .Select(e => e.Id)
                .ToListAsync();
        }

        public async Task<List<EmployeeLeaveBalance>> GetByConfigurationIdAsync(int configurationId, bool trackChanges = true)
        {
            var query = _context.EmployeeLeaveBalances
                .Where(b => b.LeaveYearConfigurationId == configurationId);

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query.ToListAsync();
        }

        public async Task<List<EmployeeLeaveUsage>> GetUsageExceedingAsync(int leaveTypeId, int year, int allocatedDays)
        {
            var startDate = new DateOnly(year, 1, 1);
            var endDate = new DateOnly(year, 12, 31);

            return await _context.LeaveRequests
                .Where(r => r.LeaveTypeId == leaveTypeId
                         && r.FromDate >= startDate
                         && r.FromDate <= endDate
                         && (r.Status == LeaveStatus.Pending || r.Status == LeaveStatus.Approved))
                .GroupBy(r => r.EmployeeId)
                .Select(g => new
                {
                    EmployeeId = g.Key,
                    Days = g.Sum(r => r.NumberOfDays)
                })
                .Where(x => x.Days > allocatedDays)
                .Join(_context.Employees,
                    u => u.EmployeeId,
                    e => e.Id,
                    (u, e) => new EmployeeLeaveUsage
                    {
                        EmployeeId = u.EmployeeId,
                        EmployeeCode = e.EmployeeCode,
                        FullName = (e.FirstName + " " + e.LastName).Trim(),
                        Days = u.Days
                    })
                .ToListAsync();
        }

        public async Task<List<LeaveBalanceSummary>> GetSummariesAsync(int employeeId, int year)
        {
            var startDate = new DateOnly(year, 1, 1);
            var endDate = new DateOnly(year, 12, 31);

            return await _context.EmployeeLeaveBalances
                .AsNoTracking()
                .Where(b => b.EmployeeId == employeeId && b.LeaveYearConfiguration.Year == year)
                .Select(b => new LeaveBalanceSummary
                {
                    EmployeeId = b.EmployeeId,
                    LeaveTypeId = b.LeaveYearConfiguration.LeaveTypeId,
                    LeaveTypeName = b.LeaveYearConfiguration.LeaveType.Name,
                    LeaveTypeCode = b.LeaveYearConfiguration.LeaveType.Code,
                    Year = b.LeaveYearConfiguration.Year,
                    AllocatedDays = b.AllocatedDays,
                    UsedDays = _context.LeaveRequests
                        .Where(r => r.EmployeeId == employeeId
                                 && r.LeaveTypeId == b.LeaveYearConfiguration.LeaveTypeId
                                 && r.FromDate >= startDate
                                 && r.FromDate <= endDate
                                 && r.Status == LeaveStatus.Approved)
                        .Sum(r => (int?)r.NumberOfDays) ?? 0,
                    PendingDays = _context.LeaveRequests
                        .Where(r => r.EmployeeId == employeeId
                                 && r.LeaveTypeId == b.LeaveYearConfiguration.LeaveTypeId
                                 && r.FromDate >= startDate
                                 && r.FromDate <= endDate
                                 && r.Status == LeaveStatus.Pending)
                        .Sum(r => (int?)r.NumberOfDays) ?? 0
                })
                .OrderBy(s => s.LeaveTypeName)
                .ToListAsync();
        }

        public async Task<LeaveBalanceSummary?> GetSummaryAsync(int employeeId, int leaveTypeId, int year)
        {
            var startDate = new DateOnly(year, 1, 1);
            var endDate = new DateOnly(year, 12, 31);

            return await _context.EmployeeLeaveBalances
                .AsNoTracking()
                .Where(b => b.EmployeeId == employeeId
                         && b.LeaveYearConfiguration.LeaveTypeId == leaveTypeId
                         && b.LeaveYearConfiguration.Year == year)
                .Select(b => new LeaveBalanceSummary
                {
                    EmployeeId = b.EmployeeId,
                    LeaveTypeId = b.LeaveYearConfiguration.LeaveTypeId,
                    LeaveTypeName = b.LeaveYearConfiguration.LeaveType.Name,
                    LeaveTypeCode = b.LeaveYearConfiguration.LeaveType.Code,
                    Year = b.LeaveYearConfiguration.Year,
                    AllocatedDays = b.AllocatedDays,
                    UsedDays = _context.LeaveRequests
                        .Where(r => r.EmployeeId == employeeId
                                 && r.LeaveTypeId == leaveTypeId
                                 && r.FromDate >= startDate
                                 && r.FromDate <= endDate
                                 && r.Status == LeaveStatus.Approved)
                        .Sum(r => (int?)r.NumberOfDays) ?? 0,
                    PendingDays = _context.LeaveRequests
                        .Where(r => r.EmployeeId == employeeId
                                 && r.LeaveTypeId == leaveTypeId
                                 && r.FromDate >= startDate
                                 && r.FromDate <= endDate
                                 && r.Status == LeaveStatus.Pending)
                        .Sum(r => (int?)r.NumberOfDays) ?? 0
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<int>> GetYearsAsync(int employeeId)
        {
            return await _context.EmployeeLeaveBalances
                .AsNoTracking()
                .Where(b => b.EmployeeId == employeeId)
                .Select(b => b.LeaveYearConfiguration.Year)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();
        }

        public async Task AddRangeAsync(IEnumerable<EmployeeLeaveBalance> balances)
        {
            await _context.EmployeeLeaveBalances.AddRangeAsync(balances);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
