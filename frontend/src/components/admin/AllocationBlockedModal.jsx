import { useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

/**
 * Modal shown when reducing annual leave allocation is blocked by the backend.
 * Clean and minimal design per user specification.
 *
 * Props:
 *  - open: boolean
 *  - config: object (leaveTypeName, leaveTypeCode, year, allocatedDays)
 *  - conflictInfo: { attemptedDays: number, employees: Array, moreCount: number, maxDays: number }
 *  - onClose: () => void
 *  - onBackToEdit: () => void
 */
export default function AllocationBlockedModal({
  open,
  config,
  conflictInfo,
  onClose,
  onBackToEdit,
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

  if (!open || !config || !conflictInfo) return null;

  const { attemptedDays, employees = [], moreCount = 0, maxDays } = conflictInfo;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs [animation:fadeIn_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 flex flex-col gap-4.5 [animation:slideUp_0.15s_ease]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="blocked-dialog-title"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Amber circle icon with '!' */}
            <div className="w-10 h-10 rounded-full bg-amber-100/90 text-amber-800 flex items-center justify-center text-lg font-bold shrink-0 select-none">
              !
            </div>
            <div>
              <h2
                id="blocked-dialog-title"
                className="text-base font-bold text-slate-900 tracking-tight leading-snug"
              >
                Can&apos;t reduce to {attemptedDays} days
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {config.leaveTypeName} · {config.year}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer -mr-1 -mt-1"
            aria-label="Close"
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {/* Informative summary line */}
        <p className="text-xs text-slate-700 leading-relaxed m-0">
          {employees.length}{" "}
          {employees.length === 1 ? "employee has" : "employees have"} already
          used or requested more than{" "}
          <span className="font-bold text-slate-900">{attemptedDays} days</span>.
        </p>

        {/* Mini Table List */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
            <span>Employee</span>
            <span>Used + pending</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
            {employees.map((emp, idx) => (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{emp.name}</div>
                  {emp.code && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {emp.code}
                    </div>
                  )}
                </div>
                <div className="font-bold text-slate-900">{emp.days} days</div>
              </div>
            ))}
          </div>

          {moreCount > 0 && (
            <div className="pt-2 text-[11px] text-slate-400 text-center">
              ...and {moreCount} more employee(s)
            </div>
          )}
        </div>

        {/* Explanation / Guidance */}
        <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
          <p className="m-0 font-normal">
            The lowest you can set right now is{" "}
            <span className="font-bold text-slate-800">{maxDays} days</span>.
          </p>
          <p className="m-0 mt-0.5 text-slate-400">
            To go lower, their pending or approved requests need to be cancelled
            or rejected first.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onBackToEdit) onBackToEdit();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            Back to edit
          </button>
        </div>
      </div>
    </div>
  );
}
