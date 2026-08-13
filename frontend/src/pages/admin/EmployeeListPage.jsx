import { useState, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import Icon from "../../components/common/Icon";
import { formatRole, formatStatus } from "../../utils/enumUtils";
import {
    getEmployees,
    getEmployeeByCode,
    createEmployee,
    updateEmployee,
    changeReportingManager,
    changeEmployeeStatus,
    deleteEmployee,
    resetEmployeePassword,
} from "../../api/adminApi";

export default function EmployeeListPage() {
    const [employees, setEmployees] = useState([]);
    const [managersList, setManagersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Selected Employee Data for View/Edit
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [createdEmployeeData, setCreatedEmployeeData] = useState(null);

    // Alert Messages
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Form state for Create / Edit
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        role: "Employee",
        managerEmployeeCode: "",
    });

    // Helper to safely extract items array from API response
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

    // Fetch Employees List
    const fetchEmployeesList = async () => {
        setLoading(true);
        try {
            const params = {
                PageNumber: pageNumber,
                PageSize: 10,
            };
            if (search) params.Search = search;
            if (statusFilter !== "") {
                params.Status = statusFilter;
                if (statusFilter === "9" || statusFilter === "Deleted") {
                    params.IncludeDeleted = true;
                }
            }
            if (roleFilter) params.Role = roleFilter;

            const res = await getEmployees(params);
            const items = extractItems(res);
            setEmployees(items);
            setTotalPages(res?.totalPages ?? res?.value?.totalPages ?? 1);
        } catch {
            setErrorMessage("Failed to load employees list from API.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const params = {
                    PageNumber: pageNumber,
                    PageSize: 10,
                };
                if (search) params.Search = search;
                if (statusFilter !== "") {
                    params.Status = statusFilter;
                    if (statusFilter === "9" || statusFilter === "Deleted") {
                        params.IncludeDeleted = true;
                    }
                }
                if (roleFilter) params.Role = roleFilter;

                const res = await getEmployees(params);
                if (isMounted) {
                    const items = extractItems(res);
                    setEmployees(items);
                    setTotalPages(res?.totalPages ?? res?.value?.totalPages ?? 1);
                }
            } catch {
                if (isMounted) {
                    setErrorMessage("Failed to load employees list from API.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [pageNumber, search, statusFilter, roleFilter]);

    useEffect(() => {
        let isMounted = true;
        const loadManagers = async () => {
            try {
                const res = await getEmployees({ PageSize: 100 });
                if (isMounted) {
                    const items = extractItems(res);
                    const eligibleManagers = items.filter((e) => {
                        const r = formatRole(e.role || e.Role);
                        return r === "Manager" || r === "Admin";
                    });
                    setManagersList(eligibleManagers);
                }
            } catch {
                if (isMounted) {
                    setManagersList([]);
                }
            }
        };

        loadManagers();

        return () => {
            isMounted = false;
        };
    }, []);

    // Form input handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            role: "Employee",
            managerEmployeeCode: "",
        });
        setCreatedEmployeeData(null);
        setErrorMessage(null);
        setIsCreateModalOpen(true);
    };

    // Submit Create Form
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        try {
            const response = await createEmployee(formData);
            const createdObj = response?.value || response;
            setCreatedEmployeeData(createdObj);
            setFeedbackMessage(`Employee created successfully! Code: ${createdObj.employeeCode || createdObj.EmployeeCode}`);
            fetchEmployeesList();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.title || "Failed to create employee.";
            setErrorMessage(msg);
        }
    };

    // Open View Modal
    const handleViewDetails = async (code) => {
        try {
            const res = await getEmployeeByCode(code);
            const details = res?.value || res;
            setSelectedEmployee(details);
            setIsViewModalOpen(true);
        } catch {
            setErrorMessage(`Failed to fetch details for employee ${code}`);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = async (code) => {
        try {
            const res = await getEmployeeByCode(code);
            const details = res?.value || res;

            // Merge with list object to preserve ManagerName if not in details DTO
            const listEmp = employees.find((e) => (e.employeeCode || e.EmployeeCode) === code);
            const mergedDetails = { ...listEmp, ...details };
            setSelectedEmployee(mergedDetails);

            let first = details.firstName || "";
            let last = details.lastName || "";
            if (!first && details.fullName) {
                const parts = details.fullName.split(" ");
                first = parts[0] || "";
                last = parts.slice(1).join(" ") || "";
            }

            let mgrCode = details.managerEmployeeCode || details.ManagerEmployeeCode || details.managerCode || details.ManagerCode || "";
            const mgrName = details.managerName || details.ManagerName || listEmp?.managerName || listEmp?.ManagerName || "";

            if (!mgrCode && mgrName) {
                const targetName = mgrName.trim().toLowerCase();
                const matchedMgr = managersList.find((m) => {
                    const name = (m.fullName || `${m.firstName || ""} ${m.lastName || ""}`).trim().toLowerCase();
                    return name === targetName;
                });
                if (matchedMgr) {
                    mgrCode = matchedMgr.employeeCode || matchedMgr.EmployeeCode || "";
                }
            }

            setFormData({
                firstName: first,
                lastName: last,
                email: details.email || details.Email || "",
                phoneNumber: details.phoneNumber || details.PhoneNumber || "",
                role: formatRole(details.role || details.Role),
                managerEmployeeCode: mgrCode,
            });
            setIsEditModalOpen(true);
        } catch {
            setErrorMessage(`Failed to load employee ${code} for editing.`);
        }
    };

    // Submit Edit Form
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        try {
            const empCode = selectedEmployee.employeeCode || selectedEmployee.EmployeeCode;

            // 1. Update core profile details
            await updateEmployee(empCode, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
            });

            // 2. Update reporting manager in backend DB via PATCH /admin/employees/{empCode}/manager
            await changeReportingManager(empCode, formData.managerEmployeeCode || "");

            setIsEditModalOpen(false);
            setFeedbackMessage(`Employee ${empCode} updated successfully.`);
            fetchEmployeesList();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.title || "Failed to update employee.";
            setErrorMessage(msg);
        }
    };

    // Toggle Activate / Deactivate Status (1 = Active, 2 = Inactive)
    const handleToggleStatus = async (emp) => {
        const empCode = emp.employeeCode || emp.EmployeeCode;
        const isCurrentActive = emp.status === 1 || emp.status === "Active" || emp.isActive === true;
        const newStatus = isCurrentActive ? 2 : 1; // 2 = Inactive, 1 = Active
        const actionName = isCurrentActive ? "Deactivate" : "Activate";

        if (window.confirm(`Are you sure you want to ${actionName} employee ${empCode}?`)) {
            try {
                await changeEmployeeStatus(empCode, newStatus);
                setFeedbackMessage(`Employee ${empCode} status set to ${isCurrentActive ? "Inactive" : "Active"}.`);
                fetchEmployeesList();
            } catch (err) {
                setErrorMessage(err.response?.data?.message || `Failed to update status for ${empCode}.`);
            }
        }
    };

    // Soft Delete Employee
    const handleDelete = async (code) => {
        if (window.confirm(`Are you sure you want to soft delete employee ${code}?`)) {
            try {
                await deleteEmployee(code);
                setFeedbackMessage(`Employee ${code} soft deleted successfully.`);
                fetchEmployeesList();
            } catch (err) {
                setErrorMessage(err.response?.data?.message || `Failed to delete employee ${code}.`);
            }
        }
    };

    // Reset Employee Password
    const handleResetPassword = async (code) => {
        if (window.confirm(`Reset password and email new credentials for ${code}?`)) {
            try {
                await resetEmployeePassword(code);
                setFeedbackMessage(`Password reset link/credentials sent for employee ${code}.`);
            } catch (err) {
                setErrorMessage(err.response?.data?.message || `Failed to reset password for ${code}.`);
            }
        }
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Employees", active: true },
    ];

    return (
        <PageContainer title="Employee Directory" breadcrumbs={breadcrumbs}>
            {/* Action Header Banner */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                <div>
                    <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>
                        Employees
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                        Manage corporate accounts, role assignments, and account statuses.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    style={{
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "14px",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                    }}
                >
                    <Icon name="plus" size={18} />
                    <span>Add Employee</span>
                </button>
            </div>

            {/* Notification Banners */}
            {feedbackMessage && (
                <div
                    style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#15803d",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        fontSize: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span>{feedbackMessage}</span>
                    <button type="button" onClick={() => setFeedbackMessage(null)} style={{ background: "none", border: "none", color: "#15803d", cursor: "pointer" }}>
                        <Icon name="x" size={16} />
                    </button>
                </div>
            )}

            {errorMessage && (
                <div
                    style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        fontSize: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span>{errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage(null)} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer" }}>
                        <Icon name="x" size={16} />
                    </button>
                </div>
            )}

            {/* Filters & Search Control Bar */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "24px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    alignItems: "center",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                }}
            >
                {/* Search Bar */}
                <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                    <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                        <Icon name="search" size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by code, name, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ems-login-input"
                        style={{ paddingLeft: "36px" }}
                    />
                </div>

                {/* Status Filter */}
                <div style={{ width: "160px" }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="ems-login-input"
                    >
                        <option value="">All Statuses</option>
                        <option value="1">Active</option>
                        <option value="2">Inactive</option>
                        <option value="9">Deleted</option>
                    </select>
                </div>

                {/* Role Filter */}
                <div style={{ width: "160px" }}>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="ems-login-input"
                    >
                        <option value="">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                    </select>
                </div>
            </div>

            {/* Employees Table */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                }}
            >
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading employees...</div>
                ) : employees.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No employees match your search parameters.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b" }}>
                                    <th style={{ padding: "14px 16px", fontWeight: "600" }}>Code</th>
                                    <th style={{ padding: "14px 16px", fontWeight: "600" }}>Name</th>
                                    <th style={{ padding: "14px 16px", fontWeight: "600" }}>Email</th>
                                    <th style={{ padding: "14px 16px", fontWeight: "600" }}>Role</th>
                                    <th style={{ padding: "14px 16px", fontWeight: "600" }}>Manager</th>
                                    <th style={{ padding: "14px 16px", fontWeight: "600" }}>Status</th>
                                    <th style={{ padding: "14px 16px", fontWeight: "600", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => {
                                    const code = emp.employeeCode || emp.EmployeeCode;
                                    const name = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || code;
                                    const email = emp.email || emp.Email;
                                    const isCurrentActive = emp.status === 1 || emp.status === "Active" || emp.isActive === true;
                                    const formattedRoleStr = formatRole(emp.role || emp.Role);
                                    const formattedStatusStr = formatStatus(emp.status ?? emp.Status ?? (isCurrentActive ? 1 : 2));

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
                                                <Badge type="role" value={formattedRoleStr} />
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748b" }}>
                                                {emp.managerName || emp.ManagerName || emp.managerEmployeeCode || emp.ManagerEmployeeCode || "N/A"}
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <Badge type="status" value={formattedStatusStr} />
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDetails(code)}
                                                        title="View Details"
                                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        <Icon name="eye" size={14} />
                                                        <span>View</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(code)}
                                                        title="Edit Employee"
                                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#2563eb", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        <Icon name="edit" size={14} />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(emp)}
                                                        title={isCurrentActive ? "Deactivate" : "Activate"}
                                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: isCurrentActive ? "#b45309" : "#15803d", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        <Icon name={isCurrentActive ? "pause" : "play"} size={14} />
                                                        <span>{isCurrentActive ? "Deactivate" : "Activate"}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(code)}
                                                        title="Soft Delete"
                                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#dc2626", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        <Icon name="trash" size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div
                    style={{
                        padding: "16px 24px",
                        borderTop: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "14px",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                    }}
                >
                    <span>Page {pageNumber} of {totalPages}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                color: "#0f172a",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
                                opacity: pageNumber <= 1 ? 0.5 : 1,
                                fontSize: "13px",
                                fontWeight: "500",
                            }}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={pageNumber >= totalPages}
                            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                color: "#0f172a",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                cursor: pageNumber >= totalPages ? "not-allowed" : "pointer",
                                opacity: pageNumber >= totalPages ? 0.5 : 1,
                                fontSize: "13px",
                                fontWeight: "500",
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal: Create Employee */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Employee">
                {createdEmployeeData ? (
                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto",
                            }}
                        >
                            <Icon name="check" size={24} />
                        </div>
                        <h4 style={{ fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>Employee Account Created</h4>
                        <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "left", fontSize: "14px" }}>
                            <div style={{ marginBottom: "6px" }}><strong>Employee Code:</strong> <span style={{ color: "#2563eb", fontWeight: "600" }}>{createdEmployeeData.employeeCode || createdEmployeeData.EmployeeCode}</span></div>
                            <div style={{ marginBottom: "6px" }}><strong>Email:</strong> {createdEmployeeData.email || createdEmployeeData.Email}</div>
                            {(createdEmployeeData.temporaryPassword || createdEmployeeData.TemporaryPassword) && (
                                <div style={{ marginTop: "8px", color: "#b45309", backgroundColor: "#fffbeb", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                                    <strong>Temporary Password:</strong> {createdEmployeeData.temporaryPassword || createdEmployeeData.TemporaryPassword}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "12px", borderRadius: "6px", border: "none", fontWeight: "600", cursor: "pointer" }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>First Name</label>
                                <input name="firstName" required value={formData.firstName} onChange={handleInputChange} className="ems-login-input" />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Last Name</label>
                                <input name="lastName" required value={formData.lastName} onChange={handleInputChange} className="ems-login-input" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Email Address</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="ems-login-input" />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Phone Number</label>
                            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="ems-login-input" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Role</label>
                                <select name="role" value={formData.role} onChange={handleInputChange} className="ems-login-input">
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Reporting Manager</label>
                                <select name="managerEmployeeCode" value={formData.managerEmployeeCode} onChange={handleInputChange} className="ems-login-input">
                                    <option value="">None / Top Level</option>
                                    {managersList.map((m) => {
                                        const code = m.employeeCode || m.EmployeeCode;
                                        const name = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || code;
                                        return (
                                            <option key={code} value={code}>
                                                {name} ({code})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <button type="submit" style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>
                            Create Employee
                        </button>
                    </form>
                )}
            </Modal>

            {/* Modal: View Employee Details */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Employee Details">
                {selectedEmployee && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <span style={{ color: "#64748b" }}>Employee Code</span>
                            <strong style={{ color: "#2563eb" }}>{selectedEmployee.employeeCode || selectedEmployee.EmployeeCode}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <span style={{ color: "#64748b" }}>Full Name</span>
                            <strong style={{ color: "#0f172a" }}>
                                {selectedEmployee.fullName || `${selectedEmployee.firstName || ""} ${selectedEmployee.lastName || ""}`.trim()}
                            </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <span style={{ color: "#64748b" }}>Email</span>
                            <span style={{ color: "#0f172a" }}>{selectedEmployee.email || selectedEmployee.Email}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <span style={{ color: "#64748b" }}>Phone</span>
                            <span style={{ color: "#0f172a" }}>{selectedEmployee.phoneNumber || selectedEmployee.PhoneNumber || "N/A"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <span style={{ color: "#64748b" }}>Role</span>
                            <Badge type="role" value={formatRole(selectedEmployee.role || selectedEmployee.Role)} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <span style={{ color: "#64748b" }}>Reporting Manager</span>
                            <span style={{ color: "#0f172a" }}>{selectedEmployee.managerName || selectedEmployee.ManagerName || selectedEmployee.managerEmployeeCode || selectedEmployee.ManagerEmployeeCode || "None"}</span>
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const code = selectedEmployee.employeeCode || selectedEmployee.EmployeeCode;
                                    setIsViewModalOpen(false);
                                    handleResetPassword(code);
                                }}
                                style={{ flex: 1, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#b45309", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                            >
                                <Icon name="key" size={16} />
                                <span>Reset Password</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Edit Employee */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Employee - ${selectedEmployee?.employeeCode || selectedEmployee?.EmployeeCode}`}>
                <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>First Name</label>
                            <input name="firstName" required value={formData.firstName} onChange={handleInputChange} className="ems-login-input" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Last Name</label>
                            <input name="lastName" required value={formData.lastName} onChange={handleInputChange} className="ems-login-input" />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Email Address</label>
                        <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="ems-login-input" />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Phone Number</label>
                        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="ems-login-input" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Role</label>
                            <select name="role" value={formData.role} onChange={handleInputChange} className="ems-login-input">
                                <option value="Employee">Employee</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Reporting Manager</label>
                            <select name="managerEmployeeCode" value={formData.managerEmployeeCode} onChange={handleInputChange} className="ems-login-input">
                                <option value="">None / Top Level (Admin)</option>
                                {managersList
                                    .filter((m) => {
                                        const code = m.employeeCode || m.EmployeeCode;
                                        const selfCode = selectedEmployee?.employeeCode || selectedEmployee?.EmployeeCode;
                                        const roleStr = formatRole(m.role || m.Role);
                                        return (roleStr === "Manager" || roleStr === "Admin") && code !== selfCode;
                                    })
                                    .map((m) => {
                                        const code = m.employeeCode || m.EmployeeCode;
                                        const name = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || code;
                                        const role = formatRole(m.role || m.Role);
                                        return (
                                            <option key={code} value={code}>
                                                {name} ({code}) — {role}
                                            </option>
                                        );
                                    })}
                            </select>
                        </div>
                    </div>

                    <button type="submit" style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>
                        Save Changes
                    </button>
                </form>
            </Modal>
        </PageContainer>
    );
}
