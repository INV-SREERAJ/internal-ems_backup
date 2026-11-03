using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/leave-requests")]
    [Authorize(Roles = "Employee")]
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
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(LeaveRequestResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var employeeCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var response = await _leaveRequestService.GetMyRequestByIdAsync(employeeCode, id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
