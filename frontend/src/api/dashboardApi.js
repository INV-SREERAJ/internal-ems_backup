import api from "./axios";

/**
 * Dashboard API client services
 */
export const dashboardApi = {
  // Admin dashboard metrics
  getAdminStats: async () => {
    const response = await api.get("/dashboard/admin");
    return response.data;
  },

  // Manager team dashboard metrics
  getManagerStats: async () => {
    const response = await api.get("/dashboard/manager");
    return response.data;
  },
};

export default dashboardApi;
