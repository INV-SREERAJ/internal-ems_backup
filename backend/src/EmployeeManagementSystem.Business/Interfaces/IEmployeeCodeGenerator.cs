using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IEmployeeCodeGenerator
    {
        Task<Result<string>> GenerateEmployeeCodeAsync(Role role);
    }
}
