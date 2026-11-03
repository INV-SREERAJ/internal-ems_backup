using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/manager/employees/{employeeCode}/leave-balances")]
    [Authorize(Roles = "Manager")]
    public class ManagerEmployeeLeaveBalancesController : ControllerBase
    {
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILogger<ManagerEmployeeLeaveBalancesController> _logger;

        public ManagerEmployeeLeaveBalancesController(
            ILeaveBalanceService leaveBalanceService,
            ILogger<ManagerEmployeeLeaveBalancesController> logger)
        {
            _leaveBalanceService = leaveBalanceService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<EmployeeLeaveBalanceResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEmployeeBalances(string employeeCode, [FromQuery] GetLeaveBalancesRequest request)
        {
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return BadRequest(new { Message = "Employee code is required." });
            }

            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(managerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveBalanceService.GetEmployeeBalancesForManagerAsync(managerCode, employeeCode, request.Year);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
