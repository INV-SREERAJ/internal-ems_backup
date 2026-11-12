import { useState, useEffect, useRef } from "react";

/**
 * Shared dialog for Manager and Admin to enter a required rejection reason
 * when rejecting a leave request.
 *
 * Props:
 *  - open: boolean
 *  - request: object | null
 *  - loading: boolean
 *  - onConfirm: (requestId, reason) => void
 *  - onCancel: () => void
 */
export default function RejectLeaveDialog({
  open,
  request,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRejectionReason("");
      setError("");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this leave request.");
      return;
    }
    if (rejectionReason.trim().length > 500) {
      setError("Rejection reason cannot exceed 500 characters.");
      return;
    }
    onConfirm(request.id, rejectionReason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs [animation:fadeIn_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-[460px] p-6 bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col gap-4 [animation:slideUp_0.15s_ease]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
      >
        <div>
          <h2
            id="reject-dialog-title"
            className="text-lg font-bold text-slate-900 tracking-tight"
          >
            {request.status === "Approved"
              ? "Reject Approved Leave"
              : "Reject Leave Request"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {request.status === "Approved" ? (
              <>
                You are rejecting the previously approved{" "}
                <span className="font-semibold text-slate-800">
                  {request.leaveTypeName}
                </span>{" "}
                for{" "}
                <span className="font-semibold text-slate-800">
                  {request.employeeName}
                </span>{" "}
                ({request.numberOfDays}{" "}
                {request.numberOfDays === 1 ? "working day" : "working days"}).
              </>
            ) : (
              <>
                You are rejecting the{" "}
                <span className="font-semibold text-slate-800">
                  {request.leaveTypeName}
                </span>{" "}
                request for{" "}
                <span className="font-semibold text-slate-800">
                  {request.employeeName}
                </span>{" "}
                ({request.numberOfDays}{" "}
                {request.numberOfDays === 1 ? "working day" : "working days"}).
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="rejectionReason"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {rejectionReason.length}/500
              </span>
            </div>

            <textarea
              id="rejectionReason"
              ref={textareaRef}
              rows={3}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="State why this leave request cannot be approved..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-none"
            />
            {error && (
              <span className="block text-xs text-rose-600 mt-1 font-medium">
                {error}
              </span>
            )}
          </div>

          <div className="flex justify-end items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              Go Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {loading ? "Rejecting..." : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

