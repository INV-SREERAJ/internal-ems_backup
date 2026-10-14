namespace EmployeeManagementSystem.DataAccess.Entities
{
    public class LeaveType
    {
        public int Id { get; set; }

        public string Name { get; set; }
        public string Code { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public byte[] RowVersion { get; set; } = Array.Empty<byte>();

        public ICollection<LeaveYearConfiguration> YearConfigurations { get; set; } = new List<LeaveYearConfiguration>();
        public ICollection<EmployeeLeaveBalance> Balances { get; set; } = new List<EmployeeLeaveBalance>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
