using EmployeeManagementSystem.Business.Configuration;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.Business.Services;
using EmployeeManagementSystem.DataAccess.Interfaces;
using EmployeeManagementSystem.DataAccess.Repositories;

namespace EmployeeManagementSystem.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Repositories
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddScoped<IManagerRepository, ManagerRepository>();
        services.AddScoped<ILeaveTypeRepository, LeaveTypeRepository>();
        services.AddScoped<ILeaveYearConfigurationRepository, LeaveYearConfigurationRepository>();
        services.AddScoped<IEmployeeLeaveBalanceRepository, EmployeeLeaveBalanceRepository>();
        services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();

        services.AddHttpContextAccessor();

        // Services
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IEmployeeCodeGenerator, EmployeeCodeGenerator>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IManagerService, ManagerService>();
        services.AddScoped<ILeaveTypeService, LeaveTypeService>();
        services.AddScoped<ILeaveYearConfigurationService, LeaveYearConfigurationService>();
        services.AddScoped<ILeaveBalanceService, LeaveBalanceService>();
        services.AddScoped<ILeaveRequestService, LeaveRequestService>();

        services.Configure<EmailSettings>(
            configuration.GetSection("EmailSettings"));

        return services;
    }
}