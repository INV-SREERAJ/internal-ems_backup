using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.Business.DTOs.Admin
{
    public class UpdateEmployeeStatusRequest
    {
        public EmployeeStatus Status { get; set; }
    }
}
