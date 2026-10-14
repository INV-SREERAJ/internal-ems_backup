using System;
using System.Collections.Generic;
using System.Text;

namespace EmployeeManagementSystem.DataAccess.Entities
{
    public class LeaveYearConfiguration
    {   
        public int Id { get; set; }

        public int LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; }
        public int Year {  get; set; }
        public int AllocatedDays { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    }
}
