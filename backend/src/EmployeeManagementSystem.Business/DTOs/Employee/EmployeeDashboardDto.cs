using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.DTOs.Profile;

namespace EmployeeManagementSystem.Business.DTOs.Employee
{
    public class EmployeeDashboardDto
    {
        public List<MyLeaveBalanceResponse> Balances { get; set; } = new();
        public MyLeaveRequestListItem? LatestRequest { get; set; }
        public ReportingManagerResponseDto? Manager { get; set; }
    }
}
