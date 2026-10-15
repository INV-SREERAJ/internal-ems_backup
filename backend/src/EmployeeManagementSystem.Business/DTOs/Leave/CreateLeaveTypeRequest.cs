namespace EmployeeManagementSystem.Business.DTOs.Leave
{
    public class CreateLeaveTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
