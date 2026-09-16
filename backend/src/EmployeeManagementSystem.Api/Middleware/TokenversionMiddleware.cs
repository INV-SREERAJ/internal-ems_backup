using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;

namespace EmployeeManagementSystem.Api.Middleware
{
    // Runs after UseAuthentication(). Access tokens are stateless JWTs, so a
    // signature+expiry check alone can't reflect events that should kill a
    // session mid-flight: deactivation, deletion, or a password reset/change.
    //
    // Rather than adding a separate DB-backed middleware per event, this
    // relies on the TokenVersion counter that already gets bumped for all of
    // those cases (see AdminService.UpdateEmployeeStatusAsync,
    // AdminService.DeleteEmployeeAsync, AdminService.ResetUserPasswordAsync,
    // ProfileService.ChangePasswordAsync). If the access token's TokenVersion
    // claim doesn't match the current DB value, the token was issued before
    // one of those events and is rejected — one DB lookup covers every case,
    // present and future, as long as new invalidating actions also bump
    // TokenVersion.
    //
    // Status is checked too since we already have the employee loaded here —
    // it's a free extra safety net (e.g. Deleted/Inactive without a version
    // bump due to a bug elsewhere) rather than the primary mechanism.
    public class TokenVersionMiddleware
    {
        private readonly RequestDelegate _next;

        public TokenVersionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(
            HttpContext context,
            IEmployeeRepository employeeRepository)
        {
            // Allow anonymous requests
            if (!(context.User.Identity?.IsAuthenticated ?? false))
            {
                await _next(context);
                return;
            }

            // Read claims from JWT
            var employeeCode = context.User.FindFirst("EmployeeCode")?.Value;
            var tokenVersionClaim = context.User.FindFirst("TokenVersion")?.Value;

            if (string.IsNullOrWhiteSpace(employeeCode) ||
                !int.TryParse(tokenVersionClaim, out var tokenVersion))
            {
                await Reject(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "Invalid session. Please log in again.");

                return;
            }

            // Fetch employee ONCE
            var employee =
                await employeeRepository.GetByEmployeeCodeAsync(employeeCode);

            // Account must exist and be active
            if (employee == null ||
                employee.Status != EmployeeStatus.Active)
            {
                await Reject(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "Your account is no longer active. Please log in again.");

                return;
            }

            // Token must belong to the current session/version
            if (employee.TokenVersion != tokenVersion)
            {
                await Reject(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "Your session is no longer valid. Please log in again.");

                return;
            }

            // User has been given/reset to a temporary password
            if (employee.MustChangePassword)
            {
                var path = context.Request.Path.Value?.ToLowerInvariant();

                var allowedEndpoints = new[]
                {
                    "/api/profile/change-password",
                    "/api/auth/refresh",
                    "/api/auth/logout"
                };

                if (!allowedEndpoints.Contains(path))
                {
                    await Reject(
                        context,
                        StatusCodes.Status403Forbidden,
                        "You must change your password before accessing the application.");

                    return;
                }
            }

            await _next(context);
        }

        private static async Task Reject(
            HttpContext context,
            int statusCode,
            string message)
        {
            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(new
            {
                Message = message
            });
        }
    }
}