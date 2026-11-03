using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class LeaveRequestRepository : ILeaveRequestRepository
    {
        private readonly ApplicationDbContext _context;

        public LeaveRequestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> HasOverlapAsync(int employeeId, DateOnly from, DateOnly to)
        {
            return await _context.LeaveRequests
                .AnyAsync(r => r.EmployeeId == employeeId
                            && (r.Status == LeaveStatus.Pending || r.Status == LeaveStatus.Approved)
                            && r.FromDate <= to
                            && r.ToDate >= from);
        }

        public async Task AddAsync(LeaveRequest request)
        {
            await _context.LeaveRequests.AddAsync(request);
        }

        public async Task<LeaveRequest?> GetByIdWithDetailsAsync(int id, bool trackChanges = false)
        {
            var query = _context.LeaveRequests
                .Include(r => r.LeaveType)
                .Include(r => r.Employee)
                    .ThenInclude(e => e.Manager)
                .Include(r => r.ReviewedBy)
                .Include(r => r.History)
                .AsQueryable();

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
