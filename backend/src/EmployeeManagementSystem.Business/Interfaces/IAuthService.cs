using EmployeeManagementSystem.Business.DTOs.Auth;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
        Task<LoginResponseDto> RefreshTokenAsync();
        Task LogoutAsync();
    }
}
