using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/manager")]
    [Authorize(Roles = "Admin,Manager")]
    public class ManagerController : ControllerBase
    {
        private readonly IManagerService _managerService;
        private readonly ILogger<ManagerController> _logger;

        public ManagerController(IManagerService managerService, ILogger<ManagerController> logger)
        {
            _managerService = managerService;
            _logger = logger;
        }

        //get all assigned employees(search sort available)
        [HttpGet("employees")]
        [ProducesResponseType(typeof(PagedResponse<EmployeeListDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployees([FromQuery] EmployeeQueryParameters parameters)
        {
            _logger.LogInformation("Inside GetAllEmployees in ManagerController");
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            var result = await _managerService.GetAssignedEmployeesAsync(managerCode, parameters);
            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(result.Value);
        }

        //get a specific employee(using employee code)
        [HttpGet("employees/{employeeCode}")]
        [ProducesResponseType(typeof(EmployeeDetailsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAssignedEmployee(string employeeCode)
        {
            _logger.LogInformation("Inside GetAssignedEmployee in ManagerController");
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            var result = await _managerService.GetAssignedEmployeeAsync(managerCode, employeeCode);
            if (!result.Success)
                return this.ToErrorActionResult(result);

            return Ok(result.Value);
        }
    }
}
