using System.Collections.Generic;

namespace EmployeeManagementSystem.Business.DTOs.Admin
{
    public class AdminDashboardStatsDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveEmployees { get; set; }
        public int InactiveEmployees { get; set; }
        public Dictionary<string, int> RoleStats { get; set; } = new Dictionary<string, int>();
    }
}
