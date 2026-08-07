using EmployeeManagementSystem.Business.DTOs.EmployeeManagementSystem.Business.DTOs.Authentication;
using EmployeeManagementSystem.DataAccess.Entities;
using System.Security.Claims;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IJwtService
    {

        ClaimsPrincipal? GetPrincipalFromToken(string token);
        string GenerateAccessToken(Employee employee, DateTime expiresAt);
        string GenerateRefreshToken(Employee employee, DateTime expiresAt);
        TokenResponseDto GenerateTokenPair(Employee employee);
        bool ShouldRotateRefreshToken(string refreshToken);
        TokenResponseDto GenerateAccessTokenOnly(Employee employee);
    }
}
