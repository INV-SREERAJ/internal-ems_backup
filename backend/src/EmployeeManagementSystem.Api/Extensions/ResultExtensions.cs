using EmployeeManagementSystem.Business.Common;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Api.Extensions
{
    public static class ResultExtensions
    {
        public static int ToHttpStatusCode(this ErrorType errorType)
        {
            return errorType switch
            {
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError
            };
        }

        public static IActionResult ToErrorActionResult(this ControllerBase controller, Result result)
        {
            int statusCode = result.ErrorType.ToHttpStatusCode();
            return controller.StatusCode(statusCode, new { Message = result.Error });
        }
    }
}
