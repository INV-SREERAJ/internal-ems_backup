import axiosInstance from "./axios";

/**
 * Manager API Service
 * Manages fetching assigned team members for Managers.
 */

// Fetch assigned team members for the logged-in manager
export async function getAssignedEmployees(params = {}) {
    const response = await axiosInstance.get("/manager/employees", { params });
    return response.data;
}

// Fetch specific assigned team member details
export async function getAssignedEmployee(employeeCode) {
    const response = await axiosInstance.get(`/manager/employees/${employeeCode}`);
    return response.data;
}
