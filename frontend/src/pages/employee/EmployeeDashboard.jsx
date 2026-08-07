import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import Icon from "../../components/common/Icon";
import { getProfile } from "../../api/profileApi";

export default function EmployeeDashboard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                const data = await getProfile();
                setProfile(data?.value || data);
            } catch {
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Employee Dashboard", active: true },
    ];

    return (
        <PageContainer title="Employee Dashboard" breadcrumbs={breadcrumbs}>
            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>
            ) : profile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Welcome Banner */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "24px 32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "16px",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <div>
                            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                                Welcome back, <span style={{ color: "#2563eb" }}>{profile.firstName || profile.FirstName} {profile.lastName || profile.LastName}</span>
                            </h2>
                            <p style={{ color: "#64748b", fontSize: "14px" }}>
                                Access your personal profile, manager information, and organization hierarchy.
                            </p>
                        </div>
                        <Badge type="role" value={profile.role || profile.Role} />
                    </div>

                    {/* Cards Grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: "24px",
                        }}
                    >
                        {/* Profile Summary Card */}
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "24px",
                                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                            }}
                        >
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Icon name="user" size={18} color="#2563eb" />
                                <span>My Profile Summary</span>
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                    <span>Employee Code</span>
                                    <strong style={{ color: "#2563eb" }}>{profile.employeeCode || profile.EmployeeCode}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                    <span>Email Address</span>
                                    <span style={{ color: "#0f172a" }}>{profile.email || profile.Email}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                    <span>Phone Number</span>
                                    <span style={{ color: "#0f172a" }}>{profile.phoneNumber || profile.PhoneNumber || "Not provided"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                    <span>Role</span>
                                    <Badge type="role" value={profile.role || profile.Role} />
                                </div>
                            </div>
                        </div>

                        {/* Reporting Manager Card */}
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "24px",
                                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                            }}
                        >
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Icon name="briefcase" size={18} color="#2563eb" />
                                <span>Reporting Manager</span>
                            </h3>
                            {profile.managerName || profile.ManagerName || profile.managerEmployeeCode || profile.ManagerEmployeeCode ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                        <span>Manager Name</span>
                                        <strong style={{ color: "#0f172a" }}>{profile.managerName || profile.ManagerName || "Assigned Manager"}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                        <span>Manager Code</span>
                                        <span style={{ color: "#2563eb", fontWeight: "600" }}>{profile.managerEmployeeCode || profile.ManagerEmployeeCode}</span>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>
                                    No reporting manager currently assigned to your profile.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Unable to load profile data.</div>
            )}
        </PageContainer>
    );
}
