using System;
using System.Collections.Generic;
using System.Text;

namespace EmployeeManagementSystem.DataAccess.Entities
{
    public class EmployeeLeaveBalance
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public int LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; } = null!;

        public int Year { get; set; }

        public int AllocatedDays { get; set; }
        public int UsedDays { get; set; }
        public int PendingDays { get; set; }

        //only calcuations, efcore ignores this since there is no setter
        public int AvailableDays => AllocatedDays - UsedDays - PendingDays;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public byte[] RowVersion {  get; set; } = Array.Empty<byte>();
    }
}
