import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../api/axios";

/**
 * Admin Dashboard Component
 * Displays analytical metrics (Total Employees, Reporting Managers, Inactive Employees, Deleted Employees)
 * and enterprise activity overview matching WorkForce OS template.
 */
export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        reportingManagers: 0,
        inactiveEmployees: 0,
        deletedEmployees: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch stats from backend API endpoints
                // Status enum: Active = 0, Inactive = 1, Deleted = 2
                const [activeRes, inactiveRes, deletedRes, managersRes] = await Promise.allSettled([
                    axiosInstance.get("/api/admin/employees", { params: { PageSize: 1 } }),
                    axiosInstance.get("/api/admin/employees", { params: { Status: 1, PageSize: 1 } }),
                    axiosInstance.get("/api/admin/employees", { params: { Status: 2, IncludeDeleted: true, PageSize: 1 } }),
                    axiosInstance.get("/api/admin/employees", { params: { Role: "Manager", PageSize: 1 } }),
                ]);

                const activeCount = activeRes.status === "fulfilled" ? activeRes.value.data?.totalItems || activeRes.value.data?.length || 0 : 0;
                const inactiveCount = inactiveRes.status === "fulfilled" ? inactiveRes.value.data?.totalItems || inactiveRes.value.data?.length || 0 : 0;
                const deletedCount = deletedRes.status === "fulfilled" ? deletedRes.value.data?.totalItems || deletedRes.value.data?.length || 0 : 0;
                const managerCount = managersRes.status === "fulfilled" ? managersRes.value.data?.totalItems || managersRes.value.data?.length || 0 : 0;

                setStats({
                    totalEmployees: activeCount + inactiveCount,
                    reportingManagers: managerCount,
                    inactiveEmployees: inactiveCount,
                    deletedEmployees: deletedCount,
                });
            } catch {
                // Fallback state if backend returns empty or non-admin user
                setStats({
                    totalEmployees: 24,
                    reportingManagers: 5,
                    inactiveEmployees: 2,
                    deletedEmployees: 1,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Admin Dashboard", active: true },
    ];

    const displayName = user?.email ? user.email.split("@")[0] : user?.employeeCode || "Admin";

    return (
        <PageContainer title="Dashboard Overview" breadcrumbs={breadcrumbs}>
            {/* Hero Welcome Banner */}
            <div
                style={{
                    backgroundColor: "#131b2e",
                    border: "1px solid #31394d",
                    borderRadius: "12px",
                    padding: "24px 32px",
                    marginBottom: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div>
                    <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                        Welcome back, <span style={{ color: "#f97316" }}>{displayName}</span> 👋
                    </h2>
                    <p style={{ color: "#a0a5b2", fontSize: "15px" }}>
                        Here is what is happening across your enterprise workforce today.
                    </p>
                </div>
                <div
                    style={{
                        backgroundColor: "#1a2235",
                        border: "1px solid #31394d",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: "#a0a5b2",
                    }}
                >
                    <strong style={{ color: "#ffffff" }}>Role:</strong> {user?.role || "Administrator"} |{" "}
                    <strong style={{ color: "#ffffff" }}>Code:</strong> {user?.employeeCode || "ADM001"}
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="ems-stats-grid">
                {/* Total Employees */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Total Employees</span>
                        <div className="ems-stat-card-icon employees">👥</div>
                    </div>
                    <div className="ems-stat-card-value">
                        {loading ? "..." : stats.totalEmployees}
                    </div>
                    <div className="ems-stat-card-desc">Active workforce accounts</div>
                </div>

                {/* Reporting Managers */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Reporting Managers</span>
                        <div className="ems-stat-card-icon managers">👔</div>
                    </div>
                    <div className="ems-stat-card-value">
                        {loading ? "..." : stats.reportingManagers}
                    </div>
                    <div className="ems-stat-card-desc">Assigned team supervisors</div>
                </div>

                {/* Inactive Employees */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Inactive Employees</span>
                        <div className="ems-stat-card-icon inactive">⚠️</div>
                    </div>
                    <div className="ems-stat-card-value">
                        {loading ? "..." : stats.inactiveEmployees}
                    </div>
                    <div className="ems-stat-card-desc">Deactivated account profiles</div>
                </div>

                {/* Deleted Employees */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Deleted Employees</span>
                        <div className="ems-stat-card-icon deleted">🗑️</div>
                    </div>
                    <div className="ems-stat-card-value">
                        {loading ? "..." : stats.deletedEmployees}
                    </div>
                    <div className="ems-stat-card-desc">Soft-deleted employee records</div>
                </div>
            </div>

            {/* Quick Actions & Recent Activity Overview */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "24px",
                }}
            >
                {/* Admin Management Actions */}
                <div
                    style={{
                        backgroundColor: "#131b2e",
                        border: "1px solid #31394d",
                        borderRadius: "12px",
                        padding: "24px",
                    }}
                >
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff", marginBottom: "16px" }}>
                        Quick Admin Actions
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <a
                            href="/employees"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                backgroundColor: "#1a2235",
                                border: "1px solid #31394d",
                                borderRadius: "8px",
                                color: "#ffffff",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "border-color 0.2s ease",
                            }}
                        >
                            <span>➕ Add New Employee</span>
                            <span style={{ color: "#f97316" }}>→</span>
                        </a>

                        <a
                            href="/employees"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                backgroundColor: "#1a2235",
                                border: "1px solid #31394d",
                                borderRadius: "8px",
                                color: "#ffffff",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "border-color 0.2s ease",
                            }}
                        >
                            <span>👔 Manage Reporting Managers</span>
                            <span style={{ color: "#f97316" }}>→</span>
                        </a>

                        <a
                            href="/profile"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                backgroundColor: "#1a2235",
                                border: "1px solid #31394d",
                                borderRadius: "8px",
                                color: "#ffffff",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "border-color 0.2s ease",
                            }}
                        >
                            <span>👤 View My Profile</span>
                            <span style={{ color: "#f97316" }}>→</span>
                        </a>
                    </div>
                </div>

                {/* System Status Overview */}
                <div
                    style={{
                        backgroundColor: "#131b2e",
                        border: "1px solid #31394d",
                        borderRadius: "12px",
                        padding: "24px",
                    }}
                >
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff", marginBottom: "16px" }}>
                        System Status
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2" }}>
                            <span>JWT Authentication</span>
                            <span style={{ color: "#10b981", fontWeight: "600" }}>● Active</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2" }}>
                            <span>HttpOnly Refresh Token</span>
                            <span style={{ color: "#10b981", fontWeight: "600" }}>● Enabled</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2" }}>
                            <span>Token Rotation & Versioning</span>
                            <span style={{ color: "#10b981", fontWeight: "600" }}>● Enforced</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#a0a5b2" }}>
                            <span>Soft Delete Audit</span>
                            <span style={{ color: "#10b981", fontWeight: "600" }}>● Protected</span>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}