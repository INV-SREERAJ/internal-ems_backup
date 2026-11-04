using EmployeeManagementSystem.Business.Configuration;
using EmployeeManagementSystem.Business.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Org.BouncyCastle.Pqc.Crypto.Frodo;

namespace EmployeeManagementSystem.Business.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        //welcome mail
        public async Task WelcomeEmailAsync(string email, string fullName, string tempPassword)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _emailSettings.FromName,
                _emailSettings.FromEmail));

            message.To.Add(MailboxAddress.Parse(email));

            message.Subject = "Welcome to Employee Management System";

            message.Body = new TextPart("html")
            {
                Text = $@"
            <h2>Welcome, {fullName}!</h2>

            <p>Your account has been created successfully.</p>

            <p><strong>Temporary Password:</strong> {tempPassword}</p>

            <p>Please login and change your password immediately.</p>

            <br/>

            <p>Regards,</p>
            <p>Workforce OS</p>"
            };

            using var smtp = new SmtpClient();

            _logger.LogInformation("Sending onboarding email to {Email}", email);
            await smtp.ConnectAsync(
                _emailSettings.Host,
                _emailSettings.Port,
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password);

            await smtp.SendAsync(message);

            _logger.LogInformation("Onboarding email sent successfully to {Email}", email);

            await smtp.DisconnectAsync(true);
        }

        //reset password mail
        public async Task ResetPasswordEmailAsync(string email, string fullName, string tempPassword)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _emailSettings.FromName,
                _emailSettings.FromEmail));

            message.To.Add(MailboxAddress.Parse(email));

            message.Subject = "Password Reset";

            message.Body = new TextPart("html")
            {
                Text = $@"
            <h2>Hello, {fullName}!</h2>

            <p>Your password has been reset successfully.</p>

            <p><strong>Email:</strong> {email}</p>

            <p><strong>Temporary Password:</strong> {tempPassword}</p>

            <p>Please login and change your password immediately.</p>

            <br/>

            <p>Regards,</p>
            <p>Employee Management System</p>"
            };

            using var smtp = new SmtpClient();

            _logger.LogInformation("Sending reset password email to {Email}", email);
            await smtp.ConnectAsync(
                _emailSettings.Host,
                _emailSettings.Port,
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password);

            await smtp.SendAsync(message);

            _logger.LogInformation("Reset password email sent successfully to {Email}", email);

            await smtp.DisconnectAsync(true);
        }

        // leave application notification to manager
        public async Task SendLeaveApplicationNotificationAsync(
            string managerEmail,
            string managerName,
            string employeeName,
            string leaveTypeName,
            DateOnly fromDate,
            DateOnly toDate,
            int numberOfDays,
            string reason,
            string reviewUrl)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _emailSettings.FromName,
                _emailSettings.FromEmail));

            message.To.Add(MailboxAddress.Parse(managerEmail));

            message.Subject = $"New Leave Request - {employeeName}";

            message.Body = new TextPart("html")
            {
                Text = $@"
            <h2>Hello, {managerName}!</h2>

            <p><strong>{employeeName}</strong> has submitted a new leave request for your review.</p>

            <table style=""border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;"">
                <tr><td style=""padding: 5px 15px 5px 0;""><strong>Leave Type:</strong></td><td>{leaveTypeName}</td></tr>
                <tr><td style=""padding: 5px 15px 5px 0;""><strong>Duration:</strong></td><td>{fromDate:yyyy-MM-dd} to {toDate:yyyy-MM-dd} ({numberOfDays} working day{(numberOfDays > 1 ? "s" : "")})</td></tr>
                <tr><td style=""padding: 5px 15px 5px 0;""><strong>Reason:</strong></td><td>{reason}</td></tr>
            </table>

            <p><a href=""{reviewUrl}"" style=""background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"">Review Request</a></p>

            <br/>

            <p>Regards,</p>
            <p>Employee Management System</p>"
            };

            using var smtp = new SmtpClient();

            _logger.LogInformation("Sending leave request notification email to manager {Email}", managerEmail);
            await smtp.ConnectAsync(
                _emailSettings.Host,
                _emailSettings.Port,
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password);

            await smtp.SendAsync(message);

            _logger.LogInformation("Leave request notification email sent successfully to manager {Email}", managerEmail);

            await smtp.DisconnectAsync(true);
        }

        public async Task SendLeaveApprovedNotification(string employeeEmai, string employeeFullName, string leaveTypeName, DateOnly fromDate, DateOnly toDate, int numberOfDays)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _emailSettings.FromName,
                _emailSettings.FromEmail));

            message.To.Add(MailboxAddress.Parse(employeeEmai));

            message.Subject = $"Your Leave request has been approved ";

            message.Body = new TextPart("html")
            {
                Text = $@"
            <h2>Hello, {employeeFullName}!</h2>

            <p>Your leave request has been <strong>approved</strong> by your manager!.</p>

            <table style=""border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;"">
                <tr><td style=""padding: 5px 15px 5px 0;""><strong>Leave Type:</strong></td><td>{leaveTypeName}</td></tr>
                <tr><td style=""padding: 5px 15px 5px 0;""><strong>Duration:</strong></td><td>{fromDate:yyyy-MM-dd} to {toDate:yyyy-MM-dd} ({numberOfDays} working day{(numberOfDays > 1 ? "s" : "")})</td></tr>
                
            </table>

            <br/>

            <p>Regards,</p>
            <p>Workflow OS</p>"
            };

            using var smtp = new SmtpClient();

            _logger.LogInformation("Sending approval notification email to employee {employeefullName}", employeeFullName);
            await smtp.ConnectAsync(
                _emailSettings.Host,
                _emailSettings.Port,
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password);

            await smtp.SendAsync(message);

            _logger.LogInformation("Leave request approval email sent successfully to employee {employeefullName}", employeeFullName);

            await smtp.DisconnectAsync(true);
        }

        public async Task SendLeaveRejectedNotification(string employeeEmai, string employeeFullName, string leaveTypeName, DateOnly fromDate, DateOnly toDate, int numberOfDays, string rejectionReason)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _emailSettings.FromName,
                _emailSettings.FromEmail));

            message.To.Add(MailboxAddress.Parse(employeeEmai));

            message.Subject = $"Your Leave request has been rejected ";

            message.Body = new TextPart("html")
            {
                Text = $@"
                <h2>Hello, {employeeFullName}!</h2>

                <p>Your leave request has been <strong>rejected</strong> by your manager!.</p>

                <table style=""border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;"">
                    <tr><td style=""padding: 5px 15px 5px 0;""><strong>Leave Type:</strong></td><td>{leaveTypeName}</td></tr>
                    <tr><td style=""padding: 5px 15px 5px 0;""><strong>Duration:</strong></td><td>{fromDate:yyyy-MM-dd} to {toDate:yyyy-MM-dd} ({numberOfDays} working day{(numberOfDays > 1 ? "s" : "")})</td></tr>
                    <tr><td style=""padding: 5px 15px 5px 0;""><strong>Reason:</strong></td><td>{rejectionReason}</td></tr>
    
                </table>

                <br/>

                <p>Regards,</p>
                <p>Workflow OS</p>"
            };

            using var smtp = new SmtpClient();

            _logger.LogInformation("Sending rejection notification email to employee {employeefullName}", employeeFullName);
            await smtp.ConnectAsync(
                _emailSettings.Host,
                _emailSettings.Port,
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password);

            await smtp.SendAsync(message);

            _logger.LogInformation("Leave request rejection email sent successfully to employee {employeefullName}", employeeFullName);

            await smtp.DisconnectAsync(true);
        }
    }
}
