namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IEmailService
    {
        Task WelcomeEmailAsync(string email, string fullName, string tempPassword);
        Task ResetPasswordEmailAsync(string email, string fullName, string tempPassword);
    }
}
