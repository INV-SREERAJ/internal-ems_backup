using System.Security.Claims;
using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveRequest;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/leave-calendar")]
    [Authorize]
    public class LeaveCalendarController : ControllerBase
    {
        private readonly ILeaveCalendarService _leaveCalendarService;
        private readonly ILogger<LeaveCalendarController> _logger;

        public LeaveCalendarController(
            ILeaveCalendarService leaveCalendarService,
            ILogger<LeaveCalendarController> logger)
        {
            _leaveCalendarService = leaveCalendarService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<LeaveCalendarItem>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCalendar([FromQuery] GetLeaveCalendarQuery query)
        {
            var callerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(callerCode))
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var role = User.FindFirst(ClaimTypes.Role)?.Value
                       ?? User.FindFirst("role")?.Value
                       ?? string.Empty;

            var response = await _leaveCalendarService.GetCalendarAsync(callerCode, role, query);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}

