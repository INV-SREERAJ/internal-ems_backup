import "./CreateEmployee.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { ROLES, VALIDATION } from "../../utils/constants";
import { RxChevronDown, RxCross2 } from "react-icons/rx";

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

  const [managers, setManagers] = useState([]);
  const [managerLoading, setManagerLoading] = useState(true);
  const [managerError, setManagerError] = useState(null);

  const [managerSearch, setManagerSearch] = useState("");
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  const managerSelectRef = useRef(null);

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
        console.error("Failed to fetch managers:", error);
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
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredManagers = managers.filter((manager) => {
    const search = managerSearch.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      manager.fullName.toLowerCase().includes(search) ||
      manager.employeeCode.toLowerCase().includes(search)
    );
  });

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

      const response = await api.post("/admin/employees", request);



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

  return (
    <div className="create-employee-page">
      <div className="create-employee-header">
        <h1>Create Employee</h1>
        <p>Add a new employee to the system.</p>
      </div>

      {submitError && (
        <div className="submit-error" role="alert" aria-live="assertive">
          <span>{submitError}</span>
        </div>
      )}

      <form className="create-employee-form" onSubmit={handleSubmit}>
        {/* First Name */}
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>

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
          />

          {errors.firstName && (
            <span className="form-error">{errors.firstName}</span>
          )}
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>

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
          />

          {errors.lastName && (
            <span className="form-error">{errors.lastName}</span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email</label>

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
          />

          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        {/* Phone Number */}
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>

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
          />

          {errors.phoneNumber && (
            <span className="form-error">{errors.phoneNumber}</span>
          )}
        </div>

        {/* Role */}
        <div className="form-group">
          <label htmlFor="role">Role</label>

          <select
            id="role"
            value={formData.role}
            onChange={(e) => {
              setFormData({
                ...formData,
                role: e.target.value,
              });
            }}
          >
            <option value="" disabled>
              Select role
            </option>

            <option value={ROLES.Manager}>Manager</option>
            <option value={ROLES.Employee}>Employee</option>
          </select>

          {errors.role && <span className="form-error">{errors.role}</span>}
        </div>

        {/* Reporting Manager */}
        <div className="form-group">
          <label htmlFor="managerEmployeeCode">
            Reporting Manager
            <span className="optional-label"> (Optional)</span>
          </label>

          <div className="manager-select-wrapper" ref={managerSelectRef}>
            <input
              id="managerEmployeeCode"
              type="text"
              placeholder="Search manager by name or employee code"
              value={managerSearch}
              // onFocus={() => { setManagerDropdownOpen(true); }}
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
            />

            <div className="manager-input-icons">
              {selectedManager && (
                <button
                  type="button"
                  className="manager-clear-btn"
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
                className={`manager-chevron${managerDropdownOpen ? " manager-chevron-open" : ""}`}
              />
            </div>

            {managerDropdownOpen && (
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
                      className={`manager-option${manager.employeeCode === selectedManager?.employeeCode
                        ? " manager-option-selected"
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

          {errors.managerEmployeeCode && (
            <span className="form-error">{errors.managerEmployeeCode}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="create-employee-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate("/admin/employees")}>
            Cancel
          </button>

          <button type="submit" className="create-btn" disabled={submitting}>
            {submitting ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
