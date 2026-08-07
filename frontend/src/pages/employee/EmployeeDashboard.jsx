import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import { getProfile } from "../../api/profileApi";

export default function EmployeeDashboard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                const data = await getProfile();
                setProfile(data);
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
                <div style={{ padding: "40px", textAlign: "center", color: "#a0a5b2" }}>Loading dashboard...</div>
            ) : profile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Welcome Banner */}
                    <div
                        style={{
                            backgroundColor: "#131b2e",
                            border: "1px solid #31394d",
                            borderRadius: "12px",
                            padding: "24px 32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                                Welcome, <span style={{ color: "#f97316" }}>{profile.firstName} {profile.lastName}</span> 👋
                            </h2>
                            <p style={{ color: "#a0a5b2", fontSize: "15px" }}>
                                Access your personal profile, manager information, and organization hierarchy.
                            </p>
                        </div>
                        <Badge type="role" value={profile.role} />
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
                                backgroundColor: "#131b2e",
                                border: "1px solid #31394d",
                                borderRadius: "12px",
                                padding: "24px",
                            }}
                        >
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "16px" }}>
                                👤 My Profile Summary
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2", borderBottom: "1px solid #1a2235", paddingBottom: "8px" }}>
                                    <span>Employee Code</span>
                                    <strong style={{ color: "#f97316" }}>{profile.employeeCode}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2", borderBottom: "1px solid #1a2235", paddingBottom: "8px" }}>
                                    <span>Email Address</span>
                                    <span style={{ color: "#ffffff" }}>{profile.email}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2", borderBottom: "1px solid #1a2235", paddingBottom: "8px" }}>
                                    <span>Phone Number</span>
                                    <span style={{ color: "#ffffff" }}>{profile.phoneNumber || "Not provided"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2" }}>
                                    <span>Role</span>
                                    <Badge type="role" value={profile.role} />
                                </div>
                            </div>
                        </div>

                        {/* Reporting Manager Card */}
                        <div
                            style={{
                                backgroundColor: "#131b2e",
                                border: "1px solid #31394d",
                                borderRadius: "12px",
                                padding: "24px",
                            }}
                        >
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "16px" }}>
                                👔 Reporting Manager
                            </h3>
                            {profile.managerName || profile.managerEmployeeCode ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2", borderBottom: "1px solid #1a2235", paddingBottom: "8px" }}>
                                        <span>Manager Name</span>
                                        <strong style={{ color: "#ffffff" }}>{profile.managerName || "Assigned Manager"}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2" }}>
                                        <span>Manager Code</span>
                                        <span style={{ color: "#f97316" }}>{profile.managerEmployeeCode}</span>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: "#a0a5b2", fontSize: "14px", fontStyle: "italic" }}>
                                    No reporting manager currently assigned to your profile.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#a0a5b2" }}>Unable to load profile data.</div>
            )}
        </PageContainer>
    );
}
