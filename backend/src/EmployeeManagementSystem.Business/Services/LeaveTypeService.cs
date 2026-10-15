using EmployeeManagementSystem.Business.Common;
using EmployeeManagementSystem.Business.DTOs.Leave;
using EmployeeManagementSystem.Business.Interfaces;
using EmployeeManagementSystem.DataAccess.Entities;
using EmployeeManagementSystem.DataAccess.Interfaces;

namespace EmployeeManagementSystem.Business.Services
{
    public class LeaveTypeService : ILeaveTypeService
    {
        private readonly ILeaveTypeRepository _repository;
        public LeaveTypeService(ILeaveTypeRepository repository)
        {
            _repository = repository;
        }
        public async Task<Result<LeaveTypeResponse>> CreateAsync(CreateLeaveTypeRequest request)
        {
            var name = request.Name.Trim();
            var code = request.Code.Trim().ToUpperInvariant();
            var description = request.Description?.Trim();

            if (await _repository.NameExistsAsync(name))
            {
                return Result<LeaveTypeResponse>.Fail(ErrorType.Conflict,
                    "A leave type with this name already exists.");
            }
            if (await _repository.CodeExistsAsync(code))
            {
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

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<List<LeaveTypeResponse>>> GetAllAsync(bool activeOnly = false)
        {
            var leaveTypes = await _repository.GetAllAsync(activeOnly);

            return Result<List<LeaveTypeResponse>>.Ok(leaveTypes.Select(MapToResponse).ToList());
        }



        public async Task<Result<LeaveTypeResponse>> GetByIdAsync(int id)
        {
            var leaveType = await _repository.GetByIdAsync(id, trackChanges: false);

            if (leaveType == null)
            {
                return Result<LeaveTypeResponse>.Fail(ErrorType.NotFound, "Leave type not found.");
            }
            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<LeaveTypeResponse>> SetActiveStatusAsync(int id, bool isActive)
        {
            var leaveType = await _repository.GetByIdAsync(id, trackChanges: true);
            if (leaveType == null)
            {
                return Result<LeaveTypeResponse>.Fail(ErrorType.NotFound, "Leave type not found.");
            }
            if (leaveType.IsActive == isActive)
            {
                return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
            }
            leaveType.IsActive = isActive;
            leaveType.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
        }

        public async Task<Result<LeaveTypeResponse>> UpdateAsync(int id, UpdateLeaveTypeRequest request)
        {
            var leaveType = await _repository.GetByIdAsync(id, trackChanges: true);

            if (leaveType == null)
            {
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.NotFound,
                    "Leave type not found.");
            }

            var name = request.Name.Trim();
            var code = request.Code.Trim().ToUpperInvariant();
            var description = request.Description?.Trim();

            if (await _repository.NameExistsAsync(name, id))
            {
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.Conflict,
                    "Another leave type already uses this name.");
            }

            if (await _repository.CodeExistsAsync(code, id))
            {
                return Result<LeaveTypeResponse>.Fail(
                    ErrorType.Conflict,
                    "Another leave type already uses this code.");
            }

            leaveType.Name = name;
            leaveType.Code = code;
            leaveType.Description = description;
            leaveType.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();

            return Result<LeaveTypeResponse>.Ok(MapToResponse(leaveType));
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
