namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration
{
    public class LeaveYearConfigurationResponse
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public int AllocatedDays { get; set; }
        public bool IsActive { get; set; }
    }
}
