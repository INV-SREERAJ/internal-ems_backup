using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Profile;
using EmployeeManagementSystem.Business.DTOs.ProfileResponseDto;
using System.Security.Claims;

namespace EmployeeManagementSystem.Business.Interfaces
{
    public interface IProfileService
    {
        Task<Result<ProfileResponseDto>> GetProfileAsync(ClaimsPrincipal user);
        Task<Result<ProfileResponseDto>> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileRequestDto request);
        Task<Result> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordRequestDto request);
    }
}
