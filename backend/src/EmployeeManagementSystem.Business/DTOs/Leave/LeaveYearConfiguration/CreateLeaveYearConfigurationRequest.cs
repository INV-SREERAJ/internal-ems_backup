namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration
{
    public class CreateLeaveYearConfigurationRequest
    {
        public int Year { get; set; }
        public int LeaveTypeId { get; set; }
        public int AllocatedDays { get; set; }
    }
}
