using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Common;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Entities.Enums;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;
        private readonly IEmployeeCodeGenerator _employeeCodeGenerator;
        private readonly ILeaveYearConfigurationRepository _leaveYearConfigurationRepository;
        private readonly IEmployeeLeaveBalanceRepository _employeeLeaveBalanceRepository;
        private readonly ILogger<EmployeeService> _logger;

        public EmployeeService(
            IEmployeeRepository employeeRepository,
            IPasswordService passwordService,
            IEmailService emailService,
            IEmployeeCodeGenerator employeeCodeGenerator,
            ILeaveYearConfigurationRepository leaveYearConfigurationRepository,
            IEmployeeLeaveBalanceRepository employeeLeaveBalanceRepository,
            ILogger<EmployeeService> logger)
        {
            _employeeRepository = employeeRepository;
            _passwordService = passwordService;
            _emailService = emailService;
            _employeeCodeGenerator = employeeCodeGenerator;
            _leaveYearConfigurationRepository = leaveYearConfigurationRepository;
            _employeeLeaveBalanceRepository = employeeLeaveBalanceRepository;
            _logger = logger;
        }

        public async Task<Result<CreateEmployeeResponse>> CreateEmployeeAsync(CreateEmployeeRequest request)
        {
            _logger.LogInformation("Creating employee {Email}", request.Email);

            var emailExists = await _employeeRepository.EmailExistsAsync(request.Email);
            if (emailExists)
            {
                _logger.LogWarning("Employee creation failed, email already exists: {Email}", request.Email);
                return Result<CreateEmployeeResponse>.Fail(ErrorType.Conflict, "Email already exists.");
            }

            int? managerId = null;
            if (!string.IsNullOrWhiteSpace(request.ManagerEmployeeCode))
            {
                var manager = await _employeeRepository.GetByEmployeeCodeAsync(request.ManagerEmployeeCode);
                if (manager == null || manager.Status == EmployeeStatus.Deleted)
                {
                    _logger.LogWarning("Employee creation failed, reporting manager not found: {ManagerEmployeeCode}", request.ManagerEmployeeCode);
                    return Result<CreateEmployeeResponse>.Fail(ErrorType.NotFound, "Reporting Manager does not exist.");
                }

                if (manager.Role != Role.Manager && manager.Role != Role.Admin)
                {
                    _logger.LogWarning("Employee creation failed, manager role is invalid: {ManagerEmployeeCode}", request.ManagerEmployeeCode);
                    return Result<CreateEmployeeResponse>.Fail(ErrorType.Conflict, "Manager must be of role Manager or Admin");
                }

                managerId = manager.Id;
            }

            var employeeCodeResult = await _employeeCodeGenerator.GenerateEmployeeCodeAsync(request.Role);
            if (!employeeCodeResult.Success)
            {
                _logger.LogWarning("Employee creation failed, could not generate code: {Error}", employeeCodeResult.Error);
                return Result<CreateEmployeeResponse>.Fail(employeeCodeResult.ErrorType, employeeCodeResult.Error);
            }

            var password = _passwordService.GenerateTemporaryPassword();
            var hashedPassword = _passwordService.HashPassword(password);

            var employee = new Employee
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Role = request.Role,
                ManagerId = managerId,
                PasswordHash = hashedPassword,
                EmployeeCode = employeeCodeResult.Value!,
                Status = EmployeeStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            await _employeeRepository.AddEmployeeAsync(employee);
            await _employeeRepository.SaveChangesAsync();

            // Allocate leave balances
            int currentYear = DateTime.UtcNow.Year;
            var configs = await _leaveYearConfigurationRepository.GetByYearAsync(currentYear);

            if (configs.Count > 0)
            {
                var balances = configs.Select(config => new EmployeeLeaveBalance
                {
                    EmployeeId = employee.Id,
                    LeaveYearConfigurationId = config.Id,
                    AllocatedDays = config.AllocatedDays,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }).ToList();

                await _employeeLeaveBalanceRepository.AddRangeAsync(balances);
                await _employeeLeaveBalanceRepository.SaveChangesAsync();
            }

            _logger.LogInformation("Employee created: {EmployeeCode}, Email: {Email}", employee.EmployeeCode, employee.Email);

            await _emailService.WelcomeEmailAsync(
                employee.Email,
                $"{employee.FirstName} {employee.LastName}",
                password);

            return Result<CreateEmployeeResponse>.Ok(new CreateEmployeeResponse
            {
                EmployeeCode = employee.EmployeeCode,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                Role = employee.Role.ToString(),
                Message = "Employee created successfully."
            });
        }

        public async Task<Result<PagedResponse<EmployeeListDto>>> GetEmployeesAsync(
            EmployeeQueryParameters parameters,
            string? managerCode = null)
        {
            int? managerId = null;
            if (!string.IsNullOrWhiteSpace(managerCode))
            {
                var manager = await _employeeRepository.GetByEmployeeCodeAsync(managerCode, trackChanges: false);
                if (manager == null)
                {
                    _logger.LogWarning("Manager with code {ManagerCode} was not found.", managerCode);
                    return Result<PagedResponse<EmployeeListDto>>.Fail(ErrorType.NotFound, "Manager not found.");
                }
                managerId = manager.Id;
            }

            var (employees, totalCount) = await _employeeRepository.GetPagedAsync(parameters, managerId);

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

            return Result<PagedResponse<EmployeeListDto>>.Ok(new PagedResponse<EmployeeListDto>
            {
                Data = employeeDtos,
                TotalCount = totalCount,
                PageNumber = parameters.PageNumber,
                PageSize = parameters.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize)
            });
        }

        public async Task<Result<EmployeeDetailsResponseDto>> GetEmployeeDetailsAsync(
            string employeeCode,
            string? managerCode = null)
        {
            _logger.LogInformation("Getting employee details for {EmployeeCode}", employeeCode);

            if (!string.IsNullOrWhiteSpace(managerCode))
            {
                var manager = await _employeeRepository.GetByEmployeeCodeAsync(managerCode, trackChanges: false);
                if (manager == null)
                {
                    return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Manager not found!");
                }

                var assignedEmployee = await _employeeRepository.GetAssignedEmployeeAsync(manager.Id, employeeCode);
                if (assignedEmployee == null)
                {
                    return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee not found under your management.");
                }

                return Result<EmployeeDetailsResponseDto>.Ok(new EmployeeDetailsResponseDto
                {
                    EmployeeCode = assignedEmployee.EmployeeCode,
                    FirstName = assignedEmployee.FirstName,
                    LastName = assignedEmployee.LastName,
                    Email = assignedEmployee.Email,
                    PhoneNumber = assignedEmployee.PhoneNumber,
                    Role = assignedEmployee.Role.ToString(),
                    Status = assignedEmployee.Status,
                    ManagerEmployeeCode = managerCode,
                    ManagerName = $"{manager.FirstName} {manager.LastName}",
                    CreatedAt = assignedEmployee.CreatedAt,
                    UpdatedAt = assignedEmployee.UpdatedAt
                });
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode, trackChanges: false);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found: {EmployeeCode}", employeeCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            return Result<EmployeeDetailsResponseDto>.Ok(new EmployeeDetailsResponseDto
            {
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role.ToString(),
                Status = employee.Status,
                ManagerEmployeeCode = employee.Manager?.EmployeeCode,
                ManagerName = employee.Manager == null ? null : $"{employee.Manager.FirstName} {employee.Manager.LastName}",
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            });
        }

        public async Task<Result<EmployeeDetailsResponseDto>> UpdateEmployeeAsync(
            string employeeCode,
            UpdateEmployeeRequest request)
        {
            _logger.LogInformation("Updating employee {EmployeeCode}", employeeCode);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found for update: {EmployeeCode}", employeeCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            if (employee.Role != request.Role)
            {
                if (employee.Role == Role.Manager)
                {
                    var hasReports = await _employeeRepository.HasDirectReportsAsync(employee.Id);
                    if (hasReports)
                    {
                        return Result<EmployeeDetailsResponseDto>.Fail(
                            ErrorType.Conflict,
                            "Cannot change role. This manager has active employees assigned. Reassign them first.");
                    }
                }
                employee.Role = request.Role;
            }

            employee.FirstName = request.FirstName;
            employee.LastName = request.LastName;
            employee.PhoneNumber = request.PhoneNumber;
            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);
            await _employeeRepository.SaveChangesAsync();

            _logger.LogInformation("Employee updated: {EmployeeCode}", employeeCode);

            return Result<EmployeeDetailsResponseDto>.Ok(new EmployeeDetailsResponseDto
            {
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Role = employee.Role.ToString(),
                Status = employee.Status,
                ManagerEmployeeCode = employee.Manager?.EmployeeCode,
                ManagerName = employee.Manager == null ? null : $"{employee.Manager.FirstName} {employee.Manager.LastName}",
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            });
        }

        public async Task<Result<bool>> UpdateEmployeeStatusAsync(
            string employeeCode,
            EmployeeStatus status,
            string currentEmployeeCode)
        {
            if (employeeCode == currentEmployeeCode)
            {
                return Result<bool>.Fail(ErrorType.Conflict, "You cannot change your own status.");
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found: {EmployeeCode}", employeeCode);
                return Result<bool>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            if (status == EmployeeStatus.Inactive && employee.Role == Role.Manager)
            {
                var hasReports = await _employeeRepository.HasDirectReportsAsync(employee.Id);
                if (hasReports)
                {
                    return Result<bool>.Fail(
                        ErrorType.Conflict,
                        "Cannot deactivate this manager. Active employees are currently assigned. Reassign them first.");
                }
            }

            employee.Status = status;
            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);
            await _employeeRepository.SaveChangesAsync();

            return Result<bool>.Ok(true);
        }

        public async Task<Result> DeleteEmployeeAsync(string employeeCode, string currentEmployeeCode)
        {
            if (employeeCode == currentEmployeeCode)
            {
                return Result.Fail(ErrorType.Conflict, "You cannot delete your own account.");
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found for deletion: {EmployeeCode}", employeeCode);
                return Result.Fail(ErrorType.NotFound, "Employee not found.");
            }

            if (employee.Role == Role.Manager)
            {
                var hasReports = await _employeeRepository.HasDirectReportsAsync(employee.Id);
                if (hasReports)
                {
                    return Result.Fail(
                        ErrorType.Conflict,
                        "Cannot delete this manager. Active employees are assigned. Reassign them first.");
                }
            }

            employee.Status = EmployeeStatus.Deleted;
            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);
            await _employeeRepository.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> ChangeReportingManagerAsync(string employeeCode, string managerEmployeeCode)
        {
            _logger.LogInformation("Changing manager of {EmployeeCode} to {ManagerEmployeeCode}", employeeCode, managerEmployeeCode);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                return Result.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var manager = await _employeeRepository.GetByEmployeeCodeAsync(managerEmployeeCode);
            if (manager == null || manager.Status == EmployeeStatus.Deleted)
            {
                return Result.Fail(ErrorType.NotFound, "Manager not found.");
            }

            if (manager.Role != Role.Manager && manager.Role != Role.Admin)
            {
                return Result.Fail(ErrorType.Conflict, "Manager must be of role Manager or Admin");
            }

            if (employee.Role == Role.Manager && manager.Role == Role.Manager)
            {
                var hasSubordinateManagers = await _employeeRepository.HasSubordinateManagersAsync(employee.Id);
                if (hasSubordinateManagers)
                {
                    return Result.Fail(ErrorType.Conflict, "3 level hierarchy is not supported");
                }
            }

            employee.ManagerId = manager.Id;
            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);
            await _employeeRepository.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> ResetUserPasswordAsync(string employeeCode)
        {
            _logger.LogInformation("Resetting password for {EmployeeCode}", employeeCode);

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found for password reset: {EmployeeCode}", employeeCode);
                return Result.Fail(ErrorType.NotFound, "Employee not found.");
            }

            var temporaryPassword = _passwordService.GenerateTemporaryPassword();
            employee.PasswordHash = _passwordService.HashPassword(temporaryPassword);
            employee.UpdatedAt = DateTime.UtcNow;

            await _employeeRepository.UpdateAsync(employee);
            await _employeeRepository.SaveChangesAsync();

            await _emailService.ResetPasswordEmailAsync(
                employee.Email,
                $"{employee.FirstName} {employee.LastName}",
                temporaryPassword);

            _logger.LogInformation("Temporary password sent to {Email} for {EmployeeCode}", employee.Email, employeeCode);

            return Result.Ok();
        }
    }
}
