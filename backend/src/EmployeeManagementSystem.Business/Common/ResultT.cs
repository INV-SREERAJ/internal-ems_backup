namespace EmployeeManagementSystem.Business.Common
{
    public class Result<T> : Result
    {
        public T? Value { get; init; }

        public static Result<T> Ok(T value)
            => new()
            {
                Success = true,
                Value = value,
                ErrorType = ErrorType.None
            };

        public new static Result<T> Fail(ErrorType errorType, string error)
            => new()
            {
                Success = false,
                ErrorType = errorType,
                Error = error
            };

        public static implicit operator Result<T>(T value)
            => Ok(value);
    }
}
