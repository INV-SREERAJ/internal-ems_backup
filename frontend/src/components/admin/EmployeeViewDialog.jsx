import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  EMPLOYEE_STATUS,
  STATUS_LABEL,
  STATUS_CLASS,
} from "../../utils/constants";
import { CiEdit } from "react-icons/ci";
import { RiLockPasswordLine } from "react-icons/ri";
import { HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi2";

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

  // Fetch employee details when employeeCode changes
  useEffect(() => {
    if (!employeeCode) {
      setEmployee(null);
      setError(null);
      setResetMsg(null);
      setConfirmResetOpen(false);
      setConfirmDeleteOpen(false);
      setConfirmStatusOpen(false);
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      setResetMsg(null);

      try {
        const response = await api.get(
          `/admin/employees/${encodeURIComponent(employeeCode)}`
        );
        setEmployee(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load employee details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeCode]);

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
          className="w-full max-w-[620px] max-h-[90vh] bg-white rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-y-auto [animation:employee-view-slide-up_0.15s_ease] max-[767px]:max-w-none max-[767px]:max-h-[95vh]"
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
                  <h2
                    id="employee-view-dialog-title"
                    className="m-0 text-slate-900 text-xl font-bold tracking-[-0.3px] max-[767px]:text-lg"
                  >
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="mt-1 mb-0 text-slate-500 text-[13px] font-medium">
                    {employee.employeeCode}
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
                <div className="px-6 py-4 flex items-center gap-2.5 border-b border-slate-200 max-[767px]:px-[18px] max-[767px]:py-3.5 max-[767px]:flex-wrap">
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

              {/* Banner messages */}
              {resetMsg && (
                <div
                  className={`mx-6 mt-4 px-3.5 py-[10px] rounded-lg text-[13px] font-medium max-[767px]:mx-[18px] max-[767px]:mt-3.5 ${resetMsg.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-300"
                    }`}
                >
                  {resetMsg.text}
                </div>
              )}

              {/* Details body */}
              <div className="p-6 max-[767px]:px-[18px] max-[767px]:py-5">
                {/* Personal information */}
                <div className="mb-6 last:mb-0">
                  <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        First Name
                      </span>
                      <span className={fieldValueClass}>
                        {employee.firstName}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        Last Name
                      </span>
                      <span className={fieldValueClass}>
                        {employee.lastName}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Email</span>
                      <span className={fieldValueClass}>
                        {employee.email}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        Phone Number
                      </span>
                      <span className={fieldValueClass}>
                        {employee.phoneNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organization */}
                <div className="mb-6 last:mb-0">
                  <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">Organization</h3>
                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Role</span>
                      <span className={fieldValueClass}>
                        {employee.role || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Status</span>
                      <span
                        className={`inline-flex w-fit px-2 py-[3px] rounded-full text-xs font-semibold ${STATUS_CLASS[Number(employee.status)] || "bg-red-100 text-red-800"
                          }`}
                      >
                        {STATUS_LABEL[Number(employee.status)] || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        Manager
                      </span>
                      <span className={fieldValueClass}>
                        {employee.managerName
                          ? `${employee.managerName} (${employee.managerEmployeeCode})`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mb-6 last:mb-0">
                  <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">Record Info</h3>
                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        Employee Code
                      </span>
                      <span className={fieldValueClass}>
                        {employee.employeeCode}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        Created At
                      </span>
                      <span className={fieldValueClass}>
                        {formatDate(employee.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>
                        Updated At
                      </span>
                      <span className={fieldValueClass}>
                        {formatDate(employee.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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