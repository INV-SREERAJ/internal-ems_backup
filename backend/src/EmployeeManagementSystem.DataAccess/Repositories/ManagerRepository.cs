using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Common.Extensions;
using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class ManagerRepository : IManagerRepository
    {
        private readonly ApplicationDbContext _context;

        public ManagerRepository(ApplicationDbContext context)
        {
            _context = context;
        }


        public async Task<Employee?> GetAssignedEmployeeAsync(
            int managerId,
            string employeeCode)
        {
            return await _context.Employees
                .AsNoTracking()
                .Include(e => e.Manager)
                .FirstOrDefaultAsync(e =>
                    e.ManagerId == managerId &&
                    e.EmployeeCode == employeeCode &&
                    e.Status != EmployeeStatus.Deleted);
        }


        public async Task<
            (IEnumerable<Employee> Employees, int TotalCount)>
            GetAssignedEmployeesAsync(
                int managerId,
                EmployeeQueryParameters parameters)
        {
            var query = _context.Employees
                .AsNoTracking()
                .Include(e => e.Manager)
                .Where(e =>
                    e.ManagerId == managerId &&
                    e.Status != EmployeeStatus.Deleted);

            query = query.ApplyFilters(parameters);

            query = query.ApplyStatusFilter(parameters.Status);

            query = query.ApplySorting(
                parameters.SortBy,
                parameters.Descending);

            return await query.ToPagedResultAsync(
                parameters.PageNumber,
                parameters.PageSize);
        }


        
        public async Task<(int Total, int Active, int Inactive)> GetDashboardStatsAsync(int managerId)
        {
            var query = _context.Employees.Where(e => e.ManagerId == managerId && e.Status != EmployeeStatus.Deleted);
            
            var total = await query.CountAsync();
            var active = await query.CountAsync(e => e.Status == EmployeeStatus.Active);
            var inactive = await query.CountAsync(e => e.Status == EmployeeStatus.Inactive);
            
            return (total, active, inactive);
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
    }
}
