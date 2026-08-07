import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import { getProfile, updateProfile, changePassword } from "../../api/profileApi";

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
                setProfile(data);
                setPhoneNumber(data.phoneNumber || "");
            } catch {
                setProfileError("Failed to load profile details.");
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
            setProfile(updated);
            setProfileSuccess("Profile updated successfully!");
        } catch (err) {
            setProfileError(err.response?.data?.message || "Failed to update profile.");
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
            setPasswordError(err.response?.data?.message || "Failed to change password.");
        }
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "My Profile", active: true },
    ];

    return (
        <PageContainer title="My Profile" breadcrumbs={breadcrumbs}>
            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#a0a5b2" }}>Loading profile...</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                    {/* Profile Information & Edit Card */}
                    <div style={{ backgroundColor: "#131b2e", border: "1px solid #31394d", borderRadius: "12px", padding: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "16px" }}>
                            Profile Details
                        </h3>

                        {profileSuccess && (
                            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#6ee7b7", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                                {profileSuccess}
                            </div>
                        )}

                        {profileError && (
                            <div style={{ backgroundColor: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.4)", color: "#fca5a5", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                                {profileError}
                            </div>
                        )}

                        {profile && (
                            <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Employee Code</label>
                                    <input disabled value={profile.employeeCode} className="ems-login-input" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>First Name</label>
                                        <input disabled value={profile.firstName} className="ems-login-input" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Last Name</label>
                                        <input disabled value={profile.lastName} className="ems-login-input" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Email Address</label>
                                    <input disabled value={profile.email} className="ems-login-input" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Role</label>
                                    <div style={{ marginTop: "4px" }}><Badge type="role" value={profile.role} /></div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Phone Number</label>
                                    <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="ems-login-input" placeholder="+1 (555) 000-0000" />
                                </div>

                                <button type="submit" style={{ backgroundColor: "#f97316", color: "#ffffff", padding: "12px", borderRadius: "6px", border: "none", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>
                                    Update Profile
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Change Password Card */}
                    <div style={{ backgroundColor: "#131b2e", border: "1px solid #31394d", borderRadius: "12px", padding: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "16px" }}>
                            Change Password
                        </h3>

                        {passwordSuccess && (
                            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#6ee7b7", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                                {passwordSuccess}
                            </div>
                        )}

                        {passwordError && (
                            <div style={{ backgroundColor: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.4)", color: "#fca5a5", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Current Password</label>
                                <input type="password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))} className="ems-login-input" placeholder="••••••••" />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>New Password</label>
                                <input type="password" required value={passwordData.newPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))} className="ems-login-input" placeholder="••••••••" />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#a0a5b2", marginBottom: "4px" }}>Confirm New Password</label>
                                <input type="password" required value={passwordData.confirmPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="ems-login-input" placeholder="••••••••" />
                            </div>

                            <button type="submit" style={{ backgroundColor: "#1a2235", border: "1px solid #31394d", color: "#f97316", padding: "12px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
