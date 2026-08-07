using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Context;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;

        public AdminRepository(ApplicationDbContext context, IEmployeeRepository employeeRepository)
        {
            _context = context;
            _employeeRepository = employeeRepository;
        }



        public async Task<(IEnumerable<Employee> employees, int TotalCount)> GetEmployeesAsync(EmployeeQueryParameters parameters)
        {
            var query = _context.Employees
                .AsNoTracking()
                .Include(e => e.Manager)
                .AsQueryable();

            // Default: exclude deleted employees
            if (parameters.Status.HasValue)
            {
                query = query.Where(e => e.Status == parameters.Status.Value);
            }
            else if (!parameters.IncludeDeleted)
            {
                query = query.Where(e => e.Status != EmployeeStatus.Deleted);
            }

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

            // Sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "name" => parameters.Descending
                    ? query.OrderByDescending(e => e.FirstName).ThenByDescending(e => e.LastName)
                    : query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName),

                "email" => parameters.Descending
                    ? query.OrderByDescending(e => e.Email)
                    : query.OrderBy(e => e.Email),

                "role" => parameters.Descending
                    ? query.OrderByDescending(e => e.Role)
                    : query.OrderBy(e => e.Role),

                "employeecode" => parameters.Descending
                    ? query.OrderByDescending(e => e.EmployeeCode)
                    : query.OrderBy(e => e.EmployeeCode),

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


        public async Task<Employee?> GetEmployeeByEmployeeCodeAsync(string employeeCode)
        {
            return await _context.Employees.FirstOrDefaultAsync(u =>
                u.EmployeeCode == employeeCode);
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


    }
}