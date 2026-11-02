using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveType;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("/api/leave-types")]
    [Authorize]
    public class LeaveTypesController : ControllerBase
    {
        private readonly ILeaveTypeService _service;
        public LeaveTypesController(ILeaveTypeService service) => _service = service;

        [HttpGet("options")]
        [ProducesResponseType(typeof(List<LeaveTypeOptionsResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOptions()
        {
            var response = await _service.GetOptionsAsync();
            return response.Success ? Ok(response.Value) : this.ToErrorActionResult(response);
        }
    }
}
