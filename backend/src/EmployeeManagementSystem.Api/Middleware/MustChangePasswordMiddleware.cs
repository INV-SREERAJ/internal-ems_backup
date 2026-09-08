using EmployeeManagementSystem.DataAccess.Interfaces;

namespace EmployeeManagementSystem.Api.Middleware
{
    public class MustChangePasswordMiddleware
    {
        private readonly RequestDelegate _next;

        public MustChangePasswordMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IEmployeeRepository employeeRepository)
        {
            //allowing unauthenticated requests (login,refresh and such anonymous)
            if (!(context.User.Identity?.IsAuthenticated ?? false))
            {
                await _next(context);
                return;
            }

            //reading employeeCode
            var employeeCode = context.User.FindFirst("EmployeeCode")?.Value;

            if (string.IsNullOrWhiteSpace(employeeCode))
            {
                await _next(context);
                return;
            }

            //fetching employee
            var employee = await employeeRepository.GetByEmployeeCodeAsync(employeeCode);

            if (employee == null)
            {
                await _next(context);
                return;
            }

            //if the flag is false, permit
            if (!employee.MustChangePassword)
            {
                await _next(context);
                return;
            }



            var path = context.Request.Path.Value?.ToLower();

            //allowed paths for authenticated requests (special cases)
            var allowedEndpoints = new[]
            {
                "/api/profile/change-password",
                "/api/auth/refresh"
            };

            if (allowedEndpoints.Contains(path))
            {
                await _next(context);
                return;
            }
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new
            {
                Message = "You must change your password before accessing the application."
            });
            return;

        }
    }
}
