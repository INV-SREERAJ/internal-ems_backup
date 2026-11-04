namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class ApplyLeaveRequest
    {
        public int LeaveTypeId { get; set; }
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
