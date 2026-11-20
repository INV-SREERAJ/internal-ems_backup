using EmployeeManagementSystem.Api.Extensions;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.DTOs.Manager;
using EmployeeManagementSystem.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
        {
            _dashboardService = dashboardService;
            _logger = logger;
        }

        [HttpGet("admin")]
        [Route("/api/admin/stats")] // Legacy route compatibility
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AdminDashboardStatsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAdminStats()
        {
            _logger.LogInformation("GET /api/dashboard/admin initiated.");
            var result = await _dashboardService.GetAdminDashboardStatsAsync();
            return result.Success ? Ok(result.Value) : this.ToErrorActionResult(result);
        }

        [HttpGet("manager")]
        [Route("/api/manager/stats")] // Legacy route compatibility
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(ManagerDashboardStatsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetManagerStats()
        {
            _logger.LogInformation("GET /api/dashboard/manager initiated.");
            var managerCode = User.FindFirst("EmployeeCode")?.Value;
            if (string.IsNullOrWhiteSpace(managerCode))
            {
                return Unauthorized(new { message = "Manager code is missing." });
            }

            var result = await _dashboardService.GetManagerDashboardStatsAsync(managerCode);
            return result.Success ? Ok(result.Value) : this.ToErrorActionResult(result);
        }
    }
}
