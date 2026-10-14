using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.DataAccess.Entities
{
    public class LeaveRequest
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;

        public int LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; } = null!;

        // year of FromDate (a request cannot cross a year boundary)
        public int Year { get; set; }

        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }

        // working days (weekends excluded), calculated by the server
        public int NumberOfDays { get; set; }

        public string Reason { get; set; } = string.Empty;

        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        // required when Status is Rejected
        public string? RejectionReason { get; set; }

        // manager or admin who approved / rejected the request
        public int? ReviewedById { get; set; }
        public Employee? ReviewedBy { get; set; }
        public DateTime? ReviewedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // row version for concurrency handling
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();

        public ICollection<LeaveRequestHistory> History { get; set; } = new List<LeaveRequestHistory>();

    }
}
