import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import useAuth from "../../hooks/useAuth";
import Badge from "../../components/common/Badge";
import Icon from "../../components/common/Icon";
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
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "24px 32px",
                    marginBottom: "32px",
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
                        Welcome back, <span style={{ color: "#2563eb" }}>{displayName}</span>
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                        Centralized administration and enterprise workforce overview.
                    </p>
                </div>
                <div
                    style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#64748b",
                    }}
                >
                    <strong style={{ color: "#0f172a" }}>Role:</strong> Administrator |{" "}
                    <strong style={{ color: "#0f172a" }}>Code:</strong> {user?.employeeCode || "ADM001"}
                </div>
            </div>

            {/* Metric Summary Cards Grid */}
            <div className="ems-stats-grid">
                {/* Total Employees */}
                <div className="ems-stat-card">
                    <div className="ems-stat-card-header">
                        <span className="ems-stat-card-title">Total Employees</span>
                        <div className="ems-stat-card-icon employees">
                            <Icon name="users" size={20} />
                        </div>
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
                        <div className="ems-stat-card-icon managers">
                            <Icon name="user-check" size={20} />
                        </div>
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
                        <div className="ems-stat-card-icon inactive">
                            <Icon name="user-x" size={20} />
                        </div>
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
                        <div className="ems-stat-card-icon deleted">
                            <Icon name="briefcase" size={20} />
                        </div>
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
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "24px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
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
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                color: "#0f172a",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Icon name="plus" size={16} color="#2563eb" />
                                <span>Add New Employee</span>
                            </div>
                            <Icon name="arrow-right" size={16} color="#94a3b8" />
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/admin/employees")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                color: "#0f172a",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Icon name="users" size={16} color="#2563eb" />
                                <span>View All Employees</span>
                            </div>
                            <Icon name="arrow-right" size={16} color="#94a3b8" />
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/admin/organization")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                color: "#0f172a",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Icon name="building" size={16} color="#2563eb" />
                                <span>View Organization Hierarchy</span>
                            </div>
                            <Icon name="arrow-right" size={16} color="#94a3b8" />
                        </button>
                    </div>
                </div>

                {/* Organization Summary Card */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "24px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                        Organization Structure
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                        Role-based employee relationships and manager assignments.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "8px",
                                borderLeft: "4px solid #4338ca",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>Administrators</div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>System-wide privileges & access control</div>
                            </div>
                            <Badge type="role" value="Admin" />
                        </div>

                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "8px",
                                borderLeft: "4px solid #0284c7",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>Reporting Managers</div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Direct report team management</div>
                            </div>
                            <Badge type="role" value="Manager" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Employees Table Section */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                        Recent Employees
                    </h3>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/employees")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#2563eb",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <span>View All</span>
                        <Icon name="arrow-right" size={14} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>Loading employees...</div>
                ) : recentEmployees.length === 0 ? (
                    <div style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>No employees found.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", backgroundColor: "#f8fafc" }}>
                                    <th style={{ padding: "12px 16px", fontWeight: "600" }}>Code</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "600" }}>Name</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "600" }}>Email</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "600" }}>Role</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "600" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEmployees.map((emp) => {
                                    const code = emp.employeeCode || emp.EmployeeCode;
                                    const name = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || code;
                                    const email = emp.email || emp.Email;

                                    return (
                                        <tr key={code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: "600", color: "#2563eb" }}>
                                                {code}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "500" }}>
                                                {name}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748b" }}>
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
