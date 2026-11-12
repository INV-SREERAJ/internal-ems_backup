import { useState, useEffect, useMemo } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import adminApi from "../../api/adminApi";

/**
 * Modal to configure a leave type for a specific year.
 *
 * Props:
 *  - open: boolean
 *  - year: number
 *  - existingConfigs: array of current year configurations
 *  - leaveTypes: array of all leave types
 *  - onClose: () => void
 *  - onSuccess: (newConfig) => void
 */
export default function ConfigureLeaveTypeModal({
  open,
  year,
  existingConfigs = [],
  leaveTypes = [],
  preSelectedLeaveTypeId = null,
  onClose,
  onSuccess,
}) {
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [allocatedDays, setAllocatedDays] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Available active leave types not yet configured for this year
  const availableLeaveTypes = useMemo(() => {
    const configuredTypeIds = new Set(existingConfigs.map((c) => c.leaveTypeId));
    return leaveTypes.filter(
      (lt) =>
        lt.isActive &&
        (!configuredTypeIds.has(lt.id) ||
          (preSelectedLeaveTypeId && lt.id === Number(preSelectedLeaveTypeId)))
    );
  }, [leaveTypes, existingConfigs, preSelectedLeaveTypeId]);

  useEffect(() => {
    if (open) {
      setError("");
      setAllocatedDays(12);
      if (preSelectedLeaveTypeId) {
        setSelectedLeaveTypeId(String(preSelectedLeaveTypeId));
      } else if (availableLeaveTypes.length > 0) {
        setSelectedLeaveTypeId(String(availableLeaveTypes[0].id));
      } else {
        setSelectedLeaveTypeId("");
      }
    }
  }, [open, availableLeaveTypes, preSelectedLeaveTypeId]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedLeaveTypeId) {
      setError("Please select a leave type.");
      return;
    }

    const daysNum = parseInt(allocatedDays, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      setError("Allocated days must be between 1 and 365.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        year,
        leaveTypeId: parseInt(selectedLeaveTypeId, 10),
        allocatedDays: daysNum,
      };

      const result = await adminApi.createLeaveYearConfiguration(payload);
      onSuccess(result);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Failed to configure leave type. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 [animation:fadeIn_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden [animation:slideUp_0.15s_ease]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="configure-leave-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2
              id="configure-leave-title"
              className="text-lg font-bold text-slate-900"
            >
              Configure Leave Type
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set annual allocation for year <span className="font-bold text-blue-600">{year}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {/* Server Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        {availableLeaveTypes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              All active leave types configured
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Every active leave type already has an annual configuration for {year}.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Leave Type Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLeaveTypeId}
                onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                {availableLeaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Year (Read-only indication) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Year
              </label>
              <input
                type="text"
                disabled
                value={year}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 outline-none cursor-not-allowed"
              />
            </div>

            {/* Allocated Days */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Allocated Days <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={allocatedDays}
                onChange={(e) => setAllocatedDays(e.target.value)}
                placeholder="e.g. 12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Number of days allocated per active employee (1 – 365)
              </p>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-800">
              Saving this configuration will automatically create initial leave balance records for all active employees.
            </div>

            {/* Actions */}
            <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {submitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

