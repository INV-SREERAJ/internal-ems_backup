import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../hooks/useAuth";
import PasswordInput from "../../components/common/PasswordInput";
import { HiOutlineLockClosed } from "react-icons/hi2";

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};

    if (!formData.oldPassword) {
      errors.oldPassword = "Current password is required.";
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required.";
    } else {
      if (formData.newPassword.length < 8) {
        errors.newPassword = "Password must be at least 8 characters long.";
      } else if (formData.newPassword.length > 72) {
        errors.newPassword = "Password must not exceed 72 characters.";
      } else if (!/[A-Z]/.test(formData.newPassword)) {
        errors.newPassword = "Password must contain at least one uppercase letter.";
      } else if (!/[a-z]/.test(formData.newPassword)) {
        errors.newPassword = "Password must contain at least one lowercase letter.";
      } else if (!/[0-9]/.test(formData.newPassword)) {
        errors.newPassword = "Password must contain at least one number.";
      } else if (!/[@#$%&*!]/.test(formData.newPassword)) {
        errors.newPassword = "Password must contain at least one special character (@#$%&*!).";
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);
    try {
      await api.post("/profile/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      // Clear session
      await logout();

      // Redirect to login with success message
      navigate("/login", {
        replace: true,
        state: {
          message: "Password changed successfully! Please log in with your new password.",
        },
      });
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        "Failed to change password. Please check your current password and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full box-border px-3.5 py-[11px] bg-white text-slate-900 border border-slate-200 rounded-lg font-sans text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/20";
  const inputInvalid =
    "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50";
  const labelClass = "block text-slate-700 text-sm font-semibold mb-2";
  const errorClass = "block text-red-500 text-[13px] font-medium mt-1.5";

  return (
    <div className="login-gradient-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-6 left-8 flex items-center gap-2 text-white text-[22px] font-bold tracking-[-0.5px] z-20">
        <span>
          WorkForce <span className="text-blue-500">OS</span>
        </span>
      </div>

      <div
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] [animation:slide-up_0.3s_ease-out_forwards]"
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50 rounded-t-2xl">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <HiOutlineLockClosed size={18} />
          </div>
          <div>
            <h2 className="m-0 text-slate-900 text-base font-semibold">
              Force Password Reset
            </h2>
            <p className="text-slate-500 text-[13px] mt-0.5 mb-0">
              You must change your password before continuing.
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {apiError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelClass} htmlFor="oldPassword">
                  Current Password
                </label>
                <PasswordInput
                  id="oldPassword"
                  placeholder="Enter current password"
                  value={formData.oldPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, oldPassword: e.target.value })
                  }
                  disabled={loading}
                  className={`${inputBase} ${
                    fieldErrors.oldPassword ? inputInvalid : ""
                  }`}
                />
                {fieldErrors.oldPassword && (
                  <span className={errorClass}>{fieldErrors.oldPassword}</span>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="newPassword">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Enter new password (min. 8 characters)"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  disabled={loading}
                  className={`${inputBase} ${
                    fieldErrors.newPassword ? inputInvalid : ""
                  }`}
                />
                {fieldErrors.newPassword && (
                  <span className={errorClass}>{fieldErrors.newPassword}</span>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Re-enter new password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  disabled={loading}
                  className={`${inputBase} ${
                    fieldErrors.confirmPassword ? inputInvalid : ""
                  }`}
                />
                {fieldErrors.confirmPassword && (
                  <span className={errorClass}>
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center min-w-[150px]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
