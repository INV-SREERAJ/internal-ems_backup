namespace EmployeeManagementSystem.DataAccess.Entities
{
    public class LeaveType
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<LeaveYearConfiguration> YearConfigurations { get; set; } = new List<LeaveYearConfiguration>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
