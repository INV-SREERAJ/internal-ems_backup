namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class LeaveRequestHistoryResponse
    {
        public int LeaveRequestId { get; set; }
        public List<LeaveRequestHistoryItem> History { get; set; } = new();
    }
}

