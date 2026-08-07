using EmployeeManagementSystem.DataAccess.common;
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

        public async Task<(IEnumerable<Employee> employees, int TotalCount)> GetAssignedEmployeesAsync(int managerId, EmployeeQueryParameters parameters)
        {
            var query = _context.Employees
                .AsNoTracking()
                .Where(e => e.ManagerId == managerId && e.Status != EmployeeStatus.Deleted)
                .Include(e => e.Manager)
                .AsQueryable();

            // Search
            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var search = parameters.Search.Trim();

                query = query.Where(e =>
                    e.EmployeeCode.Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search) ||
                    e.Email.Contains(search));
            }

            // Filter by Role
            if (!string.IsNullOrWhiteSpace(parameters.Role) &&
                Enum.TryParse<Role>(parameters.Role, true, out var role))
            {
                query = query.Where(e => e.Role == role);
            }

            // Filter by Status
            if (parameters.Status.HasValue)
            {
                query = query.Where(e => e.Status == parameters.Status.Value);
            }

            // Sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "name" => parameters.Descending
                    ? query.OrderByDescending(e => e.FirstName).ThenByDescending(e => e.LastName)
                    : query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName),

                "email" => parameters.Descending
                    ? query.OrderByDescending(e => e.Email)
                    : query.OrderBy(e => e.Email),

                "employeecode" => parameters.Descending
                    ? query.OrderByDescending(e => e.EmployeeCode)
                    : query.OrderBy(e => e.EmployeeCode),

                "role" => parameters.Descending
                    ? query.OrderByDescending(e => e.Role)
                    : query.OrderBy(e => e.Role),

                "createdat" => parameters.Descending
                    ? query.OrderByDescending(e => e.CreatedAt)
                    : query.OrderBy(e => e.CreatedAt),

                _ => query.OrderBy(e => e.Id)
            };

            var totalCount = await query.CountAsync();

            var employees = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            return (employees, totalCount);
        }

        // a simple check to see if there is any employees report to a manager
        public async Task<bool> HasActiveDirectReportsAsync(int managerId)
        {
            return await _context.Employees.AnyAsync(e =>
                e.ManagerId == managerId && e.Status != EmployeeStatus.Deleted);
        }

    }
}
