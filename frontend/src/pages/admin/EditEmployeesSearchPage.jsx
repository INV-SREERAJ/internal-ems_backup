import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditEmployeesSearchPage.css";

export default function EditEmployeeSearchPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    const code = employeeCode.trim();

    if (!code) {
      setError("Please enter an employee code.");
      return;
    }

    setError("");

    navigate(`/admin/employees/edit/${encodeURIComponent(code)}`);
  };

  return (
    <section className="edit-employee-search-page">
      <div className="edit-employee-search-header">
        <h1>Edit Employee</h1>
        <p>Enter an employee code to find the employee you want to edit.</p>
      </div>

      <div className="edit-employee-search-card">
        <form onSubmit={handleSearch}>
          <label htmlFor="employeeCode">Employee Code</label>

          <div className="edit-employee-search-input-row">
            <input
              id="employeeCode"
              type="text"
              value={employeeCode}
              onChange={(e) => {
                setEmployeeCode(e.target.value);
                setError("");
              }}
              placeholder="Enter employee code"
              autoComplete="off"
            />

            <button type="submit">Search</button>
          </div>

          {error && <p className="edit-employee-search-error">{error}</p>}
        </form>
      </div>
    </section>
  );
}
