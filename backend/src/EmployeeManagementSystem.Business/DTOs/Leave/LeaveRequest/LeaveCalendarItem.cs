namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class LeaveCalendarItem
    {
        public int LeaveRequestId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string LeaveTypeCode { get; set; } = string.Empty;
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public int NumberOfDays { get; set; }
    }
}

