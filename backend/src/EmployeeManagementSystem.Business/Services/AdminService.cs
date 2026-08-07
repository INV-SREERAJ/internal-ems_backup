using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class AdminService : IAdminService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;
        private readonly IAdminRepository _adminRepository;
        private readonly IEmployeeCodeGenerator _employeeCodeGenerator;
        private readonly ILogger<AdminService> _logger;
        private readonly IManagerRepository _managerRepository;

        public AdminService(IEmployeeRepository employeeRepository, IPasswordService passwordService, IEmailService emailService, IAdminRepository adminRepository, IEmployeeCodeGenerator employeeCodeGenerator, ILogger<AdminService> logger, IManagerRepository managerRepository)
        {
            _employeeRepository = employeeRepository;
            _passwordService = passwordService;
            _emailService = emailService;
            _adminRepository = adminRepository;
            _employeeCodeGenerator = employeeCodeGenerator;
            _logger = logger;
            _managerRepository = managerRepository;
        }

        //create employee
        public async Task<Result<CreateEmployeeResponse>> CreateEmployeeAsync(CreateEmployeeRequest request)
        {
            _logger.LogInformation("Creating employee {Email}", request.Email);

            var emailExists = await _employeeRepository.EmailExistsAsync(request.Email);
            if (emailExists)
            {
                _logger.LogWarning("Employee creation failed, email already exists: {Email}", request.Email);
                return Result<CreateEmployeeResponse>.Fail(
                        ErrorType.Conflict,
                        "Email already exists.");
            }

            if (request.Role == Role.Admin)
            {
                _logger.LogWarning("Employee cannot be created as the role specified is Admin.");
                return Result<CreateEmployeeResponse>.Fail(
                        ErrorType.Conflict,
                        "Employee cannot be created as Admin.");
            }

            int? managerId = null;

            if (!string.IsNullOrWhiteSpace(request.ManagerEmployeeCode))
            {
                var manager = await _employeeRepository.GetByEmployeeCodeAsync(request.ManagerEmployeeCode);

                if (manager == null)
                {
                    _logger.LogWarning("Employee creation failed because no manager exist at given manager code: {ManagerEmployeeCode}", request.ManagerEmployeeCode);
                    return Result<CreateEmployeeResponse>.Fail(
                        ErrorType.NotFound,
                        "Manager not found, please check the managercode.");
                }

                if (manager.Status != EmployeeStatus.Active)
                {
                    _logger.LogWarning("Employee creation failed because manager is either deleted or inactive. manager code: {ManagerEmployeeCode}", request.ManagerEmployeeCode);
                    return Result<CreateEmployeeResponse>.Fail(ErrorType.Conflict, "Manager is not active.");
                }

                if (manager.Role != Role.Manager && manager.Role != Role.Admin)
                {
                    _logger.LogWarning("Employee creation failed because an employee cannot be a manager. manager code: {ManagerEmployeeCode}", request.ManagerEmployeeCode);
                    return Result<CreateEmployeeResponse>.Fail(ErrorType.Conflict, "Specified manager role is invalid.");
                }

                managerId = manager.Id;
            }

            var temporaryPassword = _passwordService.GenerateTemporaryPassword();

            var passwordHash = _passwordService.HashPassword(temporaryPassword);

            var employee = new Employee
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Role = request.Role,
                ManagerId = managerId,

                PasswordHash = passwordHash,

                Status = EmployeeStatus.Active,
                MustChangePassword = true,

                TokenVersion = 1,

                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _employeeRepository.AddEmployeeAsync(employee);

            var codeResult = await _employeeCodeGenerator.GenerateEmployeeCodeAsync(request.Role);
            if (!codeResult.Success || codeResult.Value == null)
            {
                return Result<CreateEmployeeResponse>.Fail(codeResult.ErrorType, codeResult.Error ?? "Failed to generate employee code.");
            }
            employee.EmployeeCode = codeResult.Value;

            await _employeeRepository.UpdateAsync(employee);

            //successful creation
            _logger.LogInformation("Employee {EmployeeCode} created successfully.", employee.EmployeeCode);

            try
            {
                await _emailService.WelcomeEmailAsync(
                    employee.Email,
                    $"{employee.FirstName} {employee.LastName}",
                    temporaryPassword);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email for employee {EmployeeCode}", employee.EmployeeCode);
            }

            return Result<CreateEmployeeResponse>.Ok(
                new CreateEmployeeResponse
                {
                    EmployeeCode = employee.EmployeeCode,
                    FullName = $"{employee.FirstName} {employee.LastName}",
                    Email = employee.Email,
                    Role = employee.Role.ToString(),
                    Message = "User created successfully."
                });
        }

        // get all employees including paging, searching, sorting
        public async Task<Result<PagedResponse<EmployeeListDto>>> GetEmployeesAsync(EmployeeQueryParameters parameters)
        {
            var (employees, totalCount) =
                await _adminRepository.GetEmployeesAsync(parameters);

            var employeeDtos = employees.Select(employee => new EmployeeListDto
            {
                EmployeeCode = employee.EmployeeCode,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role.ToString(),
                ManagerName = employee.Manager == null
                ? null
                : $"{employee.Manager.FirstName} {employee.Manager.LastName}",
                Status = employee.Status
            });

            return Result<PagedResponse<EmployeeListDto>>.Ok(
                new PagedResponse<EmployeeListDto>
                {
                    Data = employeeDtos,
                    PageNumber = parameters.PageNumber,
                    PageSize = parameters.PageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
                });
        }

        // change status
        public async Task<Result<bool>> UpdateEmployeeStatusAsync(string employeeCode, EmployeeStatus status, string currentEmployeeCode)
        {
            _logger.LogInformation("Changing status of employee {EmployeeCode}", employeeCode);
            var employee = await _adminRepository.GetEmployeeByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning(
                    "Status update failed. Employee {EmployeeCode} not found.",
                     employeeCode);
                return Result<bool>.Fail(ErrorType.NotFound, "Employee not found. EmployeeCode is wrong.");
            }

            //trying to change his own staus
            if (status != EmployeeStatus.Active && employee.EmployeeCode == currentEmployeeCode)
            {
                _logger.LogWarning("Employee {EmployeeCode} attempted to disable their own account.", currentEmployeeCode);
                return Result<bool>.Fail(ErrorType.Conflict, "Cant disable your own account.");
            }

            if (status != EmployeeStatus.Active && await _managerRepository.HasActiveDirectReportsAsync(employee.Id))
            {
                _logger.LogInformation("Tried to disable manager {employeeCode} but has active reporting employees thereby failed the action.", employeeCode);
                return Result<bool>.Fail(ErrorType.Conflict, "Cant disable manager with active direct reports.");
            }

            //nothing to change
            if (employee.Status == status)
                return Result<bool>.Ok(false);

            employee.Status = status;
            employee.UpdatedAt = DateTime.UtcNow;

            //changing refresh token version to revoke access
            if (status != EmployeeStatus.Active)
                employee.TokenVersion++;

            await _employeeRepository.UpdateAsync(employee);
            _logger.LogInformation(
                "Employee {EmployeeCode} status changed to {Status}",
                employee.EmployeeCode,
                employee.Status);
            return Result<bool>.Ok(true);
        }

        // get a single employee
        public async Task<Result<EmployeeDetailsResponseDto>> GetEmployeeDetailsAsync(string employeeCode)
        {
            var employee = await _adminRepository.GetEmployeeByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee doesnt exist check the employee code.");
            }

            if (employee.Status == EmployeeStatus.Deleted)
            {
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee is deleted.");
            }

            return Result<EmployeeDetailsResponseDto>.Ok(new EmployeeDetailsResponseDto
            {
                EmployeeCode = employeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role.ToString(),
                Status = employee.Status,
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            });
        }

        // edit an employee
        public async Task<Result<EmployeeDetailsResponseDto>> UpdateEmployeeAsync(string employeeCode, UpdateEmployeeRequest request)
        {
            _logger.LogInformation("Updating employee {EmployeeCode}", employeeCode);

            var employee = await _adminRepository.GetEmployeeByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("Update failed. Employee {EmployeeCode} not found.", employeeCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee not found, check the employeeCode.");
            }

            if (employee.Status == EmployeeStatus.Deleted)
            {
                _logger.LogWarning("Update failed. Employee {EmployeeCode} is deleted.", employeeCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee is deleted, activate him.");
            }

            //admin cant change his role (only 1 admin and if role changes the system breaks)
            if (employee.Role == Role.Admin && request.Role != Role.Admin)
            {
                _logger.LogWarning("The only admin cannot be changed to another role.");
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.Conflict, "Cant change role of admin.");
            }

            if (employee.Role != Role.Employee && request.Role == Role.Employee && await _managerRepository.HasActiveDirectReportsAsync(employee.Id))
            {
                _logger.LogWarning("Update employee failed for {employeeCode} since manager has active employees reporting", employeeCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.Conflict, "Cant change the role as manager has active employees reporting, please change the reporting manager and try again.");
            }

            // check if the email is already present (excluding the current email)
            if (!employee.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
            {
                if (await _employeeRepository.EmailExistsAsync(request.Email))
                {
                    _logger.LogWarning("The email trying to change to {Email} already exists", request.Email);
                    return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.Conflict, "Email already exists.");
                }
            }

            if (request.Role == Role.Admin)
            {
                _logger.LogWarning("cant change an employee to admin");
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.Conflict, "Cant change role of admin.");
            }

            employee.FirstName = request.FirstName;
            employee.LastName = request.LastName;
            employee.PhoneNumber = request.PhoneNumber;
            employee.Email = request.Email;
            employee.Role = request.Role;

            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);

            _logger.LogInformation("Employee {EmployeeCode} updated successfully.", employeeCode);

            return Result<EmployeeDetailsResponseDto>.Ok(new EmployeeDetailsResponseDto
            {
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                EmployeeCode = employee.EmployeeCode,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role.ToString(),
                Status = employee.Status,
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            });
        }

        //soft delete
        public async Task<Result> DeleteEmployeeAsync(string employeeCode, string currentEmployeeCode)
        {
            _logger.LogInformation("In delete to delete {employeeCode}", employeeCode);

            if (currentEmployeeCode == employeeCode)
            {
                _logger.LogWarning("Employee {EmployeeCode} attempted to delete their own account.", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Cant delete your own account.");
            }

            var employee = await _adminRepository.GetEmployeeByEmployeeCodeAsync(employeeCode);

            if (employee == null)
            {
                _logger.LogWarning("Delete failed, no employee for code : {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.NotFound, "Employee not found.");
            }

            if (employee.Status == EmployeeStatus.Deleted)
            {
                _logger.LogWarning("Delete failed. Employee {EmployeeCode} is already deleted.", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Employee is already deleted.");
            }

            if (employee.Role == Role.Manager && await _managerRepository.HasActiveDirectReportsAsync(employee.Id))
            {
                _logger.LogWarning("Manager deletion failed {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Manager with active reporting employees cant be deleted, please change the reporting manager and try again");
            }

            employee.Status = EmployeeStatus.Deleted;
            employee.UpdatedAt = DateTime.UtcNow;
            employee.TokenVersion++;

            await _employeeRepository.UpdateAsync(employee);
            _logger.LogInformation("Successfully deleted {employeeCode}", employeeCode);

            return Result.Ok();
        }

        // change manager
        public async Task<Result> ChangeReportingManagerAsync(string employeeCode, string managerEmployeeCode)
        {
            _logger.LogInformation("Changing reporting manager for employee {EmployeeCode}", employeeCode);

            if (employeeCode == managerEmployeeCode)
            {
                _logger.LogWarning("Change in RM failed, Manager and employee is same");
                return Result.Fail(ErrorType.Conflict, "Manager and employee has to be different");
            }

            var employee = await _adminRepository.GetEmployeeByEmployeeCodeAsync(employeeCode);

            if (employee == null || employee.Status == EmployeeStatus.Deleted)
            {
                _logger.LogWarning("Change in RM failed, {EmployeeCode} is either deleted or does not exist", employeeCode);
                return Result.Fail(ErrorType.NotFound, "Change in RM failed: employee does not exist or is deleted");
            }

            var manager = await _adminRepository.GetEmployeeByEmployeeCodeAsync(managerEmployeeCode);

            if (manager == null)
            {
                _logger.LogWarning("Change in RM failed, {managerEmployeeCode} does not exist", managerEmployeeCode);
                return Result.Fail(ErrorType.NotFound, "Manager not found please check the EmployeeCode");
            }

            if (manager.Status == EmployeeStatus.Deleted)
            {
                _logger.LogWarning("Change in RM failed, {managerEmployeeCode} is deleted.", managerEmployeeCode);
                return Result.Fail(ErrorType.NotFound, "Manager already deleted, please check the EmployeeCode");
            }

            if (manager.Role != Role.Admin && manager.Role != Role.Manager)
            {
                _logger.LogWarning("Change in RM failed, {managerEmployeeCode} is an employee and cannot be a manager", managerEmployeeCode);
                return Result.Fail(ErrorType.Conflict, "This employee cannot be a manager.");
            }

            if (manager.Status != EmployeeStatus.Active)
            {
                _logger.LogWarning("Change in RM failed, {managerEmployeeCode} is either deleted or inactive", managerEmployeeCode);
                return Result.Fail(ErrorType.Conflict, "Selected manager is inactive.");
            }


            if(manager.ManagerId == employee.Id)
            {
                _logger.LogInformation("Change in RM failed as the manager {managerEmployeeCode} reports to the employee {employeeCode}", managerEmployeeCode, employeeCode);
                return Result.Fail(ErrorType.Conflict, "Selected manager reports to the employee.");
            }

            if (employee.Role == Role.Admin)
            {
                _logger.LogWarning("Change in RM failed, {EmployeeCode} is admin and admin cant have manager", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Admin cannot have a manager");
            }

            if (employee.ManagerId == manager.Id)
            {
                _logger.LogWarning("Change in RM failed, the employee was already assigned to the manager");
                return Result.Fail(ErrorType.Conflict, "Employee is already assigned to this manager.");
            }

            employee.ManagerId = manager.Id;
            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);
            _logger.LogInformation("Employee {EmployeeCode} assigned to manager {ManagerCode}", employee.EmployeeCode, manager.EmployeeCode);

            return Result.Ok();
        }

        //reset a users password
        public async Task<Result> ResetUserPasswordAsync(string employeeCode)
        {
            _logger.LogInformation("Resetting the password of {employeeCode}", employeeCode);

            var employee = await _adminRepository.GetEmployeeByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogInformation("Password reset failed. No employee found with : {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.NotFound, "User not found, check the employee code...");
            }

            if (employee.Role == Role.Admin)
            {
                _logger.LogInformation("Reset password failed, admin password cannot be resetted {employeeCode}.", employeeCode);
                return Result.Fail(ErrorType.Conflict, "Cannot reset Admin password.");
            }

            if (employee.Status == EmployeeStatus.Deleted)
            {
                _logger.LogInformation("Reset password failed, the employee was deleted {employeeCode}", employeeCode);
                return Result.Fail(ErrorType.Conflict, "User was deleted, cant reset the password.");
            }

            var temp = _passwordService.GenerateTemporaryPassword();
            var hashedPass = _passwordService.HashPassword(temp);

            employee.PasswordHash = hashedPass;
            employee.MustChangePassword = true;
            employee.TokenVersion++;

            await _employeeRepository.UpdateAsync(employee);
            try
            {
                await _emailService.ResetPasswordEmailAsync(employee.Email, $"{employee.FirstName} {employee.LastName}", temp);
            }
            catch (Exception ex)
            {
                _logger.LogInformation("Reset password Email sending failed for {employeeCode}.", employeeCode);
            }

            _logger.LogInformation("Password resetted for user: {employeeCode}, successfully.", employeeCode);
            return Result.Ok();
        }
    }
}
