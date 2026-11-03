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

        public async Task<bool> TryTransitionAsync(
                int id, LeaveStatus[] allowedFrom, LeaveStatus newStatus,
                int? reviewedById, DateTime? reviewedAt, string? rejectionReason,
                LeaveRequestHistory history
        )
        {
            await using var tx = await _context.Database.BeginTransactionAsync();

            var now = history.PerformedAt;
            var rows = await _context.LeaveRequests
                .Where(r => r.Id == id && allowedFrom.Contains(r.Status))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.Status, newStatus)
                    .SetProperty(r => r.ReviewedById, reviewedById)
                    .SetProperty(r => r.ReviewedAt, reviewedAt)
                    .SetProperty(r => r.RejectionReason, rejectionReason)
                    .SetProperty(r => r.UpdatedAt, now));

            if (rows == 0)
                return false;                       // nothing changed; disposing the transaction rolls back

            history.LeaveRequestId = id;
            _context.LeaveRequestHistories.Add(history);   // use your real DbSet name
            await _context.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
