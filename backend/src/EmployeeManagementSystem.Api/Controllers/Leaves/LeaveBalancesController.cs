using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/leave-balances")]
    [Authorize]
    public class LeaveBalancesController : ControllerBase
    {
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILogger<LeaveBalancesController> _logger;

        public LeaveBalancesController(
            ILeaveBalanceService leaveBalanceService,
            ILogger<LeaveBalancesController> logger)
        {
            _leaveBalanceService = leaveBalanceService;
            _logger = logger;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(List<MyLeaveBalanceResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyBalances([FromQuery] GetLeaveBalancesRequest request)
        {
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveBalanceService.GetMyBalancesAsync(employeeCode, request.Year);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("me/years")]
        [ProducesResponseType(typeof(MyLeaveYearsResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyYears()
        {
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveBalanceService.GetMyYearsAsync(employeeCode);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("employees/{employeeCode}")]
        [Route("/api/manager/employees/{employeeCode}/leave-balances")] // Legacy route compatibility
        [Route("/api/admin/employees/{employeeCode}/leave-balances")]   // Legacy route compatibility
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(List<EmployeeLeaveBalanceResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEmployeeBalances(string employeeCode, [FromQuery] GetLeaveBalancesRequest request)
        {
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return BadRequest(new { Message = "Employee code is required." });
            }

            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(callerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            if (User.IsInRole("Admin"))
            {
                var adminRes = await _leaveBalanceService.GetEmployeeBalancesForAdminAsync(employeeCode, request.Year);
                return adminRes.Success ? Ok(adminRes.Value) : this.ToErrorActionResult(adminRes);
            }

            var response = await _leaveBalanceService.GetEmployeeBalancesForManagerAsync(callerCode, employeeCode, request.Year);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
