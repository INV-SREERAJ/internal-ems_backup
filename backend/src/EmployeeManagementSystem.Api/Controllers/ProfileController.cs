using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Profile;
using EmployeeManagementSystem.Business.DTOs.ProfileResponseDto;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(IProfileService profileService, ILogger<ProfileController> logger)
        {
            _profileService = profileService;
            _logger = logger;
        }

        //view profile details
        [HttpGet]
        [ProducesResponseType(typeof(ProfileResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetProfileDetails()
        {
            _logger.LogInformation("Inside GetProfileDetails in ProfileController.");
            var result = await _profileService.GetProfileAsync(User);
            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(result.Value);
        }

        //update profile
        [HttpPut]
        [ProducesResponseType(typeof(ProfileResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateProfile(UpdateProfileRequestDto request)
        {
            _logger.LogInformation("Inside UpdateProfile in ProfileController.");
            var result = await _profileService.UpdateProfileAsync(User, request);
            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(result.Value);
        }

        //change password by entering old password
        [HttpPost("change-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequestDto request)
        {
            _logger.LogInformation("Inside ChangePassword in ProfileController.");
            var result = await _profileService.ChangePasswordAsync(User, request);
            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(new
            {
                Message = "Password changed successfully."
            });
        }
    }
}
