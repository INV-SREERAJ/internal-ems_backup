import api from "./axios";

/**
 * Leave API client services
 */
export const leaveApi = {
  // Get active leave types
  getLeaveTypeOptions: async () => {
    const response = await api.get("/leave-types/options");
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
};

export default leaveApi;

