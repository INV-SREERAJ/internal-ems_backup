using EmployeeManagementSystem.DataAccess.common;
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
                int id, LeaveStatus allowedFrom, LeaveStatus newStatus,
                int? reviewedById, DateTime? reviewedAt, string? rejectionReason,
                LeaveRequestHistory history
        )
        {
            await using var tx = await _context.Database.BeginTransactionAsync();

            var now = history.PerformedAt;
            var rows = await _context.LeaveRequests
                .Where(r => r.Id == id && r.Status == allowedFrom)
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
        public async Task<(List<LeaveRequest> Items, int TotalCount)> GetPagedAsync(LeaveRequestQuery q)
        {
            var query = _context.LeaveRequests
                .AsNoTracking()
                .Include(r => r.LeaveType)
                .Include(r => r.Employee)
                .AsQueryable();

            if (q.EmployeeId.HasValue)
                query = query.Where(r => r.EmployeeId == q.EmployeeId.Value);

            if (q.ManagerId.HasValue)
                query = query.Where(r => r.Employee.ManagerId == q.ManagerId.Value);

            if (!string.IsNullOrWhiteSpace(q.EmployeeCode))
                query = query.Where(r => r.Employee.EmployeeCode == q.EmployeeCode);

            if (q.LeaveTypeId.HasValue)
                query = query.Where(r => r.LeaveTypeId == q.LeaveTypeId.Value);

            if (q.Status.HasValue)
                query = query.Where(r => r.Status == q.Status.Value);

            if (q.Year.HasValue)
            {
                var start = new DateOnly(q.Year.Value, 1, 1);
                var end = new DateOnly(q.Year.Value, 12, 31);
                query = query.Where(r => r.FromDate >= start && r.FromDate <= end);   // year = FromDate's year
            }

            // overlap logic: either bound may be sent alone
            if (q.FromDate.HasValue)
                query = query.Where(r => r.ToDate >= q.FromDate.Value);
            if (q.ToDate.HasValue)
                query = query.Where(r => r.FromDate <= q.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(q.Search))
            {
                var s = q.Search.Trim();
                query = query.Where(r =>
                    r.Reason.Contains(s) ||
                    r.LeaveType.Name.Contains(s) ||
                    r.LeaveType.Code.Contains(s));
                // manager and admin lists will also match employee code and name here
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.Id)
                .Skip((q.Page - 1) * q.PageSize)
                .Take(q.PageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<List<LeaveRequestHistory>> GetHistoryAsync(int leaveRequestId)
        {
            return await _context.LeaveRequestHistories
                .AsNoTracking()
                .Include(h => h.PerformedBy)
                .Where(h => h.LeaveRequestId == leaveRequestId)
                .OrderBy(h => h.PerformedAt)
                .ThenBy(h => h.Id)
                .ToListAsync();
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

