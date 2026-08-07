/**
 * Enum Mapping Utilities for Backend ASP.NET Core Enums
 *
 * Backend Enums:
 * Role: Admin = 1, Employee = 2, Manager = 3
 * EmployeeStatus: Active = 1, Inactive = 2, Deleted = 9
 */

export const ROLE_ENUM = {
    Admin: 1,
    Employee: 2,
    Manager: 3,
    1: "Admin",
    2: "Employee",
    3: "Manager",
};

export const STATUS_ENUM = {
    Active: 1,
    Inactive: 2,
    Deleted: 9,
    1: "Active",
    2: "Inactive",
    9: "Deleted",
};

// Convert string/int role to integer enum for API request payloads
export function parseRoleToEnum(role) {
    if (role === null || role === undefined || role === "") return undefined;
    if (role === 1 || role === "1" || role === "Admin") return ROLE_ENUM.Admin; // 1
    if (role === 2 || role === "2" || role === "Employee") return ROLE_ENUM.Employee; // 2
    if (role === 3 || role === "3" || role === "Manager") return ROLE_ENUM.Manager; // 3
    if (role === 0 || role === "0") return ROLE_ENUM.Admin; // Fallback 0 -> 1
    return Number(role) || ROLE_ENUM.Employee;
}

// Convert integer/string role to display string
export function formatRole(role) {
    if (typeof role === "number") return ROLE_ENUM[role] || "Employee";
    return role || "Employee";
}

// Convert string/int status to integer enum for API request payloads (Active = 1, Inactive = 2, Deleted = 9)
export function parseStatusToEnum(status) {
    if (status === null || status === undefined || status === "") return undefined;
    if (status === 1 || status === "Active") return STATUS_ENUM.Active; // 1
    if (status === 2 || status === "Inactive") return STATUS_ENUM.Inactive; // 2
    if (status === 9 || status === "Deleted") return STATUS_ENUM.Deleted; // 9
    if (status === 0 || status === "0") return STATUS_ENUM.Active; // 0 is invalid in backend -> map 0 to 1 (Active)
    if (status === "1") return STATUS_ENUM.Active; // 1
    if (status === "2") return STATUS_ENUM.Inactive; // 2
    return Number(status) || STATUS_ENUM.Active;
}

// Convert integer/string status to display string
export function formatStatus(status) {
    if (typeof status === "number") return STATUS_ENUM[status] || "Active";
    return status || "Active";
}
