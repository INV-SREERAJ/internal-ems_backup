using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveYearConfiguration;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class LeaveYearConfigurationService : ILeaveYearConfigurationService
    {
        private readonly ILeaveYearConfigurationRepository _configurationRepository;
        private readonly IEmployeeLeaveBalanceRepository _balanceRepository;
        private readonly ILeaveTypeRepository _leaveTypeRepository;
        private readonly ILogger<LeaveYearConfigurationService> _logger;

        public LeaveYearConfigurationService(
            ILeaveYearConfigurationRepository configurationRepository,
            IEmployeeLeaveBalanceRepository balanceRepository,
            ILeaveTypeRepository leaveTypeRepository,
            ILogger<LeaveYearConfigurationService> logger)
        {
            _configurationRepository = configurationRepository;
            _balanceRepository = balanceRepository;
            _leaveTypeRepository = leaveTypeRepository;
            _logger = logger;
        }

        private int GetCurrentYear() => DateTime.UtcNow.Year;

        public async Task<Result<List<LeaveYearConfigurationResponse>>> GetByYearAsync(int year)
        {
            _logger.LogInformation("Fetching leave year configurations for year {Year}", year);

            var configurations = await _configurationRepository.GetByYearAsync(year);

            _logger.LogInformation("Fetched {Count} leave year configurations for year {Year}", configurations.Count, year);

            return Result<List<LeaveYearConfigurationResponse>>.Ok(configurations.Select(MapToResponse).ToList());
        }

        public async Task<Result<LeaveYearConfigurationResponse>> GetByIdAsync(int id)
        {
            _logger.LogInformation("Fetching leave year configuration {ConfigurationId}", id);

            var configuration = await _configurationRepository.GetByIdAsync(id, trackChanges: false);
            if (configuration == null)
            {
                _logger.LogWarning("Leave year configuration not found: {ConfigurationId}", id);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.NotFound, "Leave year configuration not found.");
            }

            return Result<LeaveYearConfigurationResponse>.Ok(MapToResponse(configuration));
        }

        public async Task<Result<LeaveYearConfigurationResponse>> CreateAsync(CreateLeaveYearConfigurationRequest request)
        {
            _logger.LogInformation("Creating leave year configuration for leave type {LeaveTypeId}, year {Year}", request.LeaveTypeId, request.Year);

            // 1. Leave type must exist, otherwise NotFound. Load it with trackChanges: false.
            var leaveType = await _leaveTypeRepository.GetByIdAsync(request.LeaveTypeId, trackChanges: false);
            if (leaveType == null)
            {
                _logger.LogWarning("Leave year configuration creation failed, leave type not found: {LeaveTypeId}", request.LeaveTypeId);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.NotFound, "Leave type not found.");
            }

            // 2. Year < current year -> Conflict
            if (request.Year < GetCurrentYear())
            {
                _logger.LogWarning("Leave year configuration creation failed, past year: {Year}", request.Year);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.Conflict, "Configurations cannot be created for past years.");
            }

            // 3. Leave type inactive -> Conflict
            if (!leaveType.IsActive)
            {
                _logger.LogWarning("Leave year configuration creation failed, leave type is inactive: {LeaveTypeId}", request.LeaveTypeId);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.Conflict, "Leave type is inactive.");
            }

            // 4. ExistsAsync(leaveTypeId, year) -> Conflict
            if (await _configurationRepository.ExistsAsync(request.LeaveTypeId, request.Year))
            {
                _logger.LogWarning("Leave year configuration creation failed, configuration already exists for leave type {LeaveTypeId} and year {Year}", request.LeaveTypeId, request.Year);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.Conflict, "A configuration for this leave type and year already exists.");
            }

            // 5. Build configuration with LeaveTypeId only (do NOT assign LeaveType navigation)
            var now = DateTime.UtcNow;
            var configuration = new LeaveYearConfiguration
            {
                LeaveTypeId = request.LeaveTypeId,
                Year = request.Year,
                AllocatedDays = request.AllocatedDays,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _configurationRepository.AddAsync(configuration);

            // 6. Get active employee ids and create one EmployeeLeaveBalance per employee with the configuration navigation
            var activeEmployeeIds = await _balanceRepository.GetActiveEmployeeIdsAsync();
            var balances = activeEmployeeIds.Select(empId => new EmployeeLeaveBalance
            {
                EmployeeId = empId,
                LeaveYearConfiguration = configuration,
                AllocatedDays = request.AllocatedDays,
                CreatedAt = now,
                UpdatedAt = now
            }).ToList();

            await _balanceRepository.AddRangeAsync(balances);

            // 7. ONE SaveChangesAsync call
            await _configurationRepository.SaveChangesAsync();

            _logger.LogInformation("Leave year configuration created successfully with id {ConfigurationId}", configuration.Id);

            // 8. Return response using the already loaded leave type's Name
            var response = new LeaveYearConfigurationResponse
            {
                Id = configuration.Id,
                Year = configuration.Year,
                LeaveTypeId = configuration.LeaveTypeId,
                LeaveTypeName = leaveType.Name,
                AllocatedDays = configuration.AllocatedDays,
                IsActive = configuration.IsActive
            };

            return Result<LeaveYearConfigurationResponse>.Ok(response);
        }

        public async Task<Result<LeaveYearConfigurationResponse>> UpdateAsync(int id, UpdateLeaveYearConfigurationRequest request)
        {
            _logger.LogInformation("Updating leave year configuration {ConfigurationId} to {AllocatedDays} days", id, request.AllocatedDays);

            // 1. Load tracked; NotFound if missing
            var configuration = await _configurationRepository.GetByIdAsync(id, trackChanges: true);
            if (configuration == null)
            {
                _logger.LogWarning("Leave year configuration update failed, configuration not found: {ConfigurationId}", id);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.NotFound, "Leave year configuration not found.");
            }

            // 2. Year < current year -> Conflict
            if (configuration.Year < GetCurrentYear())
            {
                _logger.LogWarning("Leave year configuration update failed, past year: {Year}", configuration.Year);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.Conflict, "Configurations for past years cannot be modified.");
            }

            // 3. AllocatedDays equals current value -> return Ok with no write
            if (configuration.AllocatedDays == request.AllocatedDays)
            {
                _logger.LogInformation("Leave year configuration {ConfigurationId} allocated days unchanged ({AllocatedDays}), no write made", id, request.AllocatedDays);
                return Result<LeaveYearConfigurationResponse>.Ok(MapToResponse(configuration));
            }

            // 4. Call GetUsageExceedingAsync
            var exceedingUsages = await _balanceRepository.GetUsageExceedingAsync(configuration.LeaveTypeId, configuration.Year, request.AllocatedDays);
            if (exceedingUsages.Count > 0)
            {
                _logger.LogWarning("Leave year configuration update failed, {Count} employees exceed new allocated days {AllocatedDays}", exceedingUsages.Count, request.AllocatedDays);

                var firstBatch = exceedingUsages.Take(10).Select(u => $"{u.EmployeeCode} - {u.FullName} ({u.Days} days)");
                var details = string.Join(", ", firstBatch);
                if (exceedingUsages.Count > 10)
                {
                    details += $", and {exceedingUsages.Count - 10} more";
                }

                var message = $"Cannot reduce allocated days to {request.AllocatedDays}. The following employees have already used or requested more days: {details}.";
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.Conflict, message);
            }

            // 5. Set AllocatedDays and UpdatedAt, update balances, save once
            var now = DateTime.UtcNow;
            configuration.AllocatedDays = request.AllocatedDays;
            configuration.UpdatedAt = now;

            var balances = await _balanceRepository.GetByConfigurationIdAsync(configuration.Id, trackChanges: true);
            foreach (var balance in balances)
            {
                balance.AllocatedDays = request.AllocatedDays;
                balance.UpdatedAt = now;
            }

            await _configurationRepository.SaveChangesAsync();

            _logger.LogInformation("Leave year configuration {ConfigurationId} updated successfully to {AllocatedDays} days", id, request.AllocatedDays);

            return Result<LeaveYearConfigurationResponse>.Ok(MapToResponse(configuration));
        }

        public async Task<Result<LeaveYearConfigurationResponse>> SetActiveStatusAsync(int id, bool isActive)
        {
            _logger.LogInformation("Setting leave year configuration {ConfigurationId} active status to {IsActive}", id, isActive);

            // 1. NotFound if missing
            var configuration = await _configurationRepository.GetByIdAsync(id, trackChanges: true);
            if (configuration == null)
            {
                _logger.LogWarning("Leave year configuration status change failed, configuration not found: {ConfigurationId}", id);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.NotFound, "Leave year configuration not found.");
            }

            // 2. Past year -> Conflict
            if (configuration.Year < GetCurrentYear())
            {
                _logger.LogWarning("Leave year configuration status change failed, past year: {Year}", configuration.Year);
                return Result<LeaveYearConfigurationResponse>.Fail(ErrorType.Conflict, "Configurations for past years cannot be modified.");
            }

            // 3. Same status -> Ok with no write
            if (configuration.IsActive == isActive)
            {
                _logger.LogInformation("Leave year configuration {ConfigurationId} already has active status {IsActive}, no change made", id, isActive);
                return Result<LeaveYearConfigurationResponse>.Ok(MapToResponse(configuration));
            }

            // 4. Otherwise set IsActive and UpdatedAt, save
            configuration.IsActive = isActive;
            configuration.UpdatedAt = DateTime.UtcNow;

            await _configurationRepository.SaveChangesAsync();

            _logger.LogInformation("Leave year configuration {ConfigurationId} active status changed to {IsActive}", id, isActive);

            return Result<LeaveYearConfigurationResponse>.Ok(MapToResponse(configuration));
        }

        private static LeaveYearConfigurationResponse MapToResponse(LeaveYearConfiguration config)
        {
            return new LeaveYearConfigurationResponse
            {
                Id = config.Id,
                Year = config.Year,
                LeaveTypeId = config.LeaveTypeId,
                LeaveTypeName = config.LeaveType?.Name ?? string.Empty,
                AllocatedDays = config.AllocatedDays,
                IsActive = config.IsActive
            };
        }
    }
}
