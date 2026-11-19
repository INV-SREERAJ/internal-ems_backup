import api from "./axios";

/**
 * Leave API client services
 */
export const leaveApi = {
  // Get leave types options (default active only, or all for filtering past records)
  getLeaveTypeOptions: async (activeOnly = true) => {
    const response = await api.get("/leave-types/options", {
      params: { activeOnly },
    });
    return response.data;
  },

  // Get active balances for the logged-in employee (optional year parameter)
  getMyBalances: async (year) => {
    const params = year ? { year } : {};
    const response = await api.get("/leave-balances/me", { params });
    return response.data;
  },

  // Get available leave years for logged-in employee
  getMyYears: async () => {
    const response = await api.get("/leave-balances/me/years");
    return response.data;
  },

  // Submit a leave request
  applyLeave: async (data) => {
    // data: { leaveTypeId: number, fromDate: "YYYY-MM-DD", toDate: "YYYY-MM-DD", reason: string }
    const response = await api.post("/leave-requests", data);
    return response.data;
  },

  // Get logged-in employee's leave requests with filters
  getMyRequests: async (filters = {}) => {
    const response = await api.get("/leave-requests/me", { params: filters });
    return response.data;
  },

  // Get details of a single leave request
  getRequestById: async (id) => {
    const response = await api.get(`/leave-requests/${id}`);
    return response.data;
  },

  // Cancel a pending leave request
  cancelRequest: async (id) => {
    const response = await api.patch(`/leave-requests/${id}/cancel`);
    return response.data;
  },

  // Get approved leave calendar events
  getCalendar: async (params) => {
    // params: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
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

  // Manager: Get team leave requests with filters
  getTeamRequests: async (filters = {}) => {
    const response = await api.get("/manager/leave-requests", { params: filters });
    return response.data;
  },

  // Manager: Get detail of a specific team leave request
  getTeamRequestById: async (id) => {
    const response = await api.get(`/manager/leave-requests/${id}`);
    return response.data;
  },

  // Manager: Get history trail of a specific team leave request
  getTeamRequestHistory: async (id) => {
    const response = await api.get(`/manager/leave-requests/${id}/history`);
    return response.data;
  },

  // Manager: Get leave balances of a direct report employee
  getEmployeeBalancesForManager: async (employeeCode, year) => {
    const params = year ? { year } : {};
    const response = await api.get(
      `/manager/employees/${employeeCode}/leave-balances`,
      { params }
    );
    return response.data;
  },

  // Manager: Approve a pending leave request
  approveTeamRequest: async (id) => {
    const response = await api.patch(`/manager/leave-requests/${id}/approve`);
    return response.data;
  },

  // Manager: Reject a pending or approved leave request
  rejectTeamRequest: async (id, rejectionReason) => {
    const response = await api.patch(
      `/manager/leave-requests/${id}/reject`,
      { rejectionReason: rejectionReason?.trim() || "Rejected by manager" }
    );
    return response.data;
  },
};

export default leaveApi;

