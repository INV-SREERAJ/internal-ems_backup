import { useState, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import adminApi from "../../api/adminApi";

/**
 * Modal dialog for creating or editing a Leave Type.
 *
 * Props:
 *  - open: boolean
 *  - leaveType: object | null (null for add, populated for edit)
 *  - onClose: () => void
 *  - onSuccess: (savedLeaveType, isEdit) => void
 */
export default function LeaveTypeFormModal({
  open,
  leaveType = null,
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(leaveType?.id);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Sync state with incoming leaveType
  useEffect(() => {
    if (open) {
      if (leaveType) {
        setFormData({
          name: leaveType.name || "",
          code: leaveType.code || "",
          description: leaveType.description || "",
        });
      } else {
        setFormData({
          name: "",
          code: "",
          description: "",
        });
      }
      setErrors({});
      setServerError("");
    }
  }, [open, leaveType]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const validate = () => {
    const newErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Leave type name is required.";
    } else if (trimmedName.length > 100) {
      newErrors.name = "Leave type name cannot exceed 100 characters.";
    }

    const trimmedCode = formData.code.trim();
    if (!trimmedCode) {
      newErrors.code = "Code is required.";
    } else if (trimmedCode.length > 20) {
      newErrors.code = "Code cannot exceed 20 characters.";
    } else if (!/^[A-Za-z0-9]+$/.test(trimmedCode)) {
      newErrors.code = "Code can contain letters and numbers only.";
    }

    const trimmedDesc = formData.description?.trim();
    if (trimmedDesc && trimmedDesc.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
      };

      let result;
      if (isEdit) {
        result = await adminApi.updateLeaveType(leaveType.id, payload);
      } else {
        result = await adminApi.createLeaveType(payload);
      }

      onSuccess(result, isEdit);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Failed to save leave type. Please try again.";
      setServerError(msg);
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
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden [animation:slideUp_0.15s_ease]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-type-form-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2
            id="leave-type-form-title"
            className="text-lg font-bold text-slate-900"
          >
            {isEdit ? "Edit Leave Type" : "Add Leave Type"}
          </h2>
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
        {serverError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Leave type name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              maxLength={100}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              placeholder="e.g. Maternity Leave"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                errors.name
                  ? "border-red-300 ring-2 ring-red-100 bg-red-50/20"
                  : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            <div className="mt-1 flex items-center justify-between text-[11px]">
              {errors.name ? (
                <span className="text-red-600 font-medium">{errors.name}</span>
              ) : (
                <span className="text-slate-400">Max 100 characters</span>
              )}
              <span className="text-slate-400">{formData.name.length}/100</span>
            </div>
          </div>

          {/* Code Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              maxLength={20}
              onChange={(e) => {
                // Auto-convert to uppercase letters and numbers
                const val = e.target.value.toUpperCase();
                setFormData((prev) => ({ ...prev, code: val }));
                if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
              }}
              placeholder="e.g. ML"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all uppercase ${
                errors.code
                  ? "border-red-300 ring-2 ring-red-100 bg-red-50/20"
                  : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            <div className="mt-1 flex items-center justify-between text-[11px]">
              {errors.code ? (
                <span className="text-red-600 font-medium">{errors.code}</span>
              ) : (
                <span className="text-slate-400">
                  Letters and numbers only, max 20 · must be unique
                </span>
              )}
              <span className="text-slate-400">{formData.code.length}/20</span>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              maxLength={500}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                if (errors.description)
                  setErrors((prev) => ({ ...prev, description: null }));
              }}
              placeholder="Optional"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none ${
                errors.description
                  ? "border-red-300 ring-2 ring-red-100 bg-red-50/20"
                  : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            <div className="mt-1 flex items-center justify-between text-[11px]">
              {errors.description ? (
                <span className="text-red-600 font-medium">
                  {errors.description}
                </span>
              ) : (
                <span className="text-slate-400">Max 500 characters</span>
              )}
              <span className="text-slate-400">
                {formData.description.length}/500
              </span>
            </div>
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
              <span>{isEdit ? "Update Leave Type" : "Save Leave Type"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

