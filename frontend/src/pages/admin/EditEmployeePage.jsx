import { useEffect, useMemo, useState, useRef } from "react";
import { RxChevronDown, RxCross2 } from "react-icons/rx";
import { useManagerSearch } from "../../hooks/useManagerSearch";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { ROLES, VALIDATION } from "../../utils/constants";

function validateEmployee(employee, managerSearch = "") {
  const errors = {};

  if (!employee.firstName?.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!employee.lastName?.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!employee.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!VALIDATION.EMAIL_REGEX.test(employee.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!employee.phoneNumber?.trim()) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!VALIDATION.PHONE_REGEX.test(employee.phoneNumber.trim())) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (!employee.role) {
    errors.role = "Please select a role.";
  }

  if (
    employee.managerEmployeeCode?.trim() &&
    !VALIDATION.EMPLOYEE_CODE_REGEX.test(employee.managerEmployeeCode.trim())
  ) {
    errors.managerEmployeeCode =
      "Manager employee code must be in the format EMPXXXXXXXX.";
  } else if (!employee.managerEmployeeCode?.trim() && managerSearch.trim()) {
    errors.managerEmployeeCode =
      "Please select a manager from the dropdown or clear the search.";
  }

  return errors;
}

export default function EditEmployeePage() {
  const { employeeCode } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [initialEmployee, setInitialEmployee] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manager state
  const [managerSearch, setManagerSearch] = useState("");
  const { managers, managerLoading, managerError } = useManagerSearch(managerSearch);
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const selectedManagerRef = useRef(selectedManager);
  const managerSelectRef = useRef(null);

  // Role dropdown state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleSelectRef = useRef(null);

  useEffect(() => {
    selectedManagerRef.current = selectedManager;
  }, [selectedManager]);

  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/admin/employees/${encodeURIComponent(employeeCode)}`,
        );

        setEmployee(response.data);
        setInitialEmployee(response.data);

        if (response.data.managerEmployeeCode) {
          const mgr = {
            employeeCode: response.data.managerEmployeeCode,
            fullName: response.data.managerName || response.data.managerEmployeeCode,
          };
          setSelectedManager(mgr);
          setManagerSearch(
            response.data.managerName
              ? `${response.data.managerName} — ${response.data.managerEmployeeCode}`
              : response.data.managerEmployeeCode
          );
        } else {
          setSelectedManager(null);
          setManagerSearch("");
        }
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load employee.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeCode]);

  // Role dropdown state

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        managerSelectRef.current &&
        !managerSelectRef.current.contains(event.target)
      ) {
        setManagerDropdownOpen(false);
        const currentSelected = selectedManagerRef.current;
        if (currentSelected) {
          setManagerSearch(
            currentSelected.fullName
              ? `${currentSelected.fullName} — ${currentSelected.employeeCode}`
              : currentSelected.employeeCode
          );
        } else {
          setManagerSearch("");
        }
      }

      if (
        roleSelectRef.current &&
        !roleSelectRef.current.contains(event.target)
      ) {
        setRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!employee || !initialEmployee) {
      return false;
    }

    return JSON.stringify(employee) !== JSON.stringify(initialEmployee);
  }, [employee, initialEmployee]);

  const handleChange = (field, value) => {
    setEmployee((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });

    // A new change means the previous save message is no longer relevant
    setSaveSuccess(false);
    setSaveError("");
  };

  const attemptNavigate = (path) => {
    if (isDirty) {
      setPendingNavigation(path);
      return;
    }

    navigate(path);
  };

  const confirmDiscardAndLeave = () => {
    const path = pendingNavigation;

    setPendingNavigation(null);

    if (path) {
      navigate(path);
    }
  };

  const cancelLeave = () => {
    setPendingNavigation(null);
  };

  const handleSave = async () => {
    if (!employee) {
      return;
    }

    const errors = validateEmployee(employee, managerSearch);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSaveError("Please fix the highlighted fields before saving.");
      setSaveSuccess(false);
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const detailsPayload = {
        firstName: employee.firstName.trim(),
        lastName: employee.lastName.trim(),
        phoneNumber: employee.phoneNumber.trim(),
        role: ROLES[employee.role],
        managerEmployeeCode: employee.managerEmployeeCode?.trim() || null,
      };

      let updatedEmployee;

      try {
        const response = await api.put(
          `/admin/employees/${encodeURIComponent(employeeCode)}`,
          detailsPayload,
        );
        updatedEmployee = response.data;
      } catch (error) {
        setSaveError(
          error.response?.data?.message || "Failed to save employee details.",
        );
        setSaveSuccess(false);
        return;
      }



      const managerChanged =
        (employee.managerEmployeeCode || "") !==
        (initialEmployee.managerEmployeeCode || "");

      if (managerChanged) {
        try {
          await api.patch(
            `/admin/employees/${encodeURIComponent(employeeCode)}/manager`,
            { managerEmployeeCode: employee.managerEmployeeCode?.trim() || null },
          );

          updatedEmployee = {
            ...updatedEmployee,
            managerEmployeeCode: employee.managerEmployeeCode || null,
            managerName: selectedManager ? selectedManager.fullName : null,
          };
        } catch (error) {
          setEmployee(updatedEmployee);
          setInitialEmployee(updatedEmployee);
          setSaveError(
            error.response?.data?.message ||
              "Details were saved, but changing reporting manager failed.",
          );
          setSaveSuccess(false);
          return;
        }
      }

      // Use the server's returned employee as the new baseline.
      setEmployee(updatedEmployee);
      setInitialEmployee(updatedEmployee);

      // Show success message.
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error.response?.data?.message || "Failed to save changes.");
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full max-w-[1400px] mx-auto font-sans">
        <div className="p-16 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
          <p className="m-0 text-sm">Loading employee...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-[1400px] mx-auto font-sans">
        <div className="p-16 text-center text-red-600 bg-red-50 border border-red-200 rounded-xl">
          <p className="m-0 text-sm">{error}</p>

          <button
            type="button"
            onClick={() => navigate("/admin/employees/edit")}
            className="mt-3 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer border-none transition-colors duration-150 hover:bg-blue-700"
          >
            Back to Search
          </button>
        </div>
      </section>
    );
  }

  if (!employee) {
    return null;
  }

  const fieldGroupClass = "flex flex-col gap-1.5";
  const labelClass = "text-slate-700 text-[13px] font-semibold";
  const inputBase =
    "w-full h-[42px] px-3 box-border border border-slate-300 rounded-lg bg-white text-slate-900 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
  const inputInvalid = "!border-red-600 focus:!ring-red-600/15";
  const errorTextClass = "text-red-600 text-xs font-medium";

  return (
    <section className="w-full max-w-[1400px] mx-auto font-sans">
      <div className="flex items-start justify-between gap-6 mb-6 max-[767px]:flex-col">
        <div>
          <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl">
            Edit Employee
          </h1>
          <p className="mt-1.5 mb-0 text-slate-500 text-sm">
            Update the employee information and save your changes.
          </p>
        </div>

        <button
          type="button"
          className="px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => attemptNavigate("/admin/employees")}
          disabled={saving}
        >
          Back to Employees
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {saveSuccess && (
          <div className="px-7 py-3 text-[13px] font-semibold bg-green-50 text-green-800 border-b border-green-200">
            Changes saved successfully.
          </div>
        )}

        {saveError && (
          <div className="px-7 py-3 text-[13px] font-semibold bg-red-50 text-red-700 border-b border-red-200">
            {saveError}
          </div>
        )}

        {/* Basic Information */}
        <div className="p-7 border-b border-slate-200 max-[767px]:p-5">
          <h2 className="m-0 mb-5 text-[17px] font-semibold text-slate-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-2 gap-5 max-[767px]:grid-cols-1">
            <div className={fieldGroupClass}>
              <label htmlFor="employeeCode" className={labelClass}>
                Employee Code
              </label>

              <input
                id="employeeCode"
                type="text"
                value={employee.employeeCode || ""}
                disabled
                className={inputBase}
              />
            </div>

            <div className={fieldGroupClass}>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>

              <input
                id="email"
                type="email"
                value={employee.email || ""}
                disabled
                className={inputBase}
              />
            </div>

            <div className={fieldGroupClass}>
              <label htmlFor="firstName" className={labelClass}>
                First Name
              </label>

              <input
                id="firstName"
                type="text"
                value={employee.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className={`${inputBase} ${
                  fieldErrors.firstName ? inputInvalid : ""
                }`}
                aria-invalid={Boolean(fieldErrors.firstName)}
              />

              {fieldErrors.firstName && (
                <span className={errorTextClass}>
                  {fieldErrors.firstName}
                </span>
              )}
            </div>

            <div className={fieldGroupClass}>
              <label htmlFor="lastName" className={labelClass}>
                Last Name
              </label>

              <input
                id="lastName"
                type="text"
                value={employee.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className={`${inputBase} ${
                  fieldErrors.lastName ? inputInvalid : ""
                }`}
                aria-invalid={Boolean(fieldErrors.lastName)}
              />

              {fieldErrors.lastName && (
                <span className={errorTextClass}>
                  {fieldErrors.lastName}
                </span>
              )}
            </div>

            <div className={fieldGroupClass}>
              <label htmlFor="phoneNumber" className={labelClass}>
                Phone Number
              </label>

              <input
                id="phoneNumber"
                type="tel"
                value={employee.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className={`${inputBase} ${
                  fieldErrors.phoneNumber ? inputInvalid : ""
                }`}
                aria-invalid={Boolean(fieldErrors.phoneNumber)}
              />

              {fieldErrors.phoneNumber && (
                <span className={errorTextClass}>
                  {fieldErrors.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="p-7 border-b border-slate-200 max-[767px]:p-5">
          <h2 className="m-0 mb-5 text-[17px] font-semibold text-slate-900">
            Organization
          </h2>

          <div className="grid grid-cols-2 gap-5 max-[767px]:grid-cols-1">
            {/* Role */}
            <div className={fieldGroupClass}>
              <label htmlFor="role" className={labelClass}>
                Role
              </label>

              <div className="relative" ref={roleSelectRef}>
                <button
                  id="role"
                  type="button"
                  className={`flex items-center justify-between w-full h-[42px] px-3 box-border border border-slate-300 rounded-lg bg-white text-slate-900 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-150 text-left focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    fieldErrors.role ? inputInvalid : ""
                  }`}
                  disabled={employee.role === "Admin" || saving}
                  onClick={() => {
                    if (employee.role === "Admin" || saving) return;
                    setRoleDropdownOpen((prev) => !prev);
                  }}
                  aria-invalid={Boolean(fieldErrors.role)}
                  aria-expanded={roleDropdownOpen}
                >
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {employee.role || "Select role"}
                  </span>
                  <RxChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-150 shrink-0 ml-2 ${
                      roleDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {roleDropdownOpen && employee.role !== "Admin" && (
                  <div className="absolute top-[calc(100%+4px)] inset-x-0 z-50 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-[0_8px_20px_rgba(17,24,39,0.12)]">
                    {["Employee", "Manager"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`flex items-center w-full px-3 py-2.5 bg-transparent border-none text-left font-sans text-[13px] text-slate-900 cursor-pointer hover:bg-slate-100 ${
                          employee.role === role
                            ? "!bg-blue-50 font-medium"
                            : ""
                        }`}
                        onClick={() => {
                          handleChange("role", role);
                          setRoleDropdownOpen(false);
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {fieldErrors.role && (
                <span className={errorTextClass}>
                  {fieldErrors.role}
                </span>
              )}
            </div>



            {/* Reporting Manager */}
            <div className={fieldGroupClass}>
              <label htmlFor="managerEmployeeCode" className={labelClass}>
                Reporting Manager
              </label>

              <div className="relative" ref={managerSelectRef}>
                <input
                  id="managerEmployeeCode"
                  type="text"
                  placeholder={
                    employee.role === "Admin"
                      ? "N/A (Admin)"
                      : "Search manager by name or code"
                  }
                  value={managerSearch}
                  disabled={employee.role === "Admin" || saving}
                  onFocus={() => {
                    if (employee.role === "Admin" || saving) return;
                    if (selectedManager) setManagerSearch("");
                    setManagerDropdownOpen(true);
                  }}
                  onClick={() => {
                    if (employee.role === "Admin" || saving) return;
                    if (!managerDropdownOpen) {
                      if (selectedManager) setManagerSearch("");
                      setManagerDropdownOpen(true);
                    }
                  }}
                  onChange={(e) => {
                    if (employee.role === "Admin" || saving) return;
                    const value = e.target.value;
                    setManagerSearch(value);
                    setManagerDropdownOpen(true);
                    setSelectedManager(null);
                    handleChange("managerEmployeeCode", "");
                  }}
                  className={`${inputBase} pr-14 ${
                    fieldErrors.managerEmployeeCode ? inputInvalid : ""
                  }`}
                  aria-invalid={Boolean(fieldErrors.managerEmployeeCode)}
                />

                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {selectedManager && employee.role !== "Admin" && !saving && (
                    <button
                      type="button"
                      className="flex items-center justify-center p-0.5 bg-transparent border-none text-slate-400 rounded cursor-pointer hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Clear selected manager"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedManager(null);
                        setManagerSearch("");
                        handleChange("managerEmployeeCode", "");
                      }}
                    >
                      <RxCross2 size={14} />
                    </button>
                  )}
                  {employee.role !== "Admin" && (
                    <RxChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform duration-150 pointer-events-none ${
                        managerDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>

                {managerDropdownOpen && employee.role !== "Admin" && (
                  <div className="absolute top-[calc(100%+4px)] inset-x-0 z-50 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-[0_8px_20px_rgba(17,24,39,0.12)]">
                    {managerSearch.trim().length < 2 && (
                      <div className="p-3 text-[13px] text-slate-500">
                        Type at least 2 characters to search...
                      </div>
                    )}

                    {managerSearch.trim().length >= 2 && managerLoading && (
                      <div className="p-3 text-[13px] text-slate-500 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                        Searching...
                      </div>
                    )}

                    {managerSearch.trim().length >= 2 && !managerLoading && managerError && (
                      <div className="p-3 text-[13px] text-red-600">
                        {managerError}
                      </div>
                    )}

                    {managerSearch.trim().length >= 2 &&
                      !managerLoading &&
                      !managerError &&
                      managers.length === 0 && (
                        <div className="p-3 text-[13px] text-slate-500">
                          No managers found.
                        </div>
                      )}

                    {managerSearch.trim().length >= 2 &&
                      !managerLoading &&
                      !managerError &&
                    managers
                      .filter((manager) => manager.employeeCode !== employeeCode)
                      .map((manager) => (
                        <button
                          key={manager.employeeCode}
                          type="button"
                          className={`flex justify-between items-center w-full px-3 py-2.5 bg-transparent border-none text-left font-sans text-[13px] cursor-pointer hover:bg-slate-100 ${
                            manager.employeeCode ===
                            selectedManager?.employeeCode
                              ? "!bg-blue-50"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedManager(manager);
                            setManagerSearch(
                              `${manager.fullName} — ${manager.employeeCode}`,
                            );
                            handleChange(
                              "managerEmployeeCode",
                              manager.employeeCode,
                            );
                            setManagerDropdownOpen(false);
                          }}
                        >
                          <span className="text-slate-900 font-medium">
                            {manager.fullName}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {manager.employeeCode}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {fieldErrors.managerEmployeeCode && (
                <span className={errorTextClass}>
                  {fieldErrors.managerEmployeeCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-5 px-7 bg-slate-50 rounded-b-xl max-[767px]:flex-col-reverse max-[767px]:p-4">
          <button
            type="button"
            className="h-10 px-4.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed max-[767px]:w-full"
            onClick={() => attemptNavigate("/admin/employees")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="h-10 px-4.5 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed max-[767px]:w-full"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingNavigation !== null}
        title="Discard unsaved changes?"
        message="You have unsaved changes to this employee. Leaving now will discard them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        danger
        onConfirm={confirmDiscardAndLeave}
        onCancel={cancelLeave}
      />
    </section>
  );
}
