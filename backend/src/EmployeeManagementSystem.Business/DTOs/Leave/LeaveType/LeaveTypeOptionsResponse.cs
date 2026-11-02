namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveType
{
    public class LeaveTypeOptionsResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
