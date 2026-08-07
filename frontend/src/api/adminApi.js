import axiosInstance from "./axios";
import { parseRoleToEnum, parseStatusToEnum } from "../utils/enumUtils";

/**
 * Admin API Service
 * Encapsulates all backend administrative endpoints.
 */

// Fetch employees with pagination, searching, filtering, and sorting
export async function getEmployees(params = {}) {
    const apiParams = { ...params };
    if (apiParams.Role) {
        apiParams.Role = parseRoleToEnum(apiParams.Role);
    }
    if (apiParams.Status !== undefined && apiParams.Status !== null && apiParams.Status !== "") {
        apiParams.Status = parseStatusToEnum(apiParams.Status);
    }
    const response = await axiosInstance.get("/admin/employees", { params: apiParams });
    return response.data;
}

// Fetch details for a specific employee by EmployeeCode
export async function getEmployeeByCode(employeeCode) {
    const response = await axiosInstance.get(`/admin/employees/${employeeCode}`);
    return response.data;
}

// Create a new employee (Payload matches CreateEmployeeRequest DTO)
export async function createEmployee(data) {
    const payload = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        role: parseRoleToEnum(data.role),
        managerEmployeeCode: data.managerEmployeeCode || data.managerId || null,
    };
    const response = await axiosInstance.post("/admin/employees", payload);
    return response.data;
}

// Update existing employee details (Payload matches UpdateEmployeeRequest DTO)
export async function updateEmployee(employeeCode, data) {
    const payload = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        role: parseRoleToEnum(data.role),
    };
    const response = await axiosInstance.put(`/admin/employees/${employeeCode}`, payload);
    return response.data;
}

// Change employee status (Active = 1, Inactive = 2, Deleted = 9)
export async function changeEmployeeStatus(employeeCode, status) {
    const payload = {
        status: parseStatusToEnum(status),
    };
    const response = await axiosInstance.patch(`/admin/employees/${employeeCode}/status`, payload);
    return response.data;
}

// Change reporting manager for an employee
export async function changeReportingManager(employeeCode, managerEmployeeCode) {
    const payload = {
        managerEmployeeCode: managerEmployeeCode || "",
    };
    const response = await axiosInstance.patch(`/admin/employees/${employeeCode}/manager`, payload);
    return response.data;
}

// Soft delete an employee
export async function deleteEmployee(employeeCode) {
    const response = await axiosInstance.delete(`/admin/employees/${employeeCode}`);
    return response.data;
}

// Reset password for an employee and send email
export async function resetEmployeePassword(employeeCode) {
    const response = await axiosInstance.post(`/admin/employees/${employeeCode}/reset-password`);
    return response.data;
}
