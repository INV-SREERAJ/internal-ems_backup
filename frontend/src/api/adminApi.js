import employeeApi from "./employeeApi";
import leaveApi from "./leaveApi";
import dashboardApi from "./dashboardApi";

/**
 * Admin API facade delegating to unified resource clients
 * Ensures backward compatibility while routing to clean RESTful services.
 */
export const adminApi = {
  // Leave Types
  getLeaveTypes: leaveApi.getLeaveTypes,
  getLeaveTypeById: leaveApi.getLeaveTypeById,
  createLeaveType: leaveApi.createLeaveType,
  updateLeaveType: leaveApi.updateLeaveType,
  changeLeaveTypeStatus: leaveApi.changeLeaveTypeStatus,

  // Yearly Leave Configurations
  getLeaveYearConfigurations: leaveApi.getLeaveYearConfigurations,
  getLeaveYearConfigurationById: leaveApi.getLeaveYearConfigurationById,
  createLeaveYearConfiguration: leaveApi.createLeaveYearConfiguration,
  updateLeaveYearConfiguration: leaveApi.updateLeaveYearConfiguration,
  changeLeaveYearConfigurationStatus: leaveApi.changeLeaveYearConfigurationStatus,

  // Employees & Stats
  getActiveEmployeesCount: employeeApi.getActiveEmployeesCount,
  getEmployeeByCode: employeeApi.getEmployeeByCode,
  searchEmployees: employeeApi.searchEmployees,
  getEmployees: employeeApi.getEmployees,
  createEmployee: employeeApi.createEmployee,
  updateEmployee: employeeApi.updateEmployee,
  changeStatus: employeeApi.changeStatus,
  changeReportingManager: employeeApi.changeReportingManager,
  deleteEmployee: employeeApi.deleteEmployee,
  resetPassword: employeeApi.resetPassword,
  getDashboardStats: dashboardApi.getAdminStats,

  // Leave Requests (Admin)
  getLeaveRequests: leaveApi.getAllRequests,
  getLeaveRequestById: leaveApi.getRequestById,
  getLeaveRequestHistory: leaveApi.getRequestHistory,
  approveLeaveRequest: leaveApi.approveRequest,
  rejectLeaveRequest: leaveApi.rejectRequest,
  getEmployeeLeaveBalances: leaveApi.getEmployeeBalances,
};

export default adminApi;
