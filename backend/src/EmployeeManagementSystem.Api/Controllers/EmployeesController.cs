using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/employees")]
    [Route("api/admin/employees")]   // Legacy route compatibility
    [Route("api/manager/employees")] // Legacy route compatibility
    [Authorize]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(IEmployeeService employeeService, ILogger<EmployeesController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(PagedResponse<EmployeeListDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployees([FromQuery] EmployeeQueryParameters parameters)
        {
            _logger.LogInformation("GET /api/employees initiated.");
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            var isOnlyManager = User.IsInRole("Manager") && !User.IsInRole("Admin");

            // If caller is Manager, only show their direct reports. Admin sees all.
            var managerCode = isOnlyManager ? callerCode : null;

            var result = await _employeeService.GetEmployeesAsync(parameters, managerCode);
            return result.Success ? Ok(result.Value) : this.ToErrorActionResult(result);
        }

        [HttpGet("{employeeCode}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(EmployeeDetailsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetEmployee(string employeeCode)
        {
            _logger.LogInformation("GET /api/employees/{EmployeeCode} initiated.", employeeCode);
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            var isOnlyManager = User.IsInRole("Manager") && !User.IsInRole("Admin");

            var managerCode = isOnlyManager ? callerCode : null;

            var result = await _employeeService.GetEmployeeDetailsAsync(employeeCode, managerCode);
            return result.Success ? Ok(result.Value) : this.ToErrorActionResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(CreateEmployeeResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
        {
            _logger.LogInformation("POST /api/employees initiated.");
            var response = await _employeeService.CreateEmployeeAsync(request);

            if (!response.Success)
                return this.ToErrorActionResult(response);

            return CreatedAtAction(
                nameof(GetEmployee),
                new { employeeCode = response.Value?.EmployeeCode },
                response.Value);
        }

        [HttpPut("{employeeCode}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(EmployeeDetailsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateEmployee([FromRoute] string employeeCode, [FromBody] UpdateEmployeeRequest request)
        {
            _logger.LogInformation("PUT /api/employees/{EmployeeCode} initiated.", employeeCode);
            var result = await _employeeService.UpdateEmployeeAsync(employeeCode, request);
            return result.Success ? Ok(result.Value) : this.ToErrorActionResult(result);
        }

        [HttpPatch("{employeeCode}/status")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> ChangeEmployeeStatus([FromRoute] string employeeCode, [FromBody] UpdateEmployeeStatusRequest statusRequest)
        {
            _logger.LogInformation("PATCH /api/employees/{EmployeeCode}/status initiated.", employeeCode);
            var currentEmployeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(currentEmployeeCode))
                return Unauthorized();

            var result = await _employeeService.UpdateEmployeeStatusAsync(employeeCode, statusRequest.Status, currentEmployeeCode);
            return result.Success ? Ok(new { Message = "Employee status updated successfully." }) : this.ToErrorActionResult(result);
        }

        [HttpPatch("{employeeCode}/manager")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> ChangeReportingManager([FromRoute] string employeeCode, [FromBody] ChangeReportingManagerRequest managerRequest)
        {
            _logger.LogInformation("PATCH /api/employees/{EmployeeCode}/manager initiated.", employeeCode);
            var result = await _employeeService.ChangeReportingManagerAsync(employeeCode, managerRequest.ManagerEmployeeCode);
            return result.Success ? Ok(new { Message = "Reporting manager has been successfully changed." }) : this.ToErrorActionResult(result);
        }

        [HttpDelete("{employeeCode}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteEmployee([FromRoute] string employeeCode)
        {
            _logger.LogInformation("DELETE /api/employees/{EmployeeCode} initiated.", employeeCode);
            var currentEmployeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(currentEmployeeCode))
                return Unauthorized();

            var result = await _employeeService.DeleteEmployeeAsync(employeeCode, currentEmployeeCode);
            return result.Success ? Ok(new { Message = "User deleted successfully." }) : this.ToErrorActionResult(result);
        }

        [HttpPost("{employeeCode}/reset-password")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ResetPassword([FromRoute] string employeeCode)
        {
            _logger.LogInformation("POST /api/employees/{EmployeeCode}/reset-password initiated.", employeeCode);
            var result = await _employeeService.ResetUserPasswordAsync(employeeCode);
            return result.Success ? Ok(new { Message = "The password for the user has been reset." }) : this.ToErrorActionResult(result);
        }
    }
}
