import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import useAuth from "../../hooks/useAuth";
import Badge from "../../components/common/Badge";
import { getEmployees } from "../../api/adminApi";
import { formatRole, formatStatus } from "../../utils/enumUtils";

/**
 * Admin Dashboard Page
 * Renders summary metrics, quick actions, recent employees, and organizational hierarchy overview.
 */
export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        reportingManagers: 0,
    });
    const [recentEmployees, setRecentEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const getCount = (res) => {
        if (!res || res.status !== "fulfilled") return 0;
        const val = res.value;
        if (!val) return 0;
        if (typeof val.totalCount === "number") return val.totalCount;
        if (typeof val.TotalCount === "number") return val.TotalCount;
        if (typeof val.totalItems === "number") return val.totalItems;
        if (Array.isArray(val.data)) return val.data.length;
        if (Array.isArray(val.items)) return val.items.length;
        if (Array.isArray(val)) return val.length;
        return 0;
    };

    const getItems = (res) => {
        if (!res || res.status !== "fulfilled") return [];
        const val = res.value;
        if (!val) return [];
        if (Array.isArray(val.data)) return val.data;
        if (Array.isArray(val.items)) return val.items;
        if (Array.isArray(val)) return val;
        return [];
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch stats from backend API endpoints
                // Backend EmployeeStatus enum: Active = 1, Inactive = 2, Deleted = 9
                const [activeRes, inactiveRes, managersRes, recentRes] = await Promise.allSettled([
                    getEmployees({ Status: 1, PageSize: 1 }),
                    getEmployees({ Status: 2, PageSize: 1 }),
                    getEmployees({ Role: "Manager", PageSize: 1 }),
                    getEmployees({ PageNumber: 1, PageSize: 5 }),
                ]);

                const activeCount = getCount(activeRes);
                const inactiveCount = getCount(inactiveRes);
                const managerCount = getCount(managersRes);
                const recents = getItems(recentRes);

                setStats({
                    totalEmployees: activeCount + inactiveCount,
                    activeEmployees: activeCount,
                    inactiveEmployees: inactiveCount,
                    reportingManagers: managerCount,
                });
                setRecentEmployees(recents);
            } catch {
                // Fallback default state
                setStats({
                    totalEmployees: 0,
                    activeEmployees: 0,
                    inactiveEmployees: 0,
                    reportingManagers: 0,
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
        <PageContainer title="Admin Dashboard Overview" breadcrumbs={breadcrumbs}>
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
                        Centralized administration and enterprise workforce overview.
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
                    <strong style={{ color: "#ffffff" }}>Role:</strong> Administrator |{" "}
                    <strong style={{ color: "#ffffff" }}>Code:</strong> {user?.employeeCode || "ADM001"}
                </div>
            </div>

            {/* Metric Summary Cards Grid */}
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
                    <div className="ems-stat-card-desc">Total registered workforce</div>
                </div>

                {/* Active Employees */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Active Employees</span>
                        <div className="ems-stat-card-icon managers">🟢</div>
                    </div>
                    <div className="ems-stat-card-value">
                        {loading ? "..." : stats.activeEmployees}
                    </div>
                    <div className="ems-stat-card-desc">Active account status</div>
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
                    <div className="ems-stat-card-desc">Deactivated account status</div>
                </div>

                {/* Reporting Managers */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Reporting Managers</span>
                        <div className="ems-stat-card-icon deleted">👔</div>
                    </div>
                    <div className="ems-stat-card-value">
                        {loading ? "..." : stats.reportingManagers}
                    </div>
                    <div className="ems-stat-card-desc">Assigned team supervisors</div>
                </div>
            </div>

            {/* Quick Actions & Hierarchy Overview */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                }}
            >
                {/* Quick Actions */}
                <div
                    style={{
                        backgroundColor: "#131b2e",
                        border: "1px solid #31394d",
                        borderRadius: "12px",
                        padding: "24px",
                    }}
                >
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff", marginBottom: "16px" }}>
                        Quick Actions
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/employees")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                backgroundColor: "#1a2235",
                                border: "1px solid #31394d",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <span>➕ Add New Employee</span>
                            <span style={{ color: "#f97316" }}>→</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/admin/employees")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                backgroundColor: "#1a2235",
                                border: "1px solid #31394d",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <span>👥 View All Employees</span>
                            <span style={{ color: "#f97316" }}>→</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/admin/organization")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                backgroundColor: "#1a2235",
                                border: "1px solid #31394d",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <span>🏢 View Organization Hierarchy</span>
                            <span style={{ color: "#f97316" }}>→</span>
                        </button>
                    </div>
                </div>

                {/* Organization Summary Card */}
                <div
                    style={{
                        backgroundColor: "#131b2e",
                        border: "1px solid #31394d",
                        borderRadius: "12px",
                        padding: "24px",
                    }}
                >
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff", marginBottom: "16px" }}>
                        Organization Hierarchy Summary
                    </h3>
                    <p style={{ color: "#a0a5b2", fontSize: "14px", marginBottom: "20px" }}>
                        Enterprise structure powered by Reporting Manager assignments and role-based policies.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "#1a2235",
                                borderRadius: "8px",
                                borderLeft: "4px solid #f97316",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>Administrators</div>
                                <div style={{ fontSize: "12px", color: "#a0a5b2" }}>Full system management & employee creation</div>
                            </div>
                            <Badge type="role" value="Admin" />
                        </div>

                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "#1a2235",
                                borderRadius: "8px",
                                borderLeft: "4px solid #3b82f6",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>Reporting Managers</div>
                                <div style={{ fontSize: "12px", color: "#a0a5b2" }}>Direct report team management</div>
                            </div>
                            <Badge type="role" value="Manager" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Employees Table Section */}
            <div
                style={{
                    backgroundColor: "#131b2e",
                    border: "1px solid #31394d",
                    borderRadius: "12px",
                    padding: "24px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>
                        Recent Employees
                    </h3>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/employees")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#f97316",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                    >
                        View All →
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: "20px", color: "#a0a5b2", textAlign: "center" }}>Loading employees...</div>
                ) : recentEmployees.length === 0 ? (
                    <div style={{ padding: "20px", color: "#a0a5b2", textAlign: "center" }}>No employees found.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #31394d", color: "#a0a5b2" }}>
                                    <th style={{ padding: "12px 16px" }}>Code</th>
                                    <th style={{ padding: "12px 16px" }}>Name</th>
                                    <th style={{ padding: "12px 16px" }}>Email</th>
                                    <th style={{ padding: "12px 16px" }}>Role</th>
                                    <th style={{ padding: "12px 16px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEmployees.map((emp) => {
                                    const code = emp.employeeCode || emp.EmployeeCode;
                                    const name = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || code;
                                    const email = emp.email || emp.Email;

                                    return (
                                        <tr key={code} style={{ borderBottom: "1px solid #1a2235" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: "600", color: "#f97316" }}>
                                                {code}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#ffffff" }}>
                                                {name}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#a0a5b2" }}>
                                                {email}
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <Badge type="role" value={formatRole(emp.role || emp.Role)} />
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <Badge type="status" value={formatStatus(emp.status ?? emp.Status ?? (emp.isActive ? 1 : 2))} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
