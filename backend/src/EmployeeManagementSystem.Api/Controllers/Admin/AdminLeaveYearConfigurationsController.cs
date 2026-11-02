using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/leave-year-configurations")]
    [Authorize(Roles = "Admin")]
    public class AdminLeaveYearConfigurationsController : ControllerBase
    {
        private readonly ILeaveYearConfigurationService _service;
        private readonly ILogger<AdminLeaveYearConfigurationsController> _logger;

        public AdminLeaveYearConfigurationsController(
            ILeaveYearConfigurationService service,
            ILogger<AdminLeaveYearConfigurationsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<LeaveYearConfigurationResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetConfigurations([FromQuery] GetLeaveYearConfigurationsRequest request)
        {
            var response = await _service.GetByYearAsync(request.Year);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(LeaveYearConfigurationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetConfiguration(int id)
        {
            var response = await _service.GetByIdAsync(id);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPost]
        [ProducesResponseType(typeof(LeaveYearConfigurationResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateConfiguration([FromBody] CreateLeaveYearConfigurationRequest request)
        {
            var response = await _service.CreateAsync(request);
            if (!response.Success)
                return this.ToErrorActionResult(response);

            return CreatedAtAction(nameof(GetConfiguration), new { id = response.Value!.Id }, response.Value);
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(LeaveYearConfigurationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateConfiguration(int id, [FromBody] UpdateLeaveYearConfigurationRequest request)
        {
            var response = await _service.UpdateAsync(id, request);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }

        [HttpPatch("{id}/status")]
        [ProducesResponseType(typeof(LeaveYearConfigurationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeLeaveYearConfigurationStatusRequest request)
        {
            var response = await _service.SetActiveStatusAsync(id, request.IsActive!.Value);
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
