namespace EmployeeManagementSystem.Business.Common
{
    public class Result
    {
        public bool Success { get; init; }
        public string? Error { get; init; }
        public ErrorType ErrorType { get; init; }

        public static Result Ok()
            => new()
            {
                Success = true,
                ErrorType = ErrorType.None
            };

        public static Result Fail(ErrorType errorType, string error)
            => new()
            {
                Success = false,
                ErrorType = errorType,
                Error = error
            };
    }
}
