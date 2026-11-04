using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/employees/{employeeCode}/leave-balances")]
    [Authorize(Roles = "Admin")]
    public class AdminEmployeeLeaveBalancesController : ControllerBase
    {
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILogger<AdminEmployeeLeaveBalancesController> _logger;

        public AdminEmployeeLeaveBalancesController(
            ILeaveBalanceService leaveBalanceService,
            ILogger<AdminEmployeeLeaveBalancesController> logger)
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

            var response = await _leaveBalanceService.GetEmployeeBalancesForAdminAsync(employeeCode, request.Year);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
