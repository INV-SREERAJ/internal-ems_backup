using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Common.Extensions;
using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly ApplicationDbContext _context;

        public EmployeeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Employee> AddEmployeeAsync(Employee employee)
        {
            await _context.Employees.AddAsync(employee);
            return employee;
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Employees
                .AnyAsync(e => e.Email == email && e.Status != EmployeeStatus.Deleted);
        }

        public async Task<Employee?> GetByEmailAsync(string email, bool trackChanges = true)
        {
            var query = _context.Employees.AsQueryable();
            if (!trackChanges) query = query.AsNoTracking();

            return await query.FirstOrDefaultAsync(e =>
                e.Email == email &&
                e.Status != EmployeeStatus.Deleted);
        }

        public async Task<Employee?> GetByEmployeeCodeAsync(string employeeCode, bool trackChanges = true)
        {
            var query = _context.Employees.Include(e => e.Manager).AsQueryable();
            if (!trackChanges) query = query.AsNoTracking();

            return await query.FirstOrDefaultAsync(e =>
                e.EmployeeCode == employeeCode && e.Status != EmployeeStatus.Deleted);
        }

        public async Task<Employee?> GetByIdAsync(int id, bool trackChanges = true)
        {
            var query = _context.Employees.AsQueryable();
            if (!trackChanges) query = query.AsNoTracking();

            return await query.FirstOrDefaultAsync(e =>
                e.Id == id &&
                e.Status != EmployeeStatus.Deleted);
        }

        public async Task UpdateAsync(Employee employee)
        {
            await _context.SaveChangesAsync();
        }

        public async Task<bool> SaveChangesAsync() => await _context.SaveChangesAsync() > 0;

        public async Task<(IEnumerable<Employee> Employees, int TotalCount)> GetPagedAsync(
            EmployeeQueryParameters parameters,
            int? managerId = null)
        {
            var query = _context.Employees
                .AsNoTracking()
                .Include(e => e.Manager)
                .Where(e => e.Status != EmployeeStatus.Deleted);

            if (managerId.HasValue)
            {
                query = query.Where(e => e.ManagerId == managerId.Value);
            }

            query = query
                .ApplyFilters(parameters)
                .ApplyStatusFilter(parameters.Status)
                .ApplySorting(parameters.SortBy, parameters.Descending);

            return await query.ToPagedResultAsync(parameters.PageNumber, parameters.PageSize);
        }

        public async Task<Employee?> GetAssignedEmployeeAsync(int managerId, string employeeCode)
        {
            return await _context.Employees
                .AsNoTracking()
                .Include(e => e.Manager)
                .FirstOrDefaultAsync(e =>
                    e.ManagerId == managerId &&
                    e.EmployeeCode == employeeCode &&
                    e.Status != EmployeeStatus.Deleted);
        }

        public async Task<string?> GetLastEmployeeCodeAsync(int year)
        {
            string pattern = $"EMP{year}";

            return await _context.Employees
                .Where(e => e.EmployeeCode.StartsWith(pattern))
                .OrderByDescending(e => e.EmployeeCode)
                .Select(e => e.EmployeeCode)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> HasDirectReportsAsync(int managerId)
        {
            return await _context.Employees.AnyAsync(e =>
                e.ManagerId == managerId &&
                e.Status != EmployeeStatus.Deleted);
        }

        public async Task<bool> HasSubordinateManagersAsync(int managerId)
        {
            return await _context.Employees
                .AnyAsync(e => e.ManagerId == managerId && e.Role == Role.Manager && e.Status != EmployeeStatus.Deleted);
        }

        public async Task<(int Total, int Active, int Inactive, Dictionary<Role, int> Roles)> GetAdminDashboardStatsAsync()
        {
            var query = _context.Employees.Where(e => e.Status != EmployeeStatus.Deleted);

            var total = await query.CountAsync();
            var active = await query.CountAsync(e => e.Status == EmployeeStatus.Active);
            var inactive = await query.CountAsync(e => e.Status == EmployeeStatus.Inactive);

            var roles = await query.GroupBy(e => e.Role)
                .Select(g => new { Role = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Role, x => x.Count);

            return (total, active, inactive, roles);
        }

        public async Task<(int Total, int Active, int Inactive)> GetManagerDashboardStatsAsync(int managerId)
        {
            var query = _context.Employees.Where(e => e.ManagerId == managerId && e.Status != EmployeeStatus.Deleted);

            var total = await query.CountAsync();
            var active = await query.CountAsync(e => e.Status == EmployeeStatus.Active);
            var inactive = await query.CountAsync(e => e.Status == EmployeeStatus.Inactive);

            return (total, active, inactive);
        }
    }
}
