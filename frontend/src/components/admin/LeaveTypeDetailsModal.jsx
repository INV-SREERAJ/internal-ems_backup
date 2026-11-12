import { useEffect } from "react";
import dayjs from "dayjs";
import {
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

/**
 * Modal dialog for inspecting a single Leave Type's details.
 *
 * Props:
 *  - open: boolean
 *  - leaveType: object | null
 *  - onClose: () => void
 *  - onEdit: (leaveType) => void
 *  - onToggleStatus: (leaveType) => void
 */
export default function LeaveTypeDetailsModal({
  open,
  leaveType,
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

  if (!open || !leaveType) return null;

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    return dayjs(dateVal).format("DD MMM YYYY");
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 [animation:fadeIn_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden [animation:slideUp_0.15s_ease]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-type-details-title"
      >
        {/* Header */}
        <div className="pt-6 px-6 pb-4 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Leave Type
            </span>
            <h2
              id="leave-type-details-title"
              className="mt-0.5 text-xl font-bold text-slate-900"
            >
              {leaveType.name}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wide">
                {leaveType.code}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  leaveType.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    leaveType.isActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {leaveType.isActive ? "Active" : "Inactive"}
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

        {/* Details Body */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-4">
          {/* Description */}
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              Description
            </div>
            <p className="text-sm text-slate-800 leading-relaxed m-0 whitespace-pre-wrap">
              {leaveType.description || (
                <span className="text-slate-400 italic">
                  No description provided.
                </span>
              )}
            </p>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-0.5">
                Created At
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {formatDate(leaveType.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-0.5">
                Updated At
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {formatDate(leaveType.updatedAt)}
              </div>
            </div>
          </div>

          {/* Status Note Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
              leaveType.isActive
                ? "bg-slate-50 border-slate-200 text-slate-700"
                : "bg-amber-50/70 border-amber-200 text-amber-800"
            }`}
          >
            <HiOutlineInformationCircle
              size={18}
              className={`shrink-0 ${
                leaveType.isActive ? "text-slate-500" : "text-amber-600"
              }`}
            />
            <span>
              {leaveType.isActive
                ? "Employees can choose this leave type for new requests."
                : "This leave type is inactive. Employees cannot select it for new leave requests."}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(leaveType);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HiOutlinePencilSquare size={15} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleStatus(leaveType);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              leaveType.isActive
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            {leaveType.isActive ? (
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
        </div>
      </div>
    </div>
  );
}

