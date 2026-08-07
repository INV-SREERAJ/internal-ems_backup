import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import Icon from "../../components/common/Icon";
import { getEmployees } from "../../api/adminApi";
import { formatRole, formatStatus } from "../../utils/enumUtils";

/**
 * Organization Page Component
 * Visualizes the enterprise reporting hierarchy structure dynamically from API data.
 */
export default function OrganizationPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const extractItems = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.items)) return res.items;
        if (Array.isArray(res.value?.data)) return res.value.data;
        if (Array.isArray(res.value?.items)) return res.value.items;
        if (Array.isArray(res.value)) return res.value;
        return [];
    };

    useEffect(() => {
        const fetchOrgTree = async () => {
            setLoading(true);
            try {
                const res = await getEmployees({ PageSize: 100 });
                setEmployees(extractItems(res));
            } catch {
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgTree();
    }, []);

    const managers = employees.filter((e) => {
        const r = formatRole(e.role || e.Role);
        return r === "Manager" || r === "Admin";
    });

    const getReports = (managerCode) =>
        employees.filter((e) => {
            const mCode = e.managerEmployeeCode || e.ManagerEmployeeCode || e.managerId;
            return mCode === managerCode;
        });

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Organization Hierarchy", active: true },
    ];

    return (
        <PageContainer title="Organization Hierarchy" breadcrumbs={breadcrumbs}>
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>
                    Reporting Structure & Teams
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                    Visual representation of reporting managers and direct reports across the enterprise.
                </p>
            </div>

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading organization hierarchy...</div>
            ) : managers.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No reporting structures found.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {managers.map((mgr) => {
                        const mgrCode = mgr.employeeCode || mgr.EmployeeCode;
                        const mgrName = mgr.fullName || `${mgr.firstName || ""} ${mgr.lastName || ""}`.trim() || mgrCode;
                        const mgrRole = formatRole(mgr.role || mgr.Role);
                        const directReports = getReports(mgrCode);

                        return (
                            <div
                                key={mgrCode}
                                style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    padding: "24px",
                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                {/* Manager Node */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingBottom: "16px",
                                        borderBottom: "1px solid #f1f5f9",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "10px",
                                                backgroundColor: "#eff6ff",
                                                color: "#2563eb",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Icon name="briefcase" size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                                                {mgrName}
                                            </div>
                                            <div style={{ fontSize: "13px", color: "#64748b" }}>
                                                Code: <span style={{ color: "#2563eb", fontWeight: "600" }}>{mgrCode}</span> | Email: {mgr.email || mgr.Email}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge type="role" value={mgrRole} />
                                </div>

                                {/* Direct Reports Section */}
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                                        Direct Reports ({directReports.length})
                                    </div>

                                    {directReports.length === 0 ? (
                                        <div style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", padding: "8px 0" }}>
                                            No direct reports assigned to this manager yet.
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                                            {directReports.map((report) => {
                                                const repCode = report.employeeCode || report.EmployeeCode;
                                                const repName = report.fullName || `${report.firstName || ""} ${report.lastName || ""}`.trim() || repCode;
                                                const repRole = formatRole(report.role || report.Role);
                                                const repStatus = formatStatus(report.status || report.Status);

                                                return (
                                                    <div
                                                        key={repCode}
                                                        style={{
                                                            backgroundColor: "#f8fafc",
                                                            border: "1px solid #e2e8f0",
                                                            borderRadius: "8px",
                                                            padding: "14px",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: "8px",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{repName}</span>
                                                            <Badge type="role" value={repRole} />
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                                                            Code: <span style={{ color: "#2563eb", fontWeight: "600" }}>{repCode}</span>
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                                                            Email: {report.email || report.Email}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                                            <Badge type="status" value={repStatus} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageContainer>
    );
}
