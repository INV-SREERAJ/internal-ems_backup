using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class LeaveYearConfigurationRepository : ILeaveYearConfigurationRepository
    {

        private readonly ApplicationDbContext _context;

        public LeaveYearConfigurationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(LeaveYearConfiguration configuration)
        {
            await _context.LeaveYearConfigurations.AddAsync(configuration);
        }

        public async Task<bool> ExistsAsync(int leaveTypeId, int year)
        {
            return await _context.LeaveYearConfigurations
            .AnyAsync(x => x.LeaveTypeId == leaveTypeId && x.Year == year);
        }

        public async Task<List<LeaveYearConfiguration>> GetAllAsync(int? year = null, bool activeOnly = false)
        {
            var query = _context.LeaveYearConfigurations
            .AsNoTracking()
            .Include(x => x.LeaveType)
            .AsQueryable();

            if (year.HasValue)
            {
                query = query.Where(x => x.Year == year.Value);
            }

            if (activeOnly)
            {
                query = query.Where(x => x.IsActive);
            }

            return await query
                .OrderByDescending(x => x.Year)
                .ThenBy(x => x.LeaveType.Name)
                .ToListAsync();
        }

        public async Task<LeaveYearConfiguration?> GetByIdAsync(int id, bool trackChanges = true)
        {
            var query = _context.LeaveYearConfigurations
            .Include(x => x.LeaveType)
            .AsQueryable();

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        public void Update(LeaveYearConfiguration configuration)
        {
            _context.LeaveYearConfigurations.Update(configuration);
        }
    }
}
