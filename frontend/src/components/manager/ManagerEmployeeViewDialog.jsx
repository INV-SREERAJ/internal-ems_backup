import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  STATUS_LABEL,
  STATUS_CLASS,
} from "../../utils/constants";

/**
 * Read-only detail view dialog for a reporting employee.
 *
 * Props:
 *  - employeeCode: string | null – when truthy the dialog opens
 *  - onClose: () => void – called to close the dialog
 */
export default function ManagerEmployeeViewDialog({
  employeeCode,
  onClose,
}) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employee details when employeeCode changes
  useEffect(() => {
    if (!employeeCode) {
      setEmployee(null);
      setError(null);
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/manager/employees/${encodeURIComponent(employeeCode)}`
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
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [employeeCode, onClose]);

  if (!employeeCode) return null;

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

  const fieldLabelClass = "text-slate-400 text-xs font-medium";
  const fieldValueClass = "text-slate-900 text-sm font-medium break-words";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[600px] max-h-[90vh] bg-white rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-y-auto max-[767px]:max-w-none max-[767px]:max-h-[95vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-employee-view-dialog-title"
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
            <div className="pt-6 px-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 max-[767px]:pt-5 max-[767px]:px-[18px]">
              <div className="min-w-0">
                <h2
                  id="manager-employee-view-dialog-title"
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

            {/* Details body */}
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
                      {STATUS_LABEL[employee.status] || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className={fieldLabelClass}>Manager</span>
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
                <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                  Record Info
                </h3>
                <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                  <div className="flex flex-col gap-1">
                    <span className={fieldLabelClass}>Employee Code</span>
                    <span className={fieldValueClass}>{employee.employeeCode}</span>
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
          </>
        )}
      </div>
    </div>
  );
}
