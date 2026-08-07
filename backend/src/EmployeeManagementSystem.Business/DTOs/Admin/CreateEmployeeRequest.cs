
using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.Business.DTOs.Admin
{
    public class CreateEmployeeRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; }
        public string Email { get; set; }
        public Role Role { get; set; }
        public string? ManagerEmployeeCode { get; set; }

        public string PhoneNumber { get; set; }
    }
}
