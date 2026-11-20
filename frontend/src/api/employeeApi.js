import api from "./axios";

/**
 * Employee API client services (Enterprise standard)
 */
export const employeeApi = {
  // Get employees (Admin gets all, Manager gets assigned team)
  getEmployees: async (params = {}) => {
    const response = await api.get("/employees", { params });
    return response.data;
  },

  // Get single employee details
  getEmployeeByCode: async (employeeCode) => {
    const response = await api.get(`/employees/${employeeCode}`);
    return response.data;
  },

  // Create new employee (Admin)
  createEmployee: async (data) => {
    const response = await api.post("/employees", data);
    return response.data;
  },

  // Update employee profile/role (Admin)
  updateEmployee: async (employeeCode, data) => {
    const response = await api.put(`/employees/${employeeCode}`, data);
    return response.data;
  },

  // Change employee status (Admin)
  changeStatus: async (employeeCode, status) => {
    const response = await api.patch(
      `/employees/${encodeURIComponent(employeeCode)}/status`,
      { status }
    );
    return response.data;
  },

  // Change reporting manager (Admin)
  changeReportingManager: async (employeeCode, managerEmployeeCode) => {
    const response = await api.patch(
      `/employees/${encodeURIComponent(employeeCode)}/manager`,
      { managerEmployeeCode }
    );
    return response.data;
  },

  // Soft delete employee (Admin)
  deleteEmployee: async (employeeCode) => {
    const response = await api.delete(
      `/employees/${encodeURIComponent(employeeCode)}`
    );
    return response.data;
  },

  // Reset employee password (Admin)
  resetPassword: async (employeeCode) => {
    const response = await api.post(
      `/employees/${encodeURIComponent(employeeCode)}/reset-password`
    );
    return response.data;
  },

  // Search employees helper
  searchEmployees: async (search, pageSize = 8) => {
    const response = await api.get("/employees", {
      params: {
        search: search?.trim() || "",
        pageSize,
        pageNumber: 1,
      },
    });
    return response.data;
  },

  // Active employees count
  getActiveEmployeesCount: async () => {
    try {
      const response = await api.get("/employees", {
        params: { status: "Active", pageSize: 1, pageNumber: 1 },
      });
      if (typeof response.data?.totalCount === "number") {
        return response.data.totalCount;
      }
    } catch {
      // Fallback handled by caller
    }
    return 0;
  },
};

export default employeeApi;
