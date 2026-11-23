import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/axios";
import adminApi from "../../api/adminApi";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  EMPLOYEE_STATUS,
  STATUS_LABEL,
  STATUS_CLASS,
} from "../../utils/constants";
import { CiEdit } from "react-icons/ci";
import { RiLockPasswordLine } from "react-icons/ri";
import {
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronDown,
} from "react-icons/hi2";

/**
 * Full-detail view dialog for a single employee.
 *
 * Props:
 *  - employeeCode: string | null   – when truthy the dialog opens
 *  - onClose:      () => void      – called to close the dialog
 *  - onDeleted:    () => void      – called after a successful delete (so the parent can refresh)
 */
export default function EmployeeViewDialog({
  employeeCode,
  onClose,
  onDeleted,
  onStatusChanged,
}) {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset password state
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { type: "success"|"error", text }
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status confirmation
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // Tab & Leave Balances states
  const currentYear = useMemo(() => dayjs().year(), []);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "balances"
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState(null);

  // Year options for dropdown: past 2 years up to next 2 years
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Aggregate leave metrics
  const totalAvailable = useMemo(
    () => balances.reduce((sum, b) => sum + (b.availableDays || 0), 0),
    [balances]
  );
  const totalUsed = useMemo(
    () => balances.reduce((sum, b) => sum + (b.usedDays || 0), 0),
    [balances]
  );
  const totalPending = useMemo(
    () => balances.reduce((sum, b) => sum + (b.pendingDays || 0), 0),
    [balances]
  );

  // Fetch employee details when employeeCode changes
  useEffect(() => {
    if (!employeeCode) return;

    let isMounted = true;
    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      setResetMsg(null);

      try {
        const response = await api.get(
          `/admin/employees/${encodeURIComponent(employeeCode)}`
        );
        if (isMounted) {
          setEmployee(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Failed to load employee details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployee();
    return () => {
      isMounted = false;
    };
  }, [employeeCode]);

  // Fetch employee leave balances whenever employeeCode or selectedYear changes
  useEffect(() => {
    if (!employeeCode) return;

    let isMounted = true;
    const fetchBalances = async () => {
      setLoadingBalances(true);
      setBalanceError(null);
      try {
        const data = await adminApi.getEmployeeLeaveBalances(
          employeeCode,
          selectedYear
        );
        if (isMounted) {
          setBalances(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setBalanceError(
            err.response?.data?.message || "Failed to load leave balances."
          );
          setBalances([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBalances(false);
        }
      }
    };

    fetchBalances();
    return () => {
      isMounted = false;
    };
  }, [employeeCode, selectedYear]);

  // Close on Escape
  useEffect(() => {
    if (!employeeCode) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !confirmDeleteOpen && !confirmResetOpen && !confirmStatusOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [employeeCode, onClose, confirmDeleteOpen, confirmResetOpen, confirmStatusOpen]);

  if (!employeeCode) return null;

  const isDeleted =
    employee && Number(employee.status) === EMPLOYEE_STATUS.Deleted;

  // ── Handlers ─────────────────────────────────────────

  const handleEdit = () => {
    onClose();
    navigate(`/admin/employees/edit/${employee.employeeCode}`);
  };

  const handleResetPasswordRequest = () => {
    setConfirmResetOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    setResetting(true);
    setResetMsg(null);

    try {
      await api.post(
        `/admin/employees/${encodeURIComponent(employee.employeeCode)}/reset-password`
      );
      setResetMsg({
        type: "success",
        text: "Password has been reset. A temporary password has been sent to the employee's email.",
      });
      setConfirmResetOpen(false);
    } catch (err) {
      setResetMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password.",
      });
      setConfirmResetOpen(false);
    } finally {
      setResetting(false);
    }
  };

  const handleResetPasswordCancel = () => {
    if (resetting) return;
    setConfirmResetOpen(false);
  };

  const handleDeleteRequest = () => {
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      await api.delete(
        `/admin/employees/${encodeURIComponent(employee.employeeCode)}`
      );
      setConfirmDeleteOpen(false);
      onClose();
      onDeleted();
    } catch (err) {
      setResetMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to delete employee.",
      });
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setConfirmDeleteOpen(false);
  };

  const handleStatusRequest = () => {
    setConfirmStatusOpen(true);
  };

  const handleStatusConfirm = async () => {
    setStatusChanging(true);
    const newStatus =
      Number(employee.status) === EMPLOYEE_STATUS.Active
        ? EMPLOYEE_STATUS.Inactive
        : EMPLOYEE_STATUS.Active;

    try {
      await api.patch(`/admin/employees/${encodeURIComponent(employee.employeeCode)}/status`, {
        status: newStatus,
      });
      setEmployee({ ...employee, status: newStatus });
      setConfirmStatusOpen(false);
      setResetMsg({
        type: "success",
        text: `Employee has been ${newStatus === EMPLOYEE_STATUS.Active ? "activated" : "deactivated"} successfully.`,
      });
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      setResetMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change status.",
      });
      setConfirmStatusOpen(false);
    } finally {
      setStatusChanging(false);
    }
  };

  const handleStatusCancel = () => {
    if (statusChanging) return;
    setConfirmStatusOpen(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const normalizedDate = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
    const date = new Date(normalizedDate);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const actionBtnBase =
    "inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-lg font-sans text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  const fieldLabelClass = "text-slate-400 text-xs font-medium";
  const fieldValueClass = "text-slate-900 text-sm font-medium break-words";

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 [animation:employee-view-fade-in_0.15s_ease]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="w-full max-w-[780px] max-h-[90vh] bg-white rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-y-auto [animation:employee-view-slide-up_0.15s_ease] max-[767px]:max-w-none max-[767px]:max-h-[95vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-view-dialog-title"
        >
          {/* Loading */}
          {loading && (
            <div className="px-6 py-12 text-slate-500 text-sm text-center">
              Loading employee details…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-6 text-red-700 text-sm text-center">{error}</div>
          )}

          {/* Content */}
          {!loading && !error && employee && (
            <>
              {/* Header */}
              <div className="pt-6 px-6 pb-0 flex items-start justify-between gap-4 max-[767px]:pt-5 max-[767px]:px-[18px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2
                      id="employee-view-dialog-title"
                      className="m-0 text-slate-900 text-xl font-bold tracking-[-0.3px] max-[767px]:text-lg"
                    >
                      {employee.firstName} {employee.lastName}
                    </h2>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_CLASS[Number(employee.status)] || "bg-red-100 text-red-800"
                      }`}
                    >
                      {STATUS_LABEL[Number(employee.status)] || "—"}
                    </span>
                  </div>
                  <p className="mt-1 mb-0 text-slate-500 text-[13px] font-medium">
                    {employee.employeeCode} {employee.role ? `· ${employee.role}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center p-0 bg-transparent text-slate-400 border-none rounded-md text-lg cursor-pointer shrink-0 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              {/* Action bar — hidden for deleted employees */}
              {!isDeleted && (
                <div className="px-6 py-4 flex items-center gap-2.5 max-[767px]:px-[18px] max-[767px]:py-3.5 max-[767px]:flex-wrap">
                  <button
                    type="button"
                    className={`${actionBtnBase} bg-blue-50 text-blue-600 border-blue-200 hover:not-disabled:bg-blue-600 hover:not-disabled:text-white hover:not-disabled:border-blue-600`}
                    onClick={handleEdit}
                  >
                    <CiEdit size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className={`${actionBtnBase} bg-amber-50 text-amber-600 border-amber-200 hover:not-disabled:bg-amber-600 hover:not-disabled:text-white hover:not-disabled:border-amber-600`}
                    onClick={handleResetPasswordRequest}
                    disabled={resetting}
                  >
                    <RiLockPasswordLine size={15} />
                    {resetting ? "Resetting…" : "Reset Password"}
                  </button>

                  <button
                    type="button"
                    className={`${actionBtnBase} ${
                      Number(employee.status) === EMPLOYEE_STATUS.Active
                        ? "bg-slate-50 text-slate-600 border-slate-200 hover:not-disabled:bg-slate-600 hover:not-disabled:text-white hover:not-disabled:border-slate-600"
                        : "bg-green-50 text-green-600 border-green-200 hover:not-disabled:bg-green-600 hover:not-disabled:text-white hover:not-disabled:border-green-600"
                    }`}
                    onClick={handleStatusRequest}
                    disabled={statusChanging}
                  >
                    {Number(employee.status) === EMPLOYEE_STATUS.Active ? (
                      <>
                        <HiOutlineXCircle size={15} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle size={15} />
                        Activate
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`${actionBtnBase} bg-red-50 text-red-600 border-red-300 hover:not-disabled:bg-red-600 hover:not-disabled:text-white hover:not-disabled:border-red-600`}
                    onClick={handleDeleteRequest}
                    disabled={deleting}
                  >
                    <HiOutlineTrash size={15} />
                    Delete
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="px-6 border-b border-slate-200 flex items-center gap-6 max-[767px]:px-[18px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                    activeTab === "overview"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("balances")}
                  className={`py-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === "balances"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>Leave balances</span>
                  {balances.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
                      {balances.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Banner messages */}
              {resetMsg && (
                <div
                  className={`mx-6 mt-4 px-3.5 py-[10px] rounded-lg text-[13px] font-medium max-[767px]:mx-[18px] max-[767px]:mt-3.5 ${
                    resetMsg.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-300"
                  }`}
                >
                  {resetMsg.text}
                </div>
              )}

              {/* Tab Content: Overview */}
              {activeTab === "overview" && (
                <div className="p-6 max-[767px]:px-[18px] max-[767px]:py-5">
                  {/* Personal information */}
                  <div className="mb-6 last:mb-0">
                    <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>First Name</span>
                        <span className={fieldValueClass}>{employee.firstName}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Last Name</span>
                        <span className={fieldValueClass}>{employee.lastName}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Email</span>
                        <span className={fieldValueClass}>{employee.email}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Phone Number</span>
                        <span className={fieldValueClass}>
                          {employee.phoneNumber || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="mb-6 last:mb-0">
                    <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                      Organization
                    </h3>
                    <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Role</span>
                        <span className={fieldValueClass}>{employee.role || "—"}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Status</span>
                        <span
                          className={`inline-flex w-fit px-2 py-[3px] rounded-full text-xs font-semibold ${
                            STATUS_CLASS[Number(employee.status)] ||
                            "bg-red-100 text-red-800"
                          }`}
                        >
                          {STATUS_LABEL[Number(employee.status)] || "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Manager</span>
                        <span className={fieldValueClass}>
                          {employee.managerName
                            ? `${employee.managerName} (${employee.managerEmployeeCode})`
                            : employee.role === "Admin"
                            ? "N/A (Admin)"
                            : "None / Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="mb-6 last:mb-0">
                    <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                      Record Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Employee Code</span>
                        <span className={fieldValueClass}>
                          {employee.employeeCode}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Created At</span>
                        <span className={fieldValueClass}>
                          {formatDate(employee.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={fieldLabelClass}>Updated At</span>
                        <span className={fieldValueClass}>
                          {formatDate(employee.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Leave Balances */}
              {activeTab === "balances" && (
                <div className="p-6 max-[767px]:px-[18px] max-[767px]:py-5">
                  {/* Top Header: Summary & Year Select */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="text-sm">
                      <span className="font-bold text-slate-900">{selectedYear}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="text-slate-600 font-medium">
                        {totalAvailable} days available · {totalUsed} used ·{" "}
                        {totalPending} pending
                      </span>
                    </div>

                    <div className="relative shrink-0 w-28">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 outline-none cursor-pointer transition-all"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <HiOutlineChevronDown
                        size={13}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Loading State */}
                  {loadingBalances ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading leave balances...</span>
                    </div>
                  ) : balanceError ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center">
                      {balanceError}
                    </div>
                  ) : balances.length === 0 ? (
                    <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl">
                      <p className="text-sm font-semibold text-slate-800 m-0">
                        No leave balances found
                      </p>
                      <p className="text-xs text-slate-400 mt-1 m-0">
                        No leave allocations configured for this employee in{" "}
                        {selectedYear}.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Grid of Leave Balance Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {balances.map((b) => {
                          const total =
                            b.allocatedDays && b.allocatedDays > 0
                              ? b.allocatedDays
                              : (b.usedDays || 0) +
                                  (b.pendingDays || 0) +
                                  (b.availableDays || 0) || 1;
                          const availablePercent = Math.min(
                            100,
                            Math.max(0, ((b.availableDays || 0) / total) * 100)
                          );
                          const pendingPercent = Math.min(
                            100 - availablePercent,
                            Math.max(0, ((b.pendingDays || 0) / total) * 100)
                          );
                          const usedPercent = Math.min(
                            100 - availablePercent - pendingPercent,
                            Math.max(0, ((b.usedDays || 0) / total) * 100)
                          );

                          return (
                            <div
                              key={b.leaveTypeId || b.leaveTypeCode}
                              className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                            >
                              <div>
                                {/* Card Header */}
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <h4
                                    className="m-0 text-sm font-semibold text-slate-900 tracking-tight truncate"
                                    title={b.leaveTypeName}
                                  >
                                    {b.leaveTypeName}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase shrink-0">
                                    {b.leaveTypeCode || "LV"}
                                  </span>
                                </div>

                                {/* Days Left */}
                                <div className="flex items-baseline gap-1.5 my-2">
                                  <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                                    {b.availableDays ?? 0}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500">
                                    of {b.allocatedDays ?? 0} left
                                  </span>
                                </div>

                                {/* Segmented Progress Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-2 my-2.5 overflow-hidden flex">
                                  {availablePercent > 0 && (
                                    <div
                                      className="bg-blue-600 h-full transition-all duration-300"
                                      style={{ width: `${availablePercent}%` }}
                                      title={`Left: ${b.availableDays} days`}
                                    />
                                  )}
                                  {pendingPercent > 0 && (
                                    <div
                                      className="bg-amber-400 h-full transition-all duration-300"
                                      style={{ width: `${pendingPercent}%` }}
                                      title={`Pending: ${b.pendingDays} days`}
                                    />
                                  )}
                                  {usedPercent > 0 && (
                                    <div
                                      className="bg-slate-300 h-full transition-all duration-300"
                                      style={{ width: `${usedPercent}%` }}
                                      title={`Used: ${b.usedDays} days`}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Card Subtext */}
                              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span>
                                  <strong className="text-slate-700 font-medium">
                                    {b.usedDays ?? 0}
                                  </strong>{" "}
                                  used ·{" "}
                                  <strong className="text-slate-700 font-medium">
                                    {b.pendingDays ?? 0}
                                  </strong>{" "}
                                  pending
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom Footer: Navigation Link & Legend */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(
                              `/admin/leave-requests?search=${encodeURIComponent(
                                employee.employeeCode
                              )}`
                            );
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>View full leave history</span>
                          <span>&rarr;</span>
                        </button>

                        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                            <span>Left</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                            <span>Pending</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400/60 shrink-0" />
                            <span>Used</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reset password confirmation — rendered outside the overlay to stack correctly */}
      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset employee password?"
        message={`Are you sure you want to reset the password for ${employee?.firstName} ${employee?.lastName} (${employee?.employeeCode})? A temporary password will be generated and emailed to ${employee?.email}.`}
        confirmLabel="Reset Password"
        cancelLabel="Cancel"
        loading={resetting}
        onConfirm={handleResetPasswordConfirm}
        onCancel={handleResetPasswordCancel}
      />

      {/* Delete confirmation — rendered outside the overlay to stack correctly */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employee?.firstName} ${employee?.lastName}? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        danger
        loading={deleting}
      />

      <ConfirmDialog
        open={confirmStatusOpen}
        title={`${Number(employee?.status) === EMPLOYEE_STATUS.Active ? "Deactivate" : "Activate"} Employee`}
        message={`Are you sure you want to ${
          Number(employee?.status) === EMPLOYEE_STATUS.Active ? "deactivate" : "activate"
        } ${employee?.firstName} ${employee?.lastName}?`}
        confirmLabel={statusChanging ? "Changing…" : "Yes, change status"}
        cancelLabel="Cancel"
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
        danger={Number(employee?.status) === EMPLOYEE_STATUS.Active}
        loading={statusChanging}
      />
    </>
  );
}