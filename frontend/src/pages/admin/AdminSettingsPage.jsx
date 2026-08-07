import PageContainer from "../../components/layout/PageContainer";
import Icon from "../../components/common/Icon";

export default function AdminSettingsPage() {
    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Settings", active: true },
    ];

    return (
        <PageContainer title="System Security & Policy Settings" breadcrumbs={breadcrumbs}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "24px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="shield" size={18} color="#2563eb" />
                        <span>Backend Security Policies</span>
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
                        Active authentication policies and data protection settings on the ASP.NET Core API backend.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>JWT Access Token & HttpOnly Refresh Cookie</strong>
                                <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>Active</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                Short-lived JWTs stored in memory. Refresh tokens stored in encrypted HttpOnly, SameSite, Secure cookies.
                            </p>
                        </div>

                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>Token Versioning & Grace Cache</strong>
                                <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>Enforced</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                Every employee has a TokenVersion. Incrementing TokenVersion revokes all issued refresh tokens instantly across devices without DB refresh tokens.
                            </p>
                        </div>

                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>Onboarding MustChangePassword Middleware</strong>
                                <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>Enforced</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                New accounts initialized with temporary auto-generated passwords are locked by middleware until password update.
                            </p>
                        </div>

                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>Soft Delete & Audit Protection</strong>
                                <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>Enabled</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                Deleting an employee marks IsDeleted = true to preserve foreign keys and audit history.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
