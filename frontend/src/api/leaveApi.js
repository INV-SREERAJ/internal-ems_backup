import api from "./axios";

/**
 * Leave API client services (Unified across Employee, Manager, and Admin)
 */
export const leaveApi = {
  // Leave Types
  getLeaveTypes: async (activeOnly = false) => {
    const response = await api.get("/leave-types", { params: { activeOnly } });
    return response.data;
  },

  getLeaveTypeById: async (id) => {
    const response = await api.get(`/leave-types/${id}`);
    return response.data;
  },

  getLeaveTypeOptions: async (activeOnly = true) => {
    const response = await api.get("/leave-types/options", {
      params: { activeOnly },
    });
    return response.data;
  },

  createLeaveType: async (data) => {
    const response = await api.post("/leave-types", data);
    return response.data;
  },

  updateLeaveType: async (id, data) => {
    const response = await api.put(`/leave-types/${id}`, data);
    return response.data;
  },

  changeLeaveTypeStatus: async (id, isActive) => {
    const response = await api.patch(`/leave-types/${id}/status`, { isActive });
    return response.data;
  },

  // Yearly Leave Configurations
  getLeaveYearConfigurations: async (year) => {
    const response = await api.get("/leave-year-configurations", {
      params: { year },
    });
    return response.data;
  },

  getLeaveYearConfigurationById: async (id) => {
    const response = await api.get(`/leave-year-configurations/${id}`);
    return response.data;
  },

  createLeaveYearConfiguration: async (data) => {
    const response = await api.post("/leave-year-configurations", data);
    return response.data;
  },

  updateLeaveYearConfiguration: async (id, data) => {
    const response = await api.put(`/leave-year-configurations/${id}`, data);
    return response.data;
  },

  changeLeaveYearConfigurationStatus: async (id, isActive) => {
    const response = await api.patch(
      `/leave-year-configurations/${id}/status`,
      { isActive }
    );
    return response.data;
  },

  // Balances
  getMyBalances: async (year) => {
    const params = year ? { year } : {};
    const response = await api.get("/leave-balances/me", { params });
    return response.data;
  },

  getMyYears: async () => {
    const response = await api.get("/leave-balances/me/years");
    return response.data;
  },

  getEmployeeBalances: async (employeeCode, year) => {
    const params = year ? { year } : {};
    const response = await api.get(`/leave-balances/employees/${employeeCode}`, {
      params,
    });
    return response.data;
  },

  // Request Management
  applyLeave: async (data) => {
    const response = await api.post("/leave-requests", data);
    return response.data;
  },

  getMyRequests: async (filters = {}) => {
    const response = await api.get("/leave-requests/me", { params: filters });
    return response.data;
  },

  getTeamRequests: async (filters = {}) => {
    const response = await api.get("/leave-requests/team", { params: filters });
    return response.data;
  },

  getAllRequests: async (filters = {}) => {
    const response = await api.get("/leave-requests", { params: filters });
    return response.data;
  },

  getRequestById: async (id) => {
    const response = await api.get(`/leave-requests/${id}`);
    return response.data;
  },

  getRequestHistory: async (id) => {
    const response = await api.get(`/leave-requests/${id}/history`);
    return response.data;
  },

  cancelRequest: async (id) => {
    const response = await api.patch(`/leave-requests/${id}/cancel`);
    return response.data;
  },

  approveRequest: async (id) => {
    const response = await api.patch(`/leave-requests/${id}/approve`);
    return response.data;
  },

  rejectRequest: async (id, rejectionReason) => {
    const response = await api.patch(`/leave-requests/${id}/reject`, {
      rejectionReason: rejectionReason?.trim() || "Rejected",
    });
    return response.data;
  },

  // Calendar
  getCalendar: async (params) => {
    const response = await api.get("/leave-calendar", { params });
    return response.data;
  },

  // Get employee's manager info
  getMyManager: async () => {
    try {
      const response = await api.get("/profile/my-manager");
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  // Aliases for seamless backward compatibility
  getTeamRequestById: (id) => leaveApi.getRequestById(id),
  getTeamRequestHistory: (id) => leaveApi.getRequestHistory(id),
  getEmployeeBalancesForManager: (code, year) => leaveApi.getEmployeeBalances(code, year),
  approveTeamRequest: (id) => leaveApi.approveRequest(id),
  rejectTeamRequest: (id, reason) => leaveApi.rejectRequest(id, reason),
};

export default leaveApi;
