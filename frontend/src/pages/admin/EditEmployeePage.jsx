import { useEffect, useMemo, useState, useRef } from "react";
import { RxChevronDown, RxCross2 } from "react-icons/rx";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { ROLES, VALIDATION } from "../../utils/constants";
import "./EditEmployeePage.css";

function validateEmployee(employee) {
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
  const [managers, setManagers] = useState([]);
  const [managerLoading, setManagerLoading] = useState(true);
  const [managerError, setManagerError] = useState(null);
  const [managerSearch, setManagerSearch] = useState("");
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const selectedManagerRef = useRef(selectedManager);
  const managerSelectRef = useRef(null);

  // Role dropdown state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleSelectRef = useRef(null);

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusSelectRef = useRef(null);

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

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setManagerLoading(true);
        setManagerError(null);

        const managerRes = await api.get("/admin/employees", {
          params: {
            pageNumber: 1,
            pageSize: 100,
            role: "manager",
          },
        });

        const adminRes = await api.get("/admin/employees", {
          params: {
            pageNumber: 1,
            pageSize: 100,
            role: "admin",
          },
        });

        const combined = [...adminRes.data.data, ...managerRes.data.data];
        setManagers(combined);
      } catch (error) {
        setManagerError("Failed to load managers.");
      } finally {
        setManagerLoading(false);
      }
    };

    fetchManagers();
  }, []);

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

      if (
        statusSelectRef.current &&
        !statusSelectRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      if (manager.employeeCode === employeeCode) return false;

      const search = managerSearch.toLowerCase().trim();
      if (!search) return true;
      return (
        (manager.fullName && manager.fullName.toLowerCase().includes(search)) ||
        (manager.employeeCode && manager.employeeCode.toLowerCase().includes(search))
      );
    });
  }, [managers, employeeCode, managerSearch]);

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

    const errors = validateEmployee(employee);

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
      // The backend has two separate endpoints: PUT updates the basic
      // details/role, PATCH .../status handles activate/deactivate (it runs
      // its own business rules, e.g. can't disable yourself or a manager
      // with active reports). They must be sent as separate requests.
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

      const statusChanged = employee.status !== initialEmployee.status;

      if (statusChanged) {
        try {
          await api.patch(
            `/admin/employees/${encodeURIComponent(employeeCode)}/status`,
            { status: employee.status },
          );

          updatedEmployee = { ...updatedEmployee, status: employee.status };
        } catch (error) {
          setEmployee(updatedEmployee);
          setInitialEmployee(updatedEmployee);
          setSaveError(
            error.response?.data?.message ||
              "Details were saved, but the status change failed.",
          );
          setSaveSuccess(false);
          return;
        }
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
      <section className="edit-employee-page">
        <div className="edit-employee-state">
          <p>Loading employee...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="edit-employee-page">
        <div className="edit-employee-state edit-employee-state-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/admin/employees/edit")}
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

  return (
    <section className="edit-employee-page">
      <div className="edit-employee-header">
        <div>
          <h1>Edit Employee</h1>
          <p>Update the employee information and save your changes.</p>
        </div>

        <button
          type="button"
          className="edit-employee-back-btn"
          onClick={() => attemptNavigate("/admin/employees")}
          disabled={saving}
        >
          Back to Employees
        </button>
      </div>

      <div className="edit-employee-card">
        {saveSuccess && (
          <div className="edit-employee-banner edit-employee-banner-success">
            Changes saved successfully.
          </div>
        )}

        {saveError && (
          <div className="edit-employee-banner edit-employee-banner-error">
            {saveError}
          </div>
        )}

        <div className="edit-employee-section">
          <h2>Basic Information</h2>

          <div className="edit-employee-grid">
            <div className="edit-employee-field">
              <label htmlFor="employeeCode">Employee Code</label>

              <input
                id="employeeCode"
                type="text"
                value={employee.employeeCode || ""}
                disabled
              />
            </div>

            <div className="edit-employee-field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                value={employee.email || ""}
                disabled
              />
            </div>

            <div className="edit-employee-field">
              <label htmlFor="firstName">First Name</label>

              <input
                id="firstName"
                type="text"
                value={employee.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className={
                  fieldErrors.firstName ? "edit-employee-field-invalid" : ""
                }
                aria-invalid={Boolean(fieldErrors.firstName)}
              />

              {fieldErrors.firstName && (
                <span className="edit-employee-field-error">
                  {fieldErrors.firstName}
                </span>
              )}
            </div>

            <div className="edit-employee-field">
              <label htmlFor="lastName">Last Name</label>

              <input
                id="lastName"
                type="text"
                value={employee.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className={
                  fieldErrors.lastName ? "edit-employee-field-invalid" : ""
                }
                aria-invalid={Boolean(fieldErrors.lastName)}
              />

              {fieldErrors.lastName && (
                <span className="edit-employee-field-error">
                  {fieldErrors.lastName}
                </span>
              )}
            </div>

            <div className="edit-employee-field">
              <label htmlFor="phoneNumber">Phone Number</label>

              <input
                id="phoneNumber"
                type="tel"
                value={employee.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className={
                  fieldErrors.phoneNumber ? "edit-employee-field-invalid" : ""
                }
                aria-invalid={Boolean(fieldErrors.phoneNumber)}
              />

              {fieldErrors.phoneNumber && (
                <span className="edit-employee-field-error">
                  {fieldErrors.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="edit-employee-section">
          <h2>Organization</h2>

          <div className="edit-employee-grid">
            <div className="edit-employee-field">
              <label htmlFor="role">Role</label>

              <div className="custom-select-wrapper" ref={roleSelectRef}>
                <button
                  id="role"
                  type="button"
                  className={`custom-select-trigger${
                    fieldErrors.role ? " edit-employee-field-invalid" : ""
                  }${
                    employee.role === "Admin" || saving
                      ? " custom-select-disabled"
                      : ""
                  }`}
                  disabled={employee.role === "Admin" || saving}
                  onClick={() => {
                    if (employee.role === "Admin" || saving) return;
                    setRoleDropdownOpen((prev) => !prev);
                  }}
                  aria-invalid={Boolean(fieldErrors.role)}
                  aria-expanded={roleDropdownOpen}
                >
                  <span className="custom-select-value">
                    {employee.role || "Select role"}
                  </span>
                  <RxChevronDown
                    size={14}
                    className={`custom-select-chevron${
                      roleDropdownOpen ? " custom-select-chevron-open" : ""
                    }`}
                  />
                </button>

                {roleDropdownOpen && employee.role !== "Admin" && (
                  <div className="custom-select-dropdown">
                    {["Employee", "Manager"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`custom-select-option${
                          employee.role === role
                            ? " custom-select-option-selected"
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
                <span className="edit-employee-field-error">
                  {fieldErrors.role}
                </span>
              )}
            </div>

            <div className="edit-employee-field">
              <label htmlFor="status">Status</label>

              <div className="custom-select-wrapper" ref={statusSelectRef}>
                <button
                  id="status"
                  type="button"
                  className={`custom-select-trigger${
                    fieldErrors.status ? " edit-employee-field-invalid" : ""
                  }${
                    employee.role === "Admin" || saving
                      ? " custom-select-disabled"
                      : ""
                  }`}
                  disabled={employee.role === "Admin" || saving}
                  onClick={() => {
                    if (employee.role === "Admin" || saving) return;
                    setStatusDropdownOpen((prev) => !prev);
                  }}
                  aria-invalid={Boolean(fieldErrors.status)}
                  aria-expanded={statusDropdownOpen}
                >
                  <span className="custom-select-value">
                    {employee.status === 1 ? "Active" : "Inactive"}
                  </span>
                  <RxChevronDown
                    size={14}
                    className={`custom-select-chevron${
                      statusDropdownOpen ? " custom-select-chevron-open" : ""
                    }`}
                  />
                </button>

                {statusDropdownOpen && (
                  <div className="custom-select-dropdown">
                    {[
                      { value: 1, label: "Active" },
                      { value: 2, label: "Inactive" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`custom-select-option${
                          employee.status === opt.value
                            ? " custom-select-option-selected"
                            : ""
                        }`}
                        onClick={() => {
                          handleChange("status", opt.value);
                          setStatusDropdownOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {fieldErrors.status && (
                <span className="edit-employee-field-error">
                  {fieldErrors.status}
                </span>
              )}
            </div>

            <div className="edit-employee-field">
              <label htmlFor="managerEmployeeCode">Reporting Manager</label>

              <div className="manager-select-wrapper" ref={managerSelectRef}>
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
                  className={
                    fieldErrors.managerEmployeeCode
                      ? "edit-employee-field-invalid"
                      : ""
                  }
                  aria-invalid={Boolean(fieldErrors.managerEmployeeCode)}
                />

                <div className="manager-input-icons">
                  {selectedManager && employee.role !== "Admin" && !saving && (
                    <button
                      type="button"
                      className="manager-clear-btn"
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
                      className={`manager-chevron${
                        managerDropdownOpen ? " manager-chevron-open" : ""
                      }`}
                    />
                  )}
                </div>

                {managerDropdownOpen && employee.role !== "Admin" && (
                  <div className="manager-dropdown">
                    {managerLoading && (
                      <div className="manager-dropdown-message">
                        Loading managers...
                      </div>
                    )}
                    {!managerLoading && managerError && (
                      <div className="manager-dropdown-message manager-dropdown-error">
                        {managerError}
                      </div>
                    )}
                    {!managerLoading &&
                      !managerError &&
                      filteredManagers.length === 0 && (
                        <div className="manager-dropdown-message">
                          No managers found.
                        </div>
                      )}
                    {!managerLoading &&
                      !managerError &&
                      filteredManagers.map((manager) => (
                        <button
                          key={manager.employeeCode}
                          type="button"
                          className={`manager-option${
                            manager.employeeCode ===
                            selectedManager?.employeeCode
                              ? " manager-option-selected"
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
                          <span className="manager-option-name">
                            {manager.fullName}
                          </span>
                          <span className="manager-option-code">
                            {manager.employeeCode}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {fieldErrors.managerEmployeeCode && (
                <span className="edit-employee-field-error">
                  {fieldErrors.managerEmployeeCode}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="edit-employee-actions">
          <button
            type="button"
            className="edit-employee-cancel-btn"
            onClick={() => attemptNavigate("/admin/employees")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="edit-employee-save-btn"
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
