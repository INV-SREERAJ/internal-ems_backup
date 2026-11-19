using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveBalance;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/manager")]
    [Authorize(Roles = "Manager")]
    public class ManagerLeaveController : ControllerBase
    {
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILogger<ManagerLeaveController> _logger;
        private readonly ILeaveRequestService _leaveRequestService;

        public ManagerLeaveController(
            ILeaveBalanceService leaveBalanceService,
            ILogger<ManagerLeaveController> logger, ILeaveRequestService leaveRequestService)
        {
            _leaveBalanceService = leaveBalanceService;
            _logger = logger;
            _leaveRequestService = leaveRequestService;
        }

        [HttpGet("employees/{employeeCode}/leave-balances")]
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

        [HttpGet("leave-requests")]
        [ProducesResponseType(typeof(PagedResponse<TeamLeaveRequestListItem>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetTeamRequests([FromQuery] TeamLeaveRequestFilter filter)
        {
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(managerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveRequestService.GetTeamRequestsAsync(managerCode, filter);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("leave-requests/{id}")]
        [ProducesResponseType(typeof(LeaveRequestDetailResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTeamRequestById(int id)
        {
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(managerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveRequestService.GetTeamRequestByIdAsync(managerCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("leave-requests/{id}/history")]
        [ProducesResponseType(typeof(LeaveRequestHistoryResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetHistory(int id)
        {
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(managerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveRequestService.GetManagerHistoryAsync(managerCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("leave-requests/{id}/approve")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Approve(int id)
        {
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if (managerCode == null)
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }
            var response = await _leaveRequestService.ApproveAsManagerAsync(managerCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("leave-requests/{id}/reject")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectLeaveRequest request)
        {
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if(managerCode == null){
                return Unauthorized(new { Message = "Unauthorized." });
            }
            var response = await _leaveRequestService.RejectAsManagerAsync(managerCode, id, request);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
