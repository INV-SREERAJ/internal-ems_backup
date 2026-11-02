using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveType;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers.Admin
{
    [ApiController]
    [Route("/api/admin/leave-types")]
    [Authorize(Roles = "Admin")]
    public class AdminLeaveTypesController : ControllerBase
    {

        private readonly ILeaveTypeService _service;
        private readonly ILogger<AdminLeaveTypesController> _logger;

        public AdminLeaveTypesController(ILeaveTypeService service, ILogger<AdminLeaveTypesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<LeaveTypeResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLeaveTypes([FromQuery] bool activeOnly = true)
        {
            var response = await _service.GetAllAsync(activeOnly);
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
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateLeaveType([FromBody] CreateLeaveTypeRequest request)
        {
            var response = await _service.CreateAsync(request);
            if (!response.Success)
                return this.ToErrorActionResult(response);

            return CreatedAtAction(nameof(GetLeaveType), new { id = response.Value!.Id }, response.Value);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateLeaveType(int id, [FromBody] UpdateLeaveTypeRequest request)
        {
            var response = await _service.UpdateAsync(id, request);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id:int}/status")]
        [ProducesResponseType(typeof(LeaveTypeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeLeaveTypeStatusRequest request)
        {
            var response = await _service.SetActiveStatusAsync(id, request.IsActive!.Value);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }


    }
}
