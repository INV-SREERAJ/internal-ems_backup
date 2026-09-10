import { useEffect, useState } from "react";
import api from "../../api/axios";
import { VALIDATION } from "../../utils/constants";
import PasswordInput from "../../components/common/PasswordInput";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { HiOutlineUser, HiOutlineLockClosed } from "react-icons/hi2";
import { ROLES, ROLE_LABEL } from "../../utils/constants";
import useAuth from "../../hooks/useAuth";

export default function ProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile Edit State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/profile");
        const data = response.data;
        setProfile(data);
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const validateProfileForm = () => {
    const errs = {};
    if (!formData.firstName.trim()) {
      errs.firstName = "First name is required.";
    }
    if (!formData.lastName.trim()) {
      errs.lastName = "Last name is required.";
    }
    if (
      formData.phoneNumber &&
      !VALIDATION.PHONE_REGEX.test(formData.phoneNumber.trim())
    ) {
      errs.phoneNumber = "Phone number must be a valid 10-digit number.";
    }
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const hasChanges =
    formData.firstName !== (profile?.firstName || "") ||
    formData.lastName !== (profile?.lastName || "") ||
    formData.phoneNumber !== (profile?.phoneNumber || "");

  const handleSaveIntent = (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setConfirmSaveOpen(true);
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setConfirmCancelOpen(false);
    setFormData({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phoneNumber: profile?.phoneNumber || "",
    });
    setProfileErrors({});
  };

  const handleCancelIntent = () => {
    if (hasChanges) {
      setConfirmCancelOpen(true);
    } else {
      cancelEdit();
    }
  };

  const handleProfileSubmit = async () => {
    setConfirmSaveOpen(false);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (!validateProfileForm()) return;

    setSavingProfile(true);
    try {
      const response = await api.put("/profile", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      });
      setProfile((prev) => ({
        ...prev,
        ...response.data,
      }));
      setProfileSuccessMsg("Profile information updated successfully.");
      setIsEditingProfile(false);
    } catch (err) {
      setProfileErrorMsg(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const validatePasswordForm = () => {
    const errs = {};
    if (!passwordData.oldPassword) {
      errs.oldPassword = "Current password is required.";
    }
    
    if (!passwordData.newPassword) {
      errs.newPassword = "New password is required.";
    } else {
      if (passwordData.newPassword.length < 8) {
        errs.newPassword = "Password must be at least 8 characters long.";
      } else if (passwordData.newPassword.length > 72) {
        errs.newPassword = "Password is too long.";
      } else if (!/[A-Z]/.test(passwordData.newPassword)) {
        errs.newPassword = "Password must contain at least one uppercase letter.";
      } else if (!/[a-z]/.test(passwordData.newPassword)) {
        errs.newPassword = "Password must contain at least one lowercase letter.";
      } else if (!/[0-9]/.test(passwordData.newPassword)) {
        errs.newPassword = "Password must contain at least one number.";
      } else if (!/[@#$%&*!]/.test(passwordData.newPassword)) {
        errs.newPassword = "Password must contain at least one special character (@#$%&*!).";
      }
    }

    if (!passwordData.confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg("");
    setPasswordErrorMsg("");

    if (!validatePasswordForm()) return;

    setSavingPassword(true);
    try {
      await api.post("/profile/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setPasswordSuccessMsg("Password changed successfully. Logging out...");
      
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      setPasswordErrorMsg(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Failed to change password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full max-w-[1000px] mx-auto">
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          Loading profile…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-[1000px] mx-auto">
        <div className="px-6 py-12 text-center text-sm text-red-700 bg-red-50 border border-red-300 rounded-xl">
          {error}
        </div>
      </section>
    );
  }

  const inputBase =
    "w-full box-border px-3.5 py-[11px] bg-white text-slate-900 border border-slate-300 rounded-lg font-sans text-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/15 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  const inputInvalid = "!border-red-500 focus:!border-red-500 focus:!ring-red-500/15";
  const labelClass = "block mb-1.5 text-slate-700 text-xs font-semibold uppercase tracking-wider";
  const errorClass = "block mt-1 text-xs text-red-600 font-medium";

  return (
    <section className="w-full max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8 max-[480px]:mb-6">
        <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl">
          My Profile & Settings
        </h1>
        <p className="mt-1.5 mb-0 text-slate-500 text-sm">
          Manage your personal details and account credentials.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Personal Details Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <HiOutlineUser size={18} />
              </div>
              <div>
                <h2 className="m-0 text-slate-900 text-base font-semibold">
                  Personal Information
                </h2>
                <p className="m-0 text-slate-500 text-xs mt-0.5">
                  Update your name and primary contact number.
                </p>
              </div>
            </div>
            
            {!isEditingProfile && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors duration-150"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors duration-150"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveIntent} className="p-6">
            {profileSuccessMsg && (
              <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
                {profileSuccessMsg}
              </div>
            )}

            {profileErrorMsg && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {profileErrorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-5 max-[767px]:grid-cols-1">
              <div>
                <label className={labelClass} htmlFor="profileFirstName">
                  First Name
                </label>
                <input
                  id="profileFirstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className={`${inputBase} ${
                    profileErrors.firstName ? inputInvalid : ""
                  }`}
                />
                {profileErrors.firstName && (
                  <span className={errorClass}>{profileErrors.firstName}</span>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="profileLastName">
                  Last Name
                </label>
                <input
                  id="profileLastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className={`${inputBase} ${
                    profileErrors.lastName ? inputInvalid : ""
                  }`}
                />
                {profileErrors.lastName && (
                  <span className={errorClass}>{profileErrors.lastName}</span>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="profileEmail">
                  Email Address (Read-only)
                </label>
                <input
                  id="profileEmail"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full box-border px-3.5 py-[11px] bg-slate-50 text-slate-500 border border-slate-200 rounded-lg font-sans text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="profilePhone">
                  Phone Number
                </label>
                <input
                  id="profilePhone"
                  type="text"
                  placeholder="10-digit mobile number"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className={`${inputBase} ${
                    profileErrors.phoneNumber ? inputInvalid : ""
                  }`}
                />
                {profileErrors.phoneNumber && (
                  <span className={errorClass}>{profileErrors.phoneNumber}</span>
                )}
              </div>

              <div>
                <label className={labelClass}>Employee Code</label>
                <input
                  type="text"
                  value={profile?.employeeCode || ""}
                  disabled
                  className="w-full box-border px-3.5 py-[11px] bg-slate-50 text-slate-500 border border-slate-200 rounded-lg font-sans text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <input
                  type="text"
                  value={ROLE_LABEL[profile?.role]}
                  disabled
                  className="w-full box-border px-3.5 py-[11px] bg-slate-50 text-slate-500 border border-slate-200 rounded-lg font-sans text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {isEditingProfile && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={handleCancelIntent}
                  className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !hasChanges}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Change Password Dialog Overlay */}
        {isPasswordDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm [animation:employee-view-fade-in_0.2s_ease-out]">
            <div
              className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] [animation:slide-up_0.3s_ease-out_forwards]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50 rounded-t-2xl">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <HiOutlineLockClosed size={18} />
                </div>
                <div>
                  <h2 className="m-0 text-slate-900 text-base font-semibold">
                    Change Password
                  </h2>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={handlePasswordSubmit}>
                  {passwordSuccessMsg && (
                    <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
                      {passwordSuccessMsg}
                    </div>
                  )}

                  {passwordErrorMsg && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                      {passwordErrorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-5">
                    <div>
                      <label className={labelClass} htmlFor="oldPassword">
                        Current Password
                      </label>
                      <PasswordInput
                        id="oldPassword"
                        placeholder="Enter current password"
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            oldPassword: e.target.value,
                          })
                        }
                        className={`${inputBase} ${
                          passwordErrors.oldPassword ? inputInvalid : ""
                        }`}
                      />
                      {passwordErrors.oldPassword && (
                        <span className={errorClass}>{passwordErrors.oldPassword}</span>
                      )}
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="newPassword">
                        New Password
                      </label>
                      <PasswordInput
                        id="newPassword"
                        placeholder="Enter new password (min. 8 characters)"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className={`${inputBase} ${
                          passwordErrors.newPassword ? inputInvalid : ""
                        }`}
                      />
                      {passwordErrors.newPassword && (
                        <span className={errorClass}>{passwordErrors.newPassword}</span>
                      )}
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <PasswordInput
                        id="confirmPassword"
                        placeholder="Re-enter new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`${inputBase} ${
                          passwordErrors.confirmPassword ? inputInvalid : ""
                        }`}
                      />
                      {passwordErrors.confirmPassword && (
                        <span className={errorClass}>
                          {passwordErrors.confirmPassword}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={savingPassword}
                      onClick={() => {
                        setIsPasswordDialogOpen(false);
                        setPasswordData({
                          oldPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                        setPasswordErrors({});
                        setPasswordSuccessMsg("");
                        setPasswordErrorMsg("");
                      }}
                      className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingPassword ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Save Dialog */}
        <ConfirmDialog
          open={confirmSaveOpen}
          title="Save Changes?"
          message="Are you sure you want to save the changes to your profile?"
          confirmLabel="Save Changes"
          loading={savingProfile}
          onConfirm={handleProfileSubmit}
          onCancel={() => setConfirmSaveOpen(false)}
        />

        {/* Confirm Cancel Dialog */}
        <ConfirmDialog
          open={confirmCancelOpen}
          title="Discard Changes?"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmLabel="Discard"
          danger={true}
          onConfirm={cancelEdit}
          onCancel={() => setConfirmCancelOpen(false)}
        />
      </div>
    </section>
  );
}
