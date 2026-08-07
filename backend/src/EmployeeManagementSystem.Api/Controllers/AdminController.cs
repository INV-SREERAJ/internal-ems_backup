using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        //create an employee
        [HttpPost("employees")]
        [ProducesResponseType(typeof(CreateEmployeeResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
        {
            _logger.LogInformation("Inside CreateEmployee for creation request.");
            var response = await _adminService.CreateEmployeeAsync(request);

            if (!response.Success)
                return this.ToErrorActionResult(response);

            return CreatedAtAction(
                nameof(CreateEmployee),
                new { employeeCode = response.Value?.EmployeeCode },
                response.Value);
        }

        //get all available employees
        [HttpGet("employees")]
        [ProducesResponseType(typeof(PagedResponse<EmployeeListDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployees([FromQuery] EmployeeQueryParameters parameters)
        {
            _logger.LogInformation("Inside GetEmployees.");
            var result = await _adminService.GetEmployeesAsync(parameters);

            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(result.Value);
        }

        //get employee by EmployeeCode
        [HttpGet("employees/{EmployeeCode}")]
        [ProducesResponseType(typeof(EmployeeDetailsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployee([FromRoute] string EmployeeCode)
        {
            _logger.LogInformation("Inside GetEmployee for {employeeCode}.", EmployeeCode);
            var employee = await _adminService.GetEmployeeDetailsAsync(EmployeeCode);

            if (!employee.Success)
                return this.ToErrorActionResult(employee);

            return Ok(employee.Value);
        }

        //update an employee
        [HttpPut("employees/{EmployeeCode}")]
        [ProducesResponseType(typeof(EmployeeDetailsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> EditEmployeeAsync([FromRoute] string EmployeeCode, [FromBody] UpdateEmployeeRequest request)
        {
            _logger.LogInformation("Inside EditEmployee for editing {employeeCode}.", EmployeeCode);
            var employeeDetails = await _adminService.UpdateEmployeeAsync(EmployeeCode, request);

            if (!employeeDetails.Success)
                return this.ToErrorActionResult(employeeDetails);

            return Ok(employeeDetails.Value);
        }

        //change status
        [HttpPatch("employees/{EmployeeCode}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ChangeEmployeeStatus([FromBody] UpdateEmployeeStatusRequest statusRequest, [FromRoute] string EmployeeCode)
        {
            _logger.LogInformation("Inside ChangeEmployeeStatus for {employeeCode}.", EmployeeCode);
            var currentEmployeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(currentEmployeeCode))
                return Unauthorized();

            var statusResult = await _adminService.UpdateEmployeeStatusAsync(EmployeeCode, statusRequest.Status, currentEmployeeCode);

            if (!statusResult.Success)
                return this.ToErrorActionResult(statusResult);

            if (!statusResult.Value)
            {
                return Ok(new
                {
                    Message = "The Status is already up to date"
                });
            }

            return Ok(
                new
                {
                    Message = statusRequest.Status switch
                    {
                        EmployeeStatus.Active => "Employee activated successfully.",
                        EmployeeStatus.Inactive => "Employee deactivated successfully.",
                        _ => "Employee status updated successfully."
                    }
                }
             );
        }

        //change reporting manager.
        [HttpPatch("employees/{EmployeeCode}/manager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ChangeReportingManager([FromRoute] string EmployeeCode, [FromBody] ChangeReportingManagerRequest managerEmployeeCode)
        {
            _logger.LogInformation("Inside ChangeReportingManager for {employeeCode}.", EmployeeCode);
            var result = await _adminService.ChangeReportingManagerAsync(EmployeeCode, managerEmployeeCode.ManagerEmployeeCode);

            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(
                new
                {
                    Message = "Reporting manager has been successfully changed"
                }
            );
        }

        //soft delete an employee
        [HttpDelete("employees/{EmployeeCode}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteEmployee([FromRoute] string EmployeeCode)
        {
            _logger.LogInformation("Inside DeleteEmployee for {employeeCode}", EmployeeCode);
            var currEmployeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(currEmployeeCode))
                return Unauthorized();

            var result = await _adminService.DeleteEmployeeAsync(EmployeeCode, currEmployeeCode);

            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(
                new
                {
                    Message = "User Deleted Successfully!"
                }
            );
        }

        //reset password and send email
        [HttpPost("employees/{employeeCode}/reset-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ResetPassword(string employeeCode)
        {
            _logger.LogInformation("Inside ResetPassword for {employeeCode}.", employeeCode);
            var result = await _adminService.ResetUserPasswordAsync(employeeCode);

            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok("The password for the user has been reset.");
        }
    }
}