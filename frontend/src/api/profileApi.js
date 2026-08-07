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

// Change user password
export async function changePassword(data) {
    const response = await axiosInstance.post("/profile/change-password", data);
    return response.data;
}
