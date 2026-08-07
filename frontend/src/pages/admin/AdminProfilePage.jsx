import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import Icon from "../../components/common/Icon";
import PasswordInput from "../../components/common/PasswordInput";
import { getProfile, updateProfile, changePassword } from "../../api/profileApi";
import { formatErrorMessage } from "../../utils/errorUtils";

export default function AdminProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState("");

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [profileSuccess, setProfileSuccess] = useState(null);
    const [profileError, setProfileError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                const data = await getProfile();
                setProfile(data?.value || data);
                setPhoneNumber(data?.phoneNumber || data?.PhoneNumber || "");
            } catch (err) {
                setProfileError(formatErrorMessage(err, "Failed to load profile details."));
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSuccess(null);
        setProfileError(null);
        try {
            const updated = await updateProfile({ phoneNumber });
            setProfile(updated?.value || updated);
            setProfileSuccess("Profile updated successfully!");
        } catch (err) {
            setProfileError(formatErrorMessage(err, "Failed to update profile."));
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordSuccess(null);
        setPasswordError(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }

        try {
            await changePassword(passwordData);
            setPasswordSuccess("Password changed successfully!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setPasswordError(formatErrorMessage(err, "Failed to change password."));
        }
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "My Profile", active: true },
    ];

    return (
        <PageContainer title="My Profile" breadcrumbs={breadcrumbs}>
            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading profile...</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                    {/* Profile Information Card */}
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
                            Profile Details
                        </h3>

                        {profileSuccess && (
                            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                                {profileSuccess}
                            </div>
                        )}

                        {profileError && (
                            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                                {profileError}
                            </div>
                        )}

                        {profile && (
                            <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Employee Code</label>
                                    <input disabled value={profile.employeeCode || profile.EmployeeCode} className="ems-login-input" style={{ backgroundColor: "#f8fafc", cursor: "not-allowed", fontWeight: "600", color: "#2563eb" }} />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>First Name</label>
                                        <input disabled value={profile.firstName || profile.FirstName} className="ems-login-input" style={{ backgroundColor: "#f8fafc", cursor: "not-allowed" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Last Name</label>
                                        <input disabled value={profile.lastName || profile.LastName} className="ems-login-input" style={{ backgroundColor: "#f8fafc", cursor: "not-allowed" }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Email Address</label>
                                    <input disabled value={profile.email || profile.Email} className="ems-login-input" style={{ backgroundColor: "#f8fafc", cursor: "not-allowed" }} />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Role</label>
                                    <div style={{ marginTop: "4px" }}><Badge type="role" value={profile.role || profile.Role} /></div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Phone Number</label>
                                    <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="ems-login-input" />
                                </div>

                                <button type="submit" style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>
                                    Update Contact Info
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Change Password Card */}
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Icon name="key" size={18} color="#2563eb" />
                            <span>Security & Password</span>
                        </h3>

                        {passwordSuccess && (
                            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                                {passwordSuccess}
                            </div>
                        )}

                        {passwordError && (
                            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Current Password</label>
                                <PasswordInput required value={passwordData.currentPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>New Password</label>
                                <PasswordInput required value={passwordData.newPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Confirm Password</label>
                                <PasswordInput required value={passwordData.confirmPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
                            </div>

                            <button type="submit" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#2563eb", padding: "12px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
