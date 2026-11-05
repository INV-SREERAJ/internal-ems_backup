using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.DataAccess.common
{
    // DataAccess/Models/LeaveRequestQuery.cs (plain data holder, not a DTO)
    public class LeaveRequestQuery
    {
        public int? EmployeeId { get; set; }        // my list: the caller. Admin: null
        public int? ManagerId { get; set; }         // manager list: the team scope. Others: null
        public string? EmployeeCode { get; set; }   // manager and admin filters, unused by my list
        public string? Search { get; set; }
        public int? LeaveTypeId { get; set; }
        public LeaveStatus? Status { get; set; }
        public int? Year { get; set; }
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
