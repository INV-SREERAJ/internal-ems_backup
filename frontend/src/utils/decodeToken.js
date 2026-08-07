import { jwtDecode } from "jwt-decode";

export function decodeToken(token) {
    const decoded = jwtDecode(token);

    return {
        employeeCode: decoded.EmployeeCode,
        email: decoded.email,
        role: decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ],
    };
}