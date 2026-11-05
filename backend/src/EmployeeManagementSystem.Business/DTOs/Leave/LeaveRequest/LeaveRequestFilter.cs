namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class LeaveRequestFilter
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Search { get; set; }
        public int? LeaveTypeId { get; set; }
        public string? Status { get; set; }
        public int? Year { get; set; }
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
    }
}

