using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave.LeaveType;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Interfaces;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementSystem.Business.Services
{
    public class LeaveTypeService : ILeaveTypeService
    {
        private readonly ILeaveTypeRepository _repository;
        private readonly ILogger<LeaveTypeService> _logger;

        public LeaveTypeService(ILeaveTypeRepository repository, ILogger<LeaveTypeService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<Result<LeaveTypeResponse>> CreateAsync(CreateLeaveTypeRequest request)
        {
            var name = request.Name.Trim();
            var code = request.Code.Trim().ToUpperInvariant();
            var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            _logger.LogInformation("Creating leave type {Code}", code);

            if (await _repository.NameExistsAsync(name))
            {
                _logger.LogWarning("Leave type creation failed, name already exists: {Name}", name);
                return Result<LeaveTypeResponse>.Fail(ErrorType.Conflict,
                    "A leave type with this name already exists.");
            }
            if (await _repository.CodeExistsAsync(code))
            {
                _logger.LogWarning("Leave type creation failed, code already exists: {Code}", code);
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.Conflict,
                    "A leave type with this code already exists.");
            }

            var now = DateTime.UtcNow;

            var leaveType = new LeaveType
            {
                Name = name,
                Code = code,
                Description = description,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _repository.AddAsync(leaveType);
            await _repository.SaveChangesAsync();

            _logger.LogInformation("Leave type {Code} created successfully with id {LeaveTypeId}", code, leaveType.Id);

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<List<LeaveTypeResponse>>> GetAllAsync(bool activeOnly = false)
        {
            _logger.LogInformation("Fetching leave types, activeOnly: {ActiveOnly}", activeOnly);

            var leaveTypes = await _repository.GetAllAsync(activeOnly);

            _logger.LogInformation("Fetched {Count} leave types", leaveTypes.Count);

            return Result<List<LeaveTypeResponse>>.Ok(leaveTypes.Select(MapToResponse).ToList());
        }

        public async Task<Result<LeaveTypeResponse>> GetByIdAsync(int id)
        {
            _logger.LogInformation("Fetching leave type {LeaveTypeId}", id);

            var leaveType = await _repository.GetByIdAsync(id, trackChanges: false);

            if (leaveType == null)
            {
                _logger.LogWarning("Leave type not found: {LeaveTypeId}", id);
                return Result<LeaveTypeResponse>.Fail(ErrorType.NotFound, "Leave type not found.");
            }

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<LeaveTypeResponse>> SetActiveStatusAsync(int id, bool isActive)
        {
            _logger.LogInformation("Setting leave type {LeaveTypeId} active status to {IsActive}", id, isActive);

            var leaveType = await _repository.GetByIdAsync(id, trackChanges: true);
            if (leaveType == null)
            {
                _logger.LogWarning("Leave type status change failed, leave type not found: {LeaveTypeId}", id);
                return Result<LeaveTypeResponse>.Fail(ErrorType.NotFound, "Leave type not found.");
            }

            if (leaveType.IsActive == isActive)
            {
                _logger.LogInformation("Leave type {LeaveTypeId} already has active status {IsActive}, no change made", id, isActive);
                return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
            }

            leaveType.IsActive = isActive;
            leaveType.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();

            _logger.LogInformation("Leave type {LeaveTypeId} active status changed to {IsActive}", id, isActive);

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<LeaveTypeResponse>> UpdateAsync(int id, UpdateLeaveTypeRequest request)
        {
            _logger.LogInformation("Updating leave type {LeaveTypeId}", id);

            var leaveType = await _repository.GetByIdAsync(id, trackChanges: true);

            if (leaveType == null)
            {
                _logger.LogWarning("Leave type update failed, leave type not found: {LeaveTypeId}", id);
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.NotFound,
                    "Leave type not found.");
            }

            var name = request.Name.Trim();
            var code = request.Code.Trim().ToUpperInvariant();
            var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            if (await _repository.NameExistsAsync(name, id))
            {
                _logger.LogWarning("Leave type update failed, name already used by another leave type: {Name}", name);
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.Conflict,
                    "Another leave type already uses this name.");
            }

            if (await _repository.CodeExistsAsync(code, id))
            {
                _logger.LogWarning("Leave type update failed, code already used by another leave type: {Code}", code);
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.Conflict,
                    "Another leave type already uses this code.");
            }

            leaveType.Name = name;
            leaveType.Code = code;
            leaveType.Description = description;
            leaveType.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();

            _logger.LogInformation("Leave type {LeaveTypeId} updated successfully", id);

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<List<LeaveTypeOptionsResponse>>> GetOptionsAsync()
        {
            _logger.LogInformation("Fetching active leave type options");

            var leaveTypes = await _repository.GetAllAsync(activeOnly: true);

            _logger.LogInformation("Fetched {Count} active leave type options", leaveTypes.Count);

            return Result<List<LeaveTypeOptionsResponse>>.Ok(leaveTypes.Select(l => new LeaveTypeOptionsResponse
            {
                Id = l.Id,
                Name = l.Name,
                Code = l.Code,
                Description = l.Description
            }).ToList());
        }

        private static LeaveTypeResponse MapToResponse(LeaveType leaveType)
        {
            return new LeaveTypeResponse
            {
                Id = leaveType.Id,
                Name = leaveType.Name,
                Code = leaveType.Code,
                Description = leaveType.Description,
                IsActive = leaveType.IsActive,
                CreatedAt = leaveType.CreatedAt,
                UpdatedAt = leaveType.UpdatedAt
            };
        }
    }
}