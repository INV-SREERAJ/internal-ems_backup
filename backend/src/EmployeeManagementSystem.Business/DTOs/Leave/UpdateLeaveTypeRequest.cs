namespace EmployeeManagementSystem.Business.DTOs.Leave
{
    public class UpdateLeaveTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Code {  get; set; } = string.Empty;
        public string? Description {  get; set; }
    }
}
