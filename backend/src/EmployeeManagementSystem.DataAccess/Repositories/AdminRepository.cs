
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
            
            //Exclude deleted employees .
            query = query.Where(e => e.Status != EmployeeStatus.Deleted);

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


        
        public async Task<(int Total, int Active, int Inactive, System.Collections.Generic.Dictionary<EmployeeManagementSystem.DataAccess.Entities.Enums.Role, int> Roles)> GetDashboardStatsAsync()
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
