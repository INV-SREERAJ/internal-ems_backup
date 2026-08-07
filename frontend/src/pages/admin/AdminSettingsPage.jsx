import PageContainer from "../../components/layout/PageContainer";

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
                        backgroundColor: "#131b2e",
                        border: "1px solid #31394d",
                        borderRadius: "12px",
                        padding: "24px",
                    }}
                >
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
                        Backend Security Enforcements
                    </h3>
                    <p style={{ color: "#a0a5b2", fontSize: "14px", marginBottom: "20px" }}>
                        Configured security policies active on the ASP.NET Core API backend.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ padding: "16px", backgroundColor: "#1a2235", borderRadius: "8px", border: "1px solid #31394d" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#ffffff" }}>JWT Access Token & HttpOnly Refresh Cookie</strong>
                                <span style={{ color: "#10b981", fontWeight: "600", fontSize: "13px" }}>Active</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#a0a5b2", margin: 0 }}>
                                Short-lived JWTs stored in memory. Refresh tokens stored in encrypted HttpOnly, SameSite, Secure cookies.
                            </p>
                        </div>

                        <div style={{ padding: "16px", backgroundColor: "#1a2235", borderRadius: "8px", border: "1px solid #31394d" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#ffffff" }}>Token Versioning & Grace Cache</strong>
                                <span style={{ color: "#10b981", fontWeight: "600", fontSize: "13px" }}>Enforced</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#a0a5b2", margin: 0 }}>
                                Every employee has a TokenVersion. Incrementing TokenVersion revokes all issued refresh tokens instantly across devices without DB refresh tokens.
                            </p>
                        </div>

                        <div style={{ padding: "16px", backgroundColor: "#1a2235", borderRadius: "8px", border: "1px solid #31394d" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#ffffff" }}>Onboarding MustChangePassword Middleware</strong>
                                <span style={{ color: "#10b981", fontWeight: "600", fontSize: "13px" }}>Enforced</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#a0a5b2", margin: 0 }}>
                                New accounts initialized with temporary auto-generated passwords are locked by middleware until password update.
                            </p>
                        </div>

                        <div style={{ padding: "16px", backgroundColor: "#1a2235", borderRadius: "8px", border: "1px solid #31394d" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <strong style={{ color: "#ffffff" }}>Soft Delete & Audit Recovery</strong>
                                <span style={{ color: "#10b981", fontWeight: "600", fontSize: "13px" }}>Enabled</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#a0a5b2", margin: 0 }}>
                                Deleting an employee marks IsDeleted = true to preserve foreign keys and audit history.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
