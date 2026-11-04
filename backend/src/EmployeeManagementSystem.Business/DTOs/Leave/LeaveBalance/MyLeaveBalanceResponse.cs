namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance
{
    public class MyLeaveBalanceResponse
    {
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string LeaveTypeCode { get; set; } = string.Empty;
        public int Year { get; set; }
        public int AllocatedDays { get; set; }
        public int UsedDays { get; set; }
        public int PendingDays { get; set; }
        public int AvailableDays { get; set; }
    }
}
