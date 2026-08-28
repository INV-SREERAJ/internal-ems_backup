
using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Common.Extensions;
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

        public AdminRepository(ApplicationDbContext context)
        {
            _context = context;
        }



        public async Task<(IEnumerable<Employee> employees, int TotalCount)> GetEmployeesAsync(EmployeeQueryParameters parameters)
        {
            var query = _context.Employees
                .AsNoTracking()
                .Include(e => e.Manager)
                .AsQueryable();

            // If admin did not explicitly request a status,
            // exclude deleted employees by default.
            if (!parameters.Status.HasValue &&
                !parameters.IncludeDeleted)
            {
                query = query.Where(
                    e => e.Status != EmployeeStatus.Deleted);
            }

            query = query
                .ApplyFilters(parameters)
                .ApplyStatusFilter(parameters.Status)
                .ApplySorting(
                    parameters.SortBy,
                    parameters.Descending);

            return await query.ToPagedResultAsync(
                parameters.PageNumber,
                parameters.PageSize);
        }


        public async Task<Employee?> GetEmployeeByEmployeeCodeAsync(string employeeCode)
        {
            return await _context.Employees.FirstOrDefaultAsync(u =>
                u.EmployeeCode == employeeCode && u.Status != EmployeeStatus.Deleted);
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