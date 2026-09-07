using System;
using System.Collections.Generic;
using System.Text;

namespace EmployeeManagementSystem.Business.DTOs.Profile
{
    public class ReportingManagerResponseDto
    {
        public string ManagerEmployeeCode { get; set; }
        public string ManagerName { get; set; }
        public string ManagerEmail { get; set; }
        public string ManagerPhonenumber { get; set; }
    }
}
