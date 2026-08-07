namespace EmployeeManagementSystem.Business.DTOs
{
    namespace EmployeeManagementSystem.Business.DTOs.Authentication
    {
        public class TokenResponseDto
        {
            public string AccessToken { get; set; } = string.Empty;

            public string RefreshToken { get; set; } = string.Empty;

            public DateTime AccessTokenExpiresAt { get; set; }

            public DateTime RefreshTokenExpiresAt { get; set; }
        }
    }
}
