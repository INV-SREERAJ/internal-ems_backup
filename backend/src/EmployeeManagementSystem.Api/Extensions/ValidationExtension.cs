using EmployeeManagementSystem.Business.Validators.Admin;
using FluentValidation;
using FluentValidation.AspNetCore;

namespace EmployeeManagementSystem.Api.Extensions;

public static class ValidationExtensions
{
    public static IServiceCollection AddValidationServices(this IServiceCollection services)
    {
        services.AddFluentValidationAutoValidation();

        services.AddValidatorsFromAssemblyContaining<CreateEmployeeRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        return services;
    }
}