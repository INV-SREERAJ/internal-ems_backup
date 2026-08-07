using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Admin;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.common;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class ManagerService : IManagerService
    {
        private readonly IManagerRepository _managerRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<ManagerService> _logger;

        public ManagerService(IManagerRepository managerRepository, IEmployeeRepository employeeRepository, ILogger<ManagerService> logger)
        {
            _managerRepository = managerRepository;
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        // get assigned employee from employee code
        public async Task<Result<EmployeeDetailsResponseDto>> GetAssignedEmployeeAsync(string managerCode, string employeeCode)
        {
            _logger.LogInformation("Getting an assigned employee {employeeCode} for manager {managerCode}", employeeCode, managerCode);
            var manager = await _employeeRepository.GetByEmployeeCodeAsync(managerCode);
            if (manager == null)
            {
                _logger.LogWarning("The given manager code is incorrect please check it : {managerCode}", managerCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Manager not found!");
            }

            var employee = await _employeeRepository.GetByEmployeeCodeAsync(employeeCode);
            if (employee == null)
            {
                _logger.LogWarning("Getting employee for the manager failed as no employee exist for given employeeCOde : {employeeCode}", employeeCode);
                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "No employee found please check the code!");
            }

            var response = await _managerRepository.GetAssignedEmployeeAsync(manager.Id, employeeCode);
            if (response == null)
            {
                _logger.LogWarning(
                    "Employee {employeeCode} is not assigned to manager {managerCode}",
                    employeeCode,
                    managerCode);

                return Result<EmployeeDetailsResponseDto>.Fail(ErrorType.NotFound, "Employee not found.");
            }

            return Result<EmployeeDetailsResponseDto>.Ok(new EmployeeDetailsResponseDto
            {
                EmployeeCode = response.EmployeeCode,
                FirstName = response.FirstName,
                LastName = response.LastName,
                Email = response.Email,
                PhoneNumber = response.PhoneNumber,
                Role = response.Role.ToString(),
                Status = response.Status,
                CreatedAt = response.CreatedAt,
                UpdatedAt = response.UpdatedAt
            });
        }

        // show all assigned employees with sorting searching paging
        public async Task<Result<PagedResponse<EmployeeListDto>>> GetAssignedEmployeesAsync(string managerCode, EmployeeQueryParameters employeeQueryParameters)
        {
            _logger.LogInformation(
                "Getting employees assigned under manager: {managerCode}",
                managerCode);

            var manager = await _employeeRepository.GetByEmployeeCodeAsync(managerCode);

            if (manager == null)
            {
                _logger.LogWarning(
                    "Getting employees failed. Manager with code {managerCode} was not found.",
                    managerCode);

                return Result<PagedResponse<EmployeeListDto>>.Fail(ErrorType.NotFound, "Manager not found.");
            }

            var (employees, totalCount) =
                await _managerRepository.GetAssignedEmployeesAsync(
                    manager.Id,
                    employeeQueryParameters);

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

            _logger.LogInformation(
                "Retrieved {Count} employees assigned to manager {managerCode}",
                totalCount,
                managerCode);

            return Result<PagedResponse<EmployeeListDto>>.Ok(new PagedResponse<EmployeeListDto>
            {
                Data = employeeDtos,
                TotalCount = totalCount,
                PageNumber = employeeQueryParameters.PageNumber,
                PageSize = employeeQueryParameters.PageSize
            });
        }
    }
}
