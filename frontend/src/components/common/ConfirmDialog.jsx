import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  // Focus the confirm button when the dialog opens, and allow Escape to cancel
  useEffect(() => {
    if (!open) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const btnBase =
    "px-4 py-[9px] border rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 [animation:confirm-dialog-fade-in_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-[400px] p-6 bg-white rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] [animation:confirm-dialog-slide-up_0.15s_ease]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2 id="confirm-dialog-title" className="m-0 mb-2 text-slate-900 text-lg font-bold">
          {title}
        </h2>

        {message && (
          <p id="confirm-dialog-message" className="m-0 mb-5 text-slate-500 text-sm leading-normal">
            {message}
          </p>
        )}

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            className={`${btnBase} bg-white text-slate-700 border-slate-300 hover:bg-slate-50`}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`${btnBase} ${danger
                ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}