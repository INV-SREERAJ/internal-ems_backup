using EmployeeManagementSystem.Business.Configuration;
using EmployeeManagementSystem.Business.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

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

            <p><strong>Email:</strong> {email}</p>

            <p><strong>Temporary Password:</strong> {tempPassword}</p>

            <p>Please login and change your password immediately.</p>

            <br/>

            <p>Regards,</p>
            <p>Employee Management System</p>"
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
    }
}
