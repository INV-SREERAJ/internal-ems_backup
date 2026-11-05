using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/leave-requests")]
    [Authorize(Roles = "Admin")]
    public class AdminLeaveRequestController : ControllerBase
    {
        private readonly ILeaveRequestService _service;
        public AdminLeaveRequestController(ILeaveRequestService service) => _service = service;

        [HttpGet("{id}/history")]
        [ProducesResponseType(typeof(LeaveRequestHistoryResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetHistory(int id)
        {
            var response = await _service.GetAdminHistoryAsync(id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id}/approve")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Approve(int id)
        {
            var adminCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(adminCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }
            var response = await _service.ApproveAsAdminAsync(adminCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id}/reject")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectLeaveRequest request)
        {
            var adminCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(adminCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }
            var response = await _service.RejectAsAdminAsync(adminCode, id, request);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
