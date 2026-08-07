import axiosInstance from "./axios";

/**
 * Profile API Service
 * Manages user profile retrieval, profile updates, and password changes.
 */

// Fetch logged-in user profile details
export async function getProfile() {
    const response = await axiosInstance.get("/profile");
    return response.data;
}

// Update profile details (e.g. phone number)
export async function updateProfile(data) {
    const response = await axiosInstance.put("/profile", data);
    return response.data;
}

// Change user password (Payload sends OldPassword, NewPassword, ConfirmPassword for ASP.NET DTO validation)
export async function changePassword(data) {
    const oldPass = data.currentPassword || data.oldPassword || "";
    const newPass = data.newPassword || "";
    const confirmPass = data.confirmPassword || "";

    const payload = {
        oldPassword: oldPass,
        OldPassword: oldPass,
        newPassword: newPass,
        NewPassword: newPass,
        confirmPassword: confirmPass,
        ConfirmPassword: confirmPass,
    };
    const response = await axiosInstance.post("/profile/change-password", payload);
    return response.data;
}
