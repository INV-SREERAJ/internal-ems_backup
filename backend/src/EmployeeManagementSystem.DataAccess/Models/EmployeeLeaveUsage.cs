namespace EmployeeManagementSystem.DataAccess.Models
{
    public class EmployeeLeaveUsage
    {
        public int EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int Days { get; set; }
    }
}
