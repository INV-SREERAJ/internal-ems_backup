import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  EMPLOYEE_STATUS,
  STATUS_LABEL,
} from "../../utils/constants";
import { CiEdit } from "react-icons/ci";
import { RiLockPasswordLine } from "react-icons/ri";
import { HiOutlineTrash } from "react-icons/hi2";
import "./EmployeeViewDialog.css";

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
}) {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset password state
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { type: "success"|"error", text }

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch employee details when employeeCode changes
  useEffect(() => {
    if (!employeeCode) {
      setEmployee(null);
      setError(null);
      setResetMsg(null);
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
      if (e.key === "Escape" && !confirmDeleteOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [employeeCode, onClose, confirmDeleteOpen]);

  if (!employeeCode) return null;

  const isDeleted =
    employee && Number(employee.status) === EMPLOYEE_STATUS.Deleted;

  // ── Handlers ─────────────────────────────────────────

  const handleEdit = () => {
    onClose();
    navigate(`/admin/employees/edit/${employee.employeeCode}`);
  };

  const handleResetPassword = async () => {
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
    } catch (err) {
      setResetMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password.",
      });
    } finally {
      setResetting(false);
    }
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

  const getStatusClass = (status) => {
    switch (Number(status)) {
      case EMPLOYEE_STATUS.Active:
        return "employee-view-status-active";
      case EMPLOYEE_STATUS.Inactive:
        return "employee-view-status-inactive";
      case EMPLOYEE_STATUS.Deleted:
        return "employee-view-status-deleted";
      default:
        return "";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div
        className="employee-view-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="employee-view-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-view-dialog-title"
        >
          {/* Loading */}
          {loading && (
            <div className="employee-view-loading">
              Loading employee details…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="employee-view-error">{error}</div>
          )}

          {/* Content */}
          {!loading && !error && employee && (
            <>
              {/* Header */}
              <div className="employee-view-header">
                <div className="employee-view-title-block">
                  <h2
                    id="employee-view-dialog-title"
                    className="employee-view-name"
                  >
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="employee-view-code">
                    {employee.employeeCode}
                  </p>
                </div>

                <button
                  type="button"
                  className="employee-view-close-btn"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              {/* Action bar — hidden for deleted employees */}
              {!isDeleted && (
                <div className="employee-view-actions">
                  <button
                    type="button"
                    className="employee-view-action-btn employee-view-action-edit"
                    onClick={handleEdit}
                  >
                    <CiEdit size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="employee-view-action-btn employee-view-action-reset"
                    onClick={handleResetPassword}
                    disabled={resetting}
                  >
                    <RiLockPasswordLine size={15} />
                    {resetting ? "Resetting…" : "Reset Password"}
                  </button>

                  <button
                    type="button"
                    className="employee-view-action-btn employee-view-action-delete"
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
                  className={`employee-view-banner employee-view-banner-${resetMsg.type}`}
                >
                  {resetMsg.text}
                </div>
              )}

              {/* Details body */}
              <div className="employee-view-body">
                {/* Personal information */}
                <div className="employee-view-section">
                  <h3 className="employee-view-section-title">
                    Personal Information
                  </h3>
                  <div className="employee-view-grid">
                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        First Name
                      </span>
                      <span className="employee-view-field-value">
                        {employee.firstName}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        Last Name
                      </span>
                      <span className="employee-view-field-value">
                        {employee.lastName}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">Email</span>
                      <span className="employee-view-field-value">
                        {employee.email}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        Phone Number
                      </span>
                      <span className="employee-view-field-value">
                        {employee.phoneNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organization */}
                <div className="employee-view-section">
                  <h3 className="employee-view-section-title">Organization</h3>
                  <div className="employee-view-grid">
                    <div className="employee-view-field">
                      <span className="employee-view-field-label">Role</span>
                      <span className="employee-view-field-value">
                        {employee.role || "—"}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">Status</span>
                      <span
                        className={`employee-view-status ${getStatusClass(employee.status)}`}
                      >
                        {STATUS_LABEL[employee.status] || "—"}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        Manager
                      </span>
                      <span className="employee-view-field-value">
                        {employee.managerName
                          ? `${employee.managerName} (${employee.managerEmployeeCode})`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="employee-view-section">
                  <h3 className="employee-view-section-title">Record Info</h3>
                  <div className="employee-view-grid">
                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        Employee Code
                      </span>
                      <span className="employee-view-field-value">
                        {employee.employeeCode}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        Created At
                      </span>
                      <span className="employee-view-field-value">
                        {formatDate(employee.createdAt)}
                      </span>
                    </div>

                    <div className="employee-view-field">
                      <span className="employee-view-field-label">
                        Updated At
                      </span>
                      <span className="employee-view-field-value">
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

      {/* Delete confirmation — rendered outside the overlay to stack correctly */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete employee?"
        message="This will permanently remove this employee from the system. This action can't be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
