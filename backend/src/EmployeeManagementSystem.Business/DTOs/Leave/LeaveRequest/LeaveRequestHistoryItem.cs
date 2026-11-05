namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class LeaveRequestHistoryItem
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? PreviousStatus { get; set; }
        public string NewStatus { get; set; } = string.Empty;
        public string PerformedByEmployeeCode { get; set; } = string.Empty;
        public string PerformedByName { get; set; } = string.Empty;
        public DateTime PerformedAt { get; set; }
        public string? Comments { get; set; }
    }
}

