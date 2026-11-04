using System.Text.Json.Serialization;

namespace EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest
{
    public class LeaveRequestResponse
    {
        public int Id { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public int LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string LeaveTypeCode { get; set; } = string.Empty;
        public int Year { get; set; }
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public int NumberOfDays { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? RejectionReason { get; set; }

        public string? ReviewedByName { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
