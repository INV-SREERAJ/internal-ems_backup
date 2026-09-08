import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { ROLES, VALIDATION } from "../../utils/constants";
import { RxChevronDown, RxCross2 } from "react-icons/rx";
import { useManagerSearch } from "../../hooks/useManagerSearch";

export default function CreateEmployee() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    managerEmployeeCode: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [managerSearch, setManagerSearch] = useState("");
  const { managers, managerLoading, managerError } = useManagerSearch(managerSearch);

  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const selectedManagerRef = useRef(null);

  useEffect(() => {
    selectedManagerRef.current = selectedManager;
  }, [selectedManager]);

  const managerSelectRef = useRef(null);

  // Role dropdown state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleSelectRef = useRef(null);

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

  // (filteredManagers removed since backend does search now)

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    } else if (
      formData.firstName.trim().length < 2 ||
      formData.firstName.trim().length > 50
    ) {
      newErrors.firstName = "First name must be between 2 and 50 characters.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = "Last name cannot exceed 50 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    } else if (formData.email.length > 100) {
      newErrors.email = "Email cannot exceed 100 characters.";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!VALIDATION.PHONE_REGEX.test(formData.phoneNumber)) {
      newErrors.phoneNumber =
        "Please enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role.";
    }

    if (
      formData.managerEmployeeCode.trim() &&
      !VALIDATION.EMPLOYEE_CODE_REGEX.test(formData.managerEmployeeCode.trim())
    ) {
      newErrors.managerEmployeeCode =
        "Manager employee code must be in the format EMPXXXXXXXX.";
    } else if (!formData.managerEmployeeCode.trim() && managerSearch.trim()) {
      newErrors.managerEmployeeCode = "Please select a manager from the dropdown or clear the search.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const request = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        role: Number(formData.role),
        managerEmployeeCode: formData.managerEmployeeCode.trim() || null,
      };

      await api.post("/admin/employees", request);

      navigate("/admin/employees");
    } catch (error) {
      console.error("Failed to create employee:", error);

      setSubmitError(
        error.response?.data?.message ||
        "Failed to create employee. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formGroupClass = "flex flex-col gap-1.5";
  const labelClass = "text-slate-900 text-sm font-semibold";
  const inputBase =
    "w-full h-[42px] px-3 box-border border border-slate-300 rounded-lg bg-white text-slate-900 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10";
  const inputInvalid = "!border-red-600 focus:!ring-red-600/15";
  const errorClass = "text-red-600 text-xs leading-tight";

  return (
    <div className="w-full max-w-[900px] mx-auto font-sans">
      <div className="mb-6">
        <h1 className="m-0 mb-1.5 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[480px]:text-2xl">
          Create Employee
        </h1>
        <p className="m-0 text-slate-500 text-sm">
          Add a new employee to the system.
        </p>
      </div>

      {submitError && (
        <div
          className="flex items-center gap-2 mb-4 p-2.5 px-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px] leading-relaxed"
          role="alert"
          aria-live="assertive"
        >
          <span>{submitError}</span>
        </div>
      )}

      <form
        className="grid grid-cols-2 gap-5 p-7 bg-white border border-slate-200 rounded-xl shadow-[0_2px_8px_rgba(15,23,42,0.04)] max-[767px]:grid-cols-1 max-[767px]:p-5 max-[480px]:p-4"
        onSubmit={handleSubmit}
      >
        {/* First Name */}
        <div className={formGroupClass}>
          <label htmlFor="firstName" className={labelClass}>
            First Name
          </label>

          <input
            id="firstName"
            type="text"
            placeholder="Enter first name"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({
                ...formData,
                firstName: e.target.value,
              });
            }}
            className={`${inputBase} ${errors.firstName ? inputInvalid : ""}`}
          />

          {errors.firstName && (
            <span className={errorClass}>{errors.firstName}</span>
          )}
        </div>

        {/* Last Name */}
        <div className={formGroupClass}>
          <label htmlFor="lastName" className={labelClass}>
            Last Name
          </label>

          <input
            id="lastName"
            type="text"
            placeholder="Enter last name"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({
                ...formData,
                lastName: e.target.value,
              });
            }}
            className={`${inputBase} ${errors.lastName ? inputInvalid : ""}`}
          />

          {errors.lastName && (
            <span className={errorClass}>{errors.lastName}</span>
          )}
        </div>

        {/* Email - full width on desktop */}
        <div className={`${formGroupClass} col-span-2 max-[767px]:col-span-1`}>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => {
              setFormData({
                ...formData,
                email: e.target.value,
              });
            }}
            className={`${inputBase} ${errors.email ? inputInvalid : ""}`}
          />

          {errors.email && <span className={errorClass}>{errors.email}</span>}
        </div>

        {/* Phone Number */}
        <div className={formGroupClass}>
          <label htmlFor="phoneNumber" className={labelClass}>
            Phone Number
          </label>

          <input
            id="phoneNumber"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={formData.phoneNumber}
            onChange={(e) => {
              setFormData({
                ...formData,
                phoneNumber: e.target.value,
              });
            }}
            className={`${inputBase} ${errors.phoneNumber ? inputInvalid : ""}`}
          />

          {errors.phoneNumber && (
            <span className={errorClass}>{errors.phoneNumber}</span>
          )}
        </div>

        {/* Role */}
        <div className={formGroupClass}>
          <label htmlFor="role" className={labelClass}>
            Role
          </label>

          <div className="relative" ref={roleSelectRef}>
            <button
              id="role"
              type="button"
              className={`flex items-center justify-between w-full h-[42px] px-3 box-border border border-slate-300 rounded-lg bg-white text-slate-900 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-150 text-left focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10 cursor-pointer ${
                errors.role ? inputInvalid : ""
              }`}
              onClick={() => setRoleDropdownOpen((prev) => !prev)}
              aria-invalid={Boolean(errors.role)}
              aria-expanded={roleDropdownOpen}
            >
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {formData.role === ""
                  ? "Select role"
                  : formData.role === ROLES.Manager
                    ? "Manager"
                    : "Employee"}
              </span>
              <RxChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 shrink-0 ml-2 ${
                  roleDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {roleDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] inset-x-0 z-20 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-[0_8px_20px_rgba(15,23,42,0.1)]">
                {[
                  { value: ROLES.Manager, label: "Manager" },
                  { value: ROLES.Employee, label: "Employee" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`flex items-center w-full px-3 py-2.5 bg-transparent border-none text-left font-sans text-[13px] text-slate-900 cursor-pointer hover:bg-slate-100 ${
                      formData.role === opt.value
                        ? "!bg-blue-50 font-medium"
                        : ""
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, role: opt.value });
                      setRoleDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errors.role && <span className={errorClass}>{errors.role}</span>}
        </div>

        {/* Reporting Manager */}
        <div className={formGroupClass}>
          <label htmlFor="managerEmployeeCode" className={labelClass}>
            Reporting Manager
            <span className="text-slate-400 text-xs font-normal"> (Optional)</span>
          </label>

          <div className="relative" ref={managerSelectRef}>
            <input
              id="managerEmployeeCode"
              type="text"
              placeholder="Search manager by name or employee code"
              value={managerSearch}
              onFocus={() => {
                if (selectedManager) setManagerSearch("");
                setManagerDropdownOpen(true);
              }}
              onChange={(e) => {
                const value = e.target.value;

                setManagerSearch(value);
                setManagerDropdownOpen(true);
                setSelectedManager(null);

                setFormData({
                  ...formData,
                  managerEmployeeCode: "",
                });
              }}
              className={`${inputBase} pr-14 ${
                errors.managerEmployeeCode ? inputInvalid : ""
              }`}
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {selectedManager && (
                <button
                  type="button"
                  className="flex items-center justify-center p-0.5 bg-transparent border-none text-slate-400 rounded cursor-pointer hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear selected manager"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedManager(null);
                    setManagerSearch("");
                    setFormData({ ...formData, managerEmployeeCode: "" });
                  }}
                >
                  <RxCross2 size={14} />
                </button>
              )}
              <RxChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 pointer-events-none ${
                  managerDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {managerDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] inset-x-0 z-20 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-[0_8px_20px_rgba(15,23,42,0.1)]">
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
                  managers.map((manager) => (
                    <button
                      key={manager.employeeCode}
                      type="button"
                      className={`flex justify-between items-center w-full px-3 py-2.5 bg-transparent border-none text-left font-sans text-[13px] cursor-pointer hover:bg-slate-100 ${
                        manager.employeeCode === selectedManager?.employeeCode
                          ? "!bg-blue-50"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedManager(manager);

                        setManagerSearch(
                          `${manager.fullName} — ${manager.employeeCode}`,
                        );

                        setFormData({
                          ...formData,
                          managerEmployeeCode: manager.employeeCode,
                        });

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

          {errors.managerEmployeeCode && (
            <span className={errorClass}>{errors.managerEmployeeCode}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="col-span-2 max-[767px]:col-span-1 flex justify-end gap-3 mt-2 pt-5 border-t border-slate-200 max-[480px]:flex-col-reverse">
          <button
            type="button"
            className="h-[42px] px-4.5 bg-white text-slate-900 border border-slate-300 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-slate-50 max-[480px]:w-full"
            onClick={() => navigate("/admin/employees")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="h-[42px] px-4.5 bg-blue-600 text-white border border-blue-600 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 hover:border-blue-700 disabled:opacity-60 disabled:cursor-not-allowed max-[480px]:w-full"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
