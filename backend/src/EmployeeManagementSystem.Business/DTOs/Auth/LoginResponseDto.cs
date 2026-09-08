using System.Text.Json.Serialization;

namespace EmployeeManagementSystem.Business.DTOs.Auth
{
    public class LoginResponseDto
    {
        public bool MustChangePassword { get; set; }

        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;

        public string? AccessToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
