import api from "./axios";

/**
 * Admin API client services
 */
export const adminApi = {
  // Leave Types
  getLeaveTypes: async (activeOnly = false) => {
    const response = await api.get("/admin/leave-types", {
      params: { activeOnly },
    });
    return response.data;
  },

  getLeaveTypeById: async (id) => {
    const response = await api.get(`/admin/leave-types/${id}`);
    return response.data;
  },

  createLeaveType: async (data) => {
    const response = await api.post("/admin/leave-types", data);
    return response.data;
  },

  updateLeaveType: async (id, data) => {
    const response = await api.put(`/admin/leave-types/${id}`, data);
    return response.data;
  },

  changeLeaveTypeStatus: async (id, isActive) => {
    const response = await api.patch(`/admin/leave-types/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  // Yearly Leave Configurations
  getLeaveYearConfigurations: async (year) => {
    const response = await api.get("/admin/leave-year-configurations", {
      params: { year },
    });
    return response.data;
  },

  getLeaveYearConfigurationById: async (id) => {
    const response = await api.get(`/admin/leave-year-configurations/${id}`);
    return response.data;
  },

  createLeaveYearConfiguration: async (data) => {
    const response = await api.post("/admin/leave-year-configurations", data);
    return response.data;
  },

  updateLeaveYearConfiguration: async (id, data) => {
    const response = await api.put(`/admin/leave-year-configurations/${id}`, data);
    return response.data;
  },

  changeLeaveYearConfigurationStatus: async (id, isActive) => {
    const response = await api.patch(
      `/admin/leave-year-configurations/${id}/status`,
      { isActive }
    );
    return response.data;
  },

  // Employees count
  getActiveEmployeesCount: async () => {
    try {
      const response = await api.get("/admin/employees", {
        params: { status: "Active", pageSize: 1, pageNumber: 1 },
      });
      if (typeof response.data?.totalCount === "number") {
        return response.data.totalCount;
      }
    } catch {
      // Fallback
    }

    try {
      const stats = await api.get("/admin/stats");
      return stats.data?.activeEmployees ?? 0;
    } catch {
      return 0;
    }
  },

  // Leave Requests (Admin)
  getLeaveRequests: async (filters = {}) => {
    const response = await api.get("/admin/leave-requests", { params: filters });
    return response.data;
  },

  getLeaveRequestById: async (id) => {
    const response = await api.get(`/admin/leave-requests/${id}`);
    return response.data;
  },

  getLeaveRequestHistory: async (id) => {
    const response = await api.get(`/admin/leave-requests/${id}/history`);
    return response.data;
  },

  approveLeaveRequest: async (id) => {
    const response = await api.patch(`/admin/leave-requests/${id}/approve`);
    return response.data;
  },

  rejectLeaveRequest: async (id, rejectionReason) => {
    const response = await api.patch(`/admin/leave-requests/${id}/reject`, {
      rejectionReason: rejectionReason?.trim() || "Rejected by admin",
    });
    return response.data;
  },

  getEmployeeLeaveBalances: async (employeeCode, year) => {
    const params = year ? { year } : {};
    const response = await api.get(
      `/admin/employees/${employeeCode}/leave-balances`,
      { params }
    );
    return response.data;
  },

  getEmployeeByCode: async (employeeCode) => {
    const response = await api.get(`/admin/employees/${employeeCode}`);
    return response.data;
  },
};

export default adminApi;

