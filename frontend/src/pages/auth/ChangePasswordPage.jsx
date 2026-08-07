import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import Icon from "../../components/common/Icon";
import PasswordInput from "../../components/common/PasswordInput";
import { changePassword } from "../../api/profileApi";
import useAuth from "../../hooks/useAuth";
import { formatErrorMessage } from "../../utils/errorUtils";

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMessage("New password and confirm password do not match.");
            return;
        }

        setLoading(true);
        try {
            await changePassword(passwordData);
            setSuccessMessage("Password updated successfully! Redirecting...");

            if (user) {
                setUser({ ...user, mustChangePassword: false });
            }

            setTimeout(() => {
                if (user?.role === "Admin") {
                    navigate("/admin/dashboard", { replace: true });
                } else {
                    navigate("/employee/dashboard", { replace: true });
                }
            }, 1500);
        } catch (err) {
            setErrorMessage(formatErrorMessage(err, "Failed to update password."));
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Change Password", active: true },
    ];

    return (
        <PageContainer title="Account Security" breadcrumbs={breadcrumbs}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "32px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: "24px" }}>
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                backgroundColor: "#eff6ff",
                                color: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 12px auto",
                            }}
                        >
                            <Icon name="key" size={24} />
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
                            Change Your Password
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                            {user?.mustChangePassword
                                ? "Please set a new secure password before continuing."
                                : "Update your account password to keep your account secure."}
                        </p>
                    </div>

                    {successMessage && (
                        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center" }}>
                            {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center" }}>
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "6px", fontWeight: "500" }}>Current Password</label>
                            <PasswordInput
                                required
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "6px", fontWeight: "500" }}>New Password</label>
                            <PasswordInput
                                required
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "6px", fontWeight: "500" }}>Confirm Password</label>
                            <PasswordInput
                                required
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "none",
                                fontWeight: "600",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                marginTop: "8px",
                                fontSize: "14px",
                            }}
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
}