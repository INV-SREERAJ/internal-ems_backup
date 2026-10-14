using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.DataAccess.Entities
{
    // Insert-only audit trail. Rows are never updated or deleted.
    public class LeaveRequestHistory
    {
        public int Id { get; set; }

        public int LeaveRequestId { get; set; }
        public LeaveRequest LeaveRequest { get; set; } = null!;

        // null for the first "Applied" entry
        public LeaveStatus? PreviousStatus { get; set; }
        public LeaveStatus NewStatus { get; set; }

        public LeaveAction Action { get; set; }

        public int PerformedById { get; set; }
        public Employee PerformedBy { get; set; } = null!;

        public DateTime PerformedAt { get; set; }

        // rejection reason or approval note
        public string? Comments { get; set; }
    }
}
