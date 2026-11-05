using EmployeeManagementSystem.DataAccess.Entities.Enums;

namespace EmployeeManagementSystem.Business.Common
{
    public static class LeaveHistoryActionMapper
    {
        public static string GetAction(LeaveStatus? previous, LeaveStatus newStatus)
        {
            if (previous == null)
                return "Applied";

            if (newStatus == LeaveStatus.Approved)
                return "Approved";

            if (previous == LeaveStatus.Pending && newStatus == LeaveStatus.Rejected)
                return "Rejected";

            if (previous == LeaveStatus.Approved && newStatus == LeaveStatus.Rejected)
                return "ApprovalReversed";

            if (newStatus == LeaveStatus.Cancelled)
                return "Cancelled";

            return newStatus.ToString();
        }
    }
}

