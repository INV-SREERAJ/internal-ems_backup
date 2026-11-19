import { useEffect } from "react";
import { HiOutlineXMark, HiCheck } from "react-icons/hi2";

/**
 * Toast notification shown at the bottom-right when yearly leave configuration is saved.
 * Matches the specification in media_1794395498135_b0c7e7de.png.
 *
 * Props:
 *  - open: boolean
 *  - config: { leaveTypeName: string, allocatedDays: number, year: number, isNew?: boolean } | null
 *  - onClose: () => void
 *  - autoCloseMs?: number (defaults to 5000)
 */
export default function AllocationSuccessToast({
  open,
  config,
  onClose,
  autoCloseMs = 5000,
}) {
  // Auto-dismiss timer
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  if (!open || !config) return null;

  return (
    <aside
      className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3.5 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/70 backdrop-blur-md max-w-md [animation:slideUp_0.2s_ease]"
      role="status"
      aria-live="polite"
    >
      {/* Green Circle Checkmark Badge */}
      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
        <HiCheck size={14} className="stroke-[2.5]" />
      </div>

      {/* Message Text */}
      <div className="flex-1 pr-2">
        <p className="text-xs font-bold text-white tracking-tight leading-snug m-0">
          {config.isNew
            ? `${config.leaveTypeName} configured to ${config.allocatedDays} days`
            : `${config.leaveTypeName} updated to ${config.allocatedDays} days`}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 m-0 leading-tight">
          {config.year} · all employee balances updated
        </p>
      </div>

      {/* Close 'X' Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 -mr-1"
        aria-label="Close notification"
      >
        <HiOutlineXMark size={16} />
      </button>
    </aside>
  );
}

