namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class GetLeaveCalendarQuery
    {
        public DateOnly From { get; set; }
        public DateOnly To { get; set; }
    }
}

