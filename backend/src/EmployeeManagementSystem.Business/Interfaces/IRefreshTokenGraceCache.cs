using EmployeeManagementSystem.Business.DTOs.Auth;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IRefreshTokenGraceCache
    {
        LoginResponseDto? Get(string refreshToken);

        void Set(
            string refreshToken,
            LoginResponseDto response,
            TimeSpan duration);
    }
}