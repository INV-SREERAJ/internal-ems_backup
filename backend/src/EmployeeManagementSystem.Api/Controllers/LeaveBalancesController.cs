using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/leave-balances")]
    [Authorize(Roles = "Employee")]
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
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
    }
}
