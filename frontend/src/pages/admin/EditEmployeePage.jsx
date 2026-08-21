import { useEffect, useMemo, useState } from "react";
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
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load employee.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeCode]);

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
      const payload = {
        firstName: employee.firstName.trim(),
        lastName: employee.lastName.trim(),
        phoneNumber: employee.phoneNumber.trim(),
        role: ROLES[employee.role],
        status: employee.status,
      };

      const response = await api.put(
        `/admin/employees/${encodeURIComponent(employeeCode)}`,
        payload,
      );

      // Use the server's returned employee as the new baseline.
      setEmployee(response.data);
      setInitialEmployee(response.data);

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

              <select
                id="role"
                value={employee.role || ""}
                onChange={(e) => handleChange("role", e.target.value)}
                className={
                  fieldErrors.role ? "edit-employee-field-invalid" : ""
                }
                aria-invalid={Boolean(fieldErrors.role)}
              >
                {employee.role === "Admin" && (
                  <option value="Admin">Admin</option>
                )}

                {employee.role !== "Admin" && (
                  <>
                    <option value="Employee">Employee</option>

                    <option value="Manager">Manager</option>
                  </>
                )}
              </select>

              {fieldErrors.role && (
                <span className="edit-employee-field-error">
                  {fieldErrors.role}
                </span>
              )}
            </div>

            <div className="edit-employee-field">
              <label htmlFor="status">Status</label>

              <select
                id="status"
                value={employee.status ?? ""}
                onChange={(e) => handleChange("status", Number(e.target.value))}
                disabled={employee.role === "Admin" || saving}
                className={
                  fieldErrors.status ? "edit-employee-field-invalid" : ""
                }
                aria-invalid={Boolean(fieldErrors.status)}
              >
                <option value={1}>Active</option>
                <option value={2}>Inactive</option>
              </select>

              {fieldErrors.status && (
                <span className="edit-employee-field-error">
                  {fieldErrors.status}
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
