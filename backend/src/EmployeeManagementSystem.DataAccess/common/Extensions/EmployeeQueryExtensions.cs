using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.DataAccess.Common.Extensions
{
    public static class EmployeeQueryExtensions
    {
        public static IQueryable<Employee> ApplyFilters(
            this IQueryable<Employee> query,
            EmployeeQueryParameters parameters)
        {
            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var search = parameters.Search.Trim();

                query = query.Where(e =>
                    e.EmployeeCode.Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search) ||
                    (e.FirstName + " " + e.LastName).Contains(search) ||
                    e.Email.Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(parameters.Role) &&
                Enum.TryParse<Role>(
                    parameters.Role,
                    true,
                    out var role))
            {
                query = query.Where(e => e.Role == role);
            }

            return query;
        }


        public static IQueryable<Employee> ApplyStatusFilter(
            this IQueryable<Employee> query,
            EmployeeStatus? status)
        {
            if (status.HasValue)
            {
                query = query.Where(
                    e => e.Status == status.Value);
            }

            return query;
        }


        public static IQueryable<Employee> ApplySorting(
            this IQueryable<Employee> query,
            string? sortBy,
            bool descending)
        {
            return sortBy?.ToLower() switch
            {
                "name" => descending
                    ? query.OrderByDescending(e => e.FirstName)
                           .ThenByDescending(e => e.LastName)
                    : query.OrderBy(e => e.FirstName)
                           .ThenBy(e => e.LastName),

                "email" => descending
                    ? query.OrderByDescending(e => e.Email)
                    : query.OrderBy(e => e.Email),

                "employeecode" => descending
                    ? query.OrderByDescending(e => e.EmployeeCode)
                    : query.OrderBy(e => e.EmployeeCode),

                "role" => descending
                    ? query.OrderByDescending(e => e.Role)
                    : query.OrderBy(e => e.Role),

                "createdat" => descending
                    ? query.OrderByDescending(e => e.CreatedAt)
                    : query.OrderBy(e => e.CreatedAt),

                _ => query.OrderBy(e => e.Id)
            };
        }


        public static async Task<
            (IEnumerable<Employee> Employees, int TotalCount)>
            ToPagedResultAsync(
                this IQueryable<Employee> query,
                int pageNumber,
                int pageSize)
        {
            var totalCount = await query.CountAsync();

            var employees = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (employees, totalCount);
        }
    }
}