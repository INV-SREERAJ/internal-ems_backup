using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class LeaveTypeRepository : ILeaveTypeRepository
    {

        private readonly ApplicationDbContext _context;

        public LeaveTypeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(LeaveType leaveType)
        {
            await _context.LeaveTypes.AddAsync(leaveType);
        }

        public async Task<bool> CodeExistsAsync(string code, int? excludeId = null)
        {

            var query = _context.LeaveTypes.Where(x => x.Code == code);

            if (excludeId.HasValue)
            {
                query = query.Where(x => x.Id !=  excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<List<LeaveType>> GetAllAsync(bool activeOnly = false)
        {
            var query = _context.LeaveTypes.AsNoTracking();

            if (activeOnly)
            {
                query = query.Where(x => x.IsActive);
            }

            return await query.OrderBy(x => x.Name)
                .ToListAsync();

        }

        public async Task<LeaveType?> GetByIdAsync(int id, bool trackChanges = true)
        {
            var query = _context.LeaveTypes.AsQueryable();

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
        {

            var query = _context.LeaveTypes.Where(x => x.Name == name);

            if (excludeId.HasValue)
            {
                query = query.Where(x => x.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        public void Update(LeaveType leaveType)
        {
            _context.LeaveTypes.Update(leaveType);
        }
    }
}
