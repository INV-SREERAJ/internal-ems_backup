namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IEmailService
    {
        Task WelcomeEmailAsync(string email, string fullName, string tempPassword);
        Task ResetPasswordEmailAsync(string email, string fullName, string tempPassword);
        Task SendLeaveApplicationNotificationAsync(
            string managerEmail,
            string managerName,
            string employeeName,
            string leaveTypeName,
            DateOnly fromDate,
            DateOnly toDate,
            int numberOfDays,
            string reason,
            string reviewUrl);
        Task SendLeaveApprovedNotification(string employeeEmai, string employeeFullName, string leaveTypeName, DateOnly fromDate, DateOnly toDate, int numberOfDays);
        Task SendLeaveRejectedNotification(string employeeEmai, string employeeFullName, string leaveTypeName, DateOnly fromDate, DateOnly toDate, int numberOfDays, string rejectionReason);
    }
}
