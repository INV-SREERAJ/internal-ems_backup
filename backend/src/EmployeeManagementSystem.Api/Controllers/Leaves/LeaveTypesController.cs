using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveType;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/leave-types")]
    [Route("api/admin/leave-types")] // Legacy route compatibility
    [Authorize]
    public class LeaveTypesController : ControllerBase
    {
        private readonly ILeaveTypeService _service;
        private readonly ILogger<LeaveTypesController> _logger;

        public LeaveTypesController(ILeaveTypeService service, ILogger<LeaveTypesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<LeaveTypeResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLeaveTypes([FromQuery] bool activeOnly = false)
        {
            var response = await _service.GetAllAsync(activeOnly);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("options")]
        [ProducesResponseType(typeof(List<LeaveTypeOptionsResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOptions([FromQuery] bool activeOnly = true)
        {
            var response = await _service.GetOptionsAsync(activeOnly);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetLeaveType(int id)
        {
            var response = await _service.GetByIdAsync(id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateLeaveType([FromBody] CreateLeaveTypeRequest request)
        {
            var response = await _service.CreateAsync(request);
            if (!response.Success)
                return this.ToErrorActionResult(response);

            return CreatedAtAction(nameof(GetLeaveType), new { id = response.Value!.Id }, response.Value);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateLeaveType(int id, [FromBody] UpdateLeaveTypeRequest request)
        {
            var response = await _service.UpdateAsync(id, request);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeLeaveTypeStatusRequest request)
        {
            var response = await _service.SetActiveStatusAsync(id, request.IsActive!.Value);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
