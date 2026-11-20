using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/leave-requests")]
    [Authorize]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly ILeaveRequestService _leaveRequestService;
        private readonly ILogger<LeaveRequestsController> _logger;

        public LeaveRequestsController(
            ILeaveRequestService leaveRequestService,
            ILogger<LeaveRequestsController> logger)
        {
            _leaveRequestService = leaveRequestService;
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Apply([FromBody] ApplyLeaveRequest request)
        {
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveRequestService.ApplyAsync(employeeCode, request);
            if (!response.Success)
            {
                return this.ToErrorActionResult(response);
            }

            return CreatedAtAction(nameof(GetById), new { id = response.Value!.Id }, response.Value);
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(PagedResponse<MyLeaveRequestListItem>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMine([FromQuery] LeaveRequestFilter filter)
        {
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveRequestService.GetMyRequestsAsync(employeeCode, filter);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("team")]
        [Route("/api/manager/leave-requests")] // Legacy route compatibility
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(PagedResponse<TeamLeaveRequestListItem>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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

        [HttpGet]
        [Route("/api/admin/leave-requests")] // Legacy route compatibility
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(PagedResponse<TeamLeaveRequestListItem>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAllAdminRequests([FromQuery] TeamLeaveRequestFilter filter)
        {
            var response = await _leaveRequestService.GetAllRequestsAsync(filter);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("{id:int}")]
        [Route("/api/manager/leave-requests/{id:int}")] // Legacy route compatibility
        [Route("/api/admin/leave-requests/{id:int}")]   // Legacy route compatibility
        [ProducesResponseType(typeof(LeaveRequestDetailResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(callerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            if (User.IsInRole("Admin"))
            {
                var adminResponse = await _leaveRequestService.GetRequestByIdForAdminAsync(id);
                return adminResponse.Success ? Ok(adminResponse.Value) : this.ToErrorActionResult(adminResponse);
            }

            if (User.IsInRole("Manager"))
            {
                var mgrResponse = await _leaveRequestService.GetTeamRequestByIdAsync(callerCode, id);
                if (mgrResponse.Success) return Ok(mgrResponse.Value);
            }

            // Default to caller's own request
            var response = await _leaveRequestService.GetMyRequestByIdAsync(callerCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("{id:int}/history")]
        [Route("/api/manager/leave-requests/{id:int}/history")] // Legacy route compatibility
        [Route("/api/admin/leave-requests/{id:int}/history")]   // Legacy route compatibility
        [ProducesResponseType(typeof(LeaveRequestHistoryResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetHistory(int id)
        {
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(callerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            if (User.IsInRole("Admin"))
            {
                var adminRes = await _leaveRequestService.GetAdminHistoryAsync(id);
                return adminRes.Success ? Ok(adminRes.Value) : this.ToErrorActionResult(adminRes);
            }

            if (User.IsInRole("Manager"))
            {
                var mgrRes = await _leaveRequestService.GetManagerHistoryAsync(callerCode, id);
                if (mgrRes.Success) return Ok(mgrRes.Value);
            }

            var response = await _leaveRequestService.GetMyHistoryAsync(callerCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id:int}/cancel")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Cancel(int id)
        {
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }
            var response = await _leaveRequestService.CancelAsync(employeeCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id:int}/approve")]
        [Route("/api/manager/leave-requests/{id:int}/approve")] // Legacy route compatibility
        [Route("/api/admin/leave-requests/{id:int}/approve")]   // Legacy route compatibility
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Approve(int id)
        {
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(callerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = User.IsInRole("Admin")
                ? await _leaveRequestService.ApproveAsAdminAsync(callerCode, id)
                : await _leaveRequestService.ApproveAsManagerAsync(callerCode, id);

            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id:int}/reject")]
        [Route("/api/manager/leave-requests/{id:int}/reject")] // Legacy route compatibility
        [Route("/api/admin/leave-requests/{id:int}/reject")]   // Legacy route compatibility
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectLeaveRequest request)
        {
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(callerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = User.IsInRole("Admin")
                ? await _leaveRequestService.RejectAsAdminAsync(callerCode, id, request)
                : await _leaveRequestService.RejectAsManagerAsync(callerCode, id, request);

            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
