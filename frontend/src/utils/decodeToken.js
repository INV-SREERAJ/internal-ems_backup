import { jwtDecode } from "jwt-decode";

/**
 * Decode JWT Token safely
 */
export function decodeToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const decoded = jwtDecode(token);
    return {
      employeeCode: decoded.EmployeeCode || decoded.employeeCode,
      email: decoded.email || decoded.Email,
      role:
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] ||
        decoded.role ||
        decoded.Role,
    };
  } catch {
    return null;
  }
}
