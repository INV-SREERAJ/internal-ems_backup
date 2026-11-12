import { useEffect } from "react";
import dayjs from "dayjs";
import {
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
} from "react-icons/hi2";

/**
 * Modal to view Yearly Leave Configuration details.
 *
 * Props:
 *  - open: boolean
 *  - config: object | null
 *  - isPastYear: boolean
 *  - onClose: () => void
 *  - onEdit: (config) => void
 *  - onToggleStatus: (config) => void
 */
export default function YearlyConfigDetailsModal({
  open,
  config,
  isPastYear = false,
  onClose,
  onEdit,
  onToggleStatus,
}) {
  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !config) return null;

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    return dayjs(dateVal).format("D MMM YYYY");
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 [animation:fadeIn_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden [animation:slideUp_0.15s_ease]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="yearly-config-title"
      >
        {/* Header */}
        <div className="pt-6 px-6 pb-2 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              YEARLY ALLOCATION
            </span>
            <h2
              id="yearly-config-title"
              className="mt-0.5 text-xl font-bold text-slate-900"
            >
              {config.leaveTypeName}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              {config.leaveTypeCode && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wide">
                  {config.leaveTypeCode}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  config.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    config.isActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {config.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Hero Days Card */}
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-4">
            <div className="text-4xl font-extrabold text-blue-600 tracking-tight">
              {config.allocatedDays}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                days per employee
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Allocated for {config.year}
              </div>
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <div className="font-medium text-slate-400 mb-0.5">
                Leave type
              </div>
              <div className="font-semibold text-slate-800 text-sm">
                {config.leaveTypeName}{" "}
                {config.leaveTypeCode ? `(${config.leaveTypeCode})` : ""}
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-400 mb-0.5">Year</div>
              <div className="font-semibold text-slate-800 text-sm">
                {config.year}
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-400 mb-0.5">Created</div>
              <div className="font-semibold text-slate-800 text-sm">
                {formatDate(config.createdAt)}
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-400 mb-0.5">
                Last updated
              </div>
              <div className="font-semibold text-slate-800 text-sm">
                {formatDate(config.updatedAt)}
              </div>
            </div>
          </div>

          {/* Allocation Info Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 block mb-0.5">
              Allocation Status
            </span>
            <span>
              All active employees for {config.year} have this configuration applied to their leave balances.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-end gap-2.5">
          {!isPastYear && (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(config);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <HiOutlinePencilSquare size={15} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleStatus(config);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  config.isActive
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {config.isActive ? (
                  <>
                    <HiOutlineNoSymbol size={15} />
                    <span>Disable</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle size={15} />
                    <span>Enable</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

