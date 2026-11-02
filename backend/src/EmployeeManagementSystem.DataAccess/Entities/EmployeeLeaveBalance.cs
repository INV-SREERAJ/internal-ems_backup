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
        public int LeaveYearConfigurationId { get; set; }
        public LeaveYearConfiguration LeaveYearConfiguration { get; set; } = null!;

        public int AllocatedDays { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

    }
}
