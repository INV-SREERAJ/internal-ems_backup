using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Profile;
using EmployeeManagementSystem.Business.DTOs.ProfileResponseDto;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace EmployeeManagementSystem.Business.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ILogger<ProfileService> _logger;
        private readonly IPasswordService _passwordService;
        private readonly IEmployeeRepository _employeeRepository;

        public ProfileService(ILogger<ProfileService> logger, IPasswordService passwordService, IEmployeeRepository employeeRepository)
        {
            _logger = logger;
            _passwordService = passwordService;
            _employeeRepository = employeeRepository;
        }

        //change password
        public async Task<Result> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordRequestDto request)
        {
            _logger.LogInformation("Changing password...");
            var employeeCode = user.FindFirst("EmployeeCode")?.Value;
            _logger.LogInformation("user : {employeeCode}", employeeCode);

            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                _logger.LogWarning("Invalid employee code : {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.Unauthorized, "Invalid user.");
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("No employee found for employee code : {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.NotFound, "User not found.");
            }

            var verification = _passwordService.VerifyPassword(request.OldPassword, employee.PasswordHash);
            if (!verification)
            {
                _logger.LogWarning("Password change for user : {employeeCode} because the entered old password is incorrect.", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Invalid password.");
            }

            if (!(request.NewPassword.Equals(request.ConfirmPassword)))
            {
                _logger.LogWarning("Change password failed due to mismatch in new password and confirm password");
                return Result.Fail(ErrorType.Conflict, "Passwords don't match!");
            }

            if (_passwordService.VerifyPassword(request.NewPassword, employee.PasswordHash))
            {
                _logger.LogWarning("Password change failed, the old password and new password was same. employeeCode : {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Old and new password cannot be the same.");
            }

            var passwordHash = _passwordService.HashPassword(request.NewPassword);
            employee.PasswordHash = passwordHash;
            employee.TokenVersion++;
            employee.MustChangePassword = false;
            await _employeeRepository.UpdateAsync(employee);

            _logger.LogInformation("Changed password for user: {employeeCode}, successfully.", employeeCode);
            return Result.Ok();
        }

        // Get profile details
        public async Task<Result<ProfileResponseDto>> GetProfileAsync(ClaimsPrincipal user)
        {
            var employeeCode = user.FindFirst("EmployeeCode")?.Value;

            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Result<ProfileResponseDto>.Fail(ErrorType.Unauthorized, "Invalid user.");
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);

            if (employee == null)
            {
                return Result<ProfileResponseDto>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            return Result<ProfileResponseDto>.Ok(new ProfileResponseDto
            {
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role,
                ManagerCode = employee.Manager?.EmployeeCode,
                CreatedAt = employee.CreatedAt
            });
        }

        // Update profile
        public async Task<Result<ProfileResponseDto>> UpdateProfileAsync(
            ClaimsPrincipal user,
            UpdateProfileRequestDto request)
        {
            var employeeCode = user.FindFirst("EmployeeCode")?.Value;

            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Result<ProfileResponseDto>.Fail(ErrorType.Unauthorized, "Invalid user.");
            }

            _logger.LogInformation(
                "Updating profile for employee {EmployeeCode}",
                employeeCode);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);

            if (employee == null)
            {
                _logger.LogWarning(
                    "Profile update failed. Employee {EmployeeCode} not found.",
                    employeeCode);

                return Result<ProfileResponseDto>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            employee.FirstName = request.FirstName;
            employee.LastName = request.LastName;
            employee.PhoneNumber = request.PhoneNumber;

            await _employeeRepository.UpdateAsync(employee);

            _logger.LogInformation(
                "Profile updated successfully for employee {EmployeeCode}",
                employee.EmployeeCode);

            return Result<ProfileResponseDto>.Ok(new ProfileResponseDto
            {
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role,
                ManagerCode = employee.Manager?.EmployeeCode,
                CreatedAt = employee.CreatedAt
            });
        }
    }
}