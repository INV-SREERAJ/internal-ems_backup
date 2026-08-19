import { Link } from "react-router-dom";
import { STATUS_LABEL, STATUS_CLASS } from "../../utils/constants";

export default function EmployeeTable({
  employees,
  onSort,
  sortBy,
  descending,
  onDelete,
}) {
  return (
    <div className="employees-table-wrapper">
      <table className="employee-table">
        <colgroup>
          <col className="employee-code-column" />
          <col className="full-name-column" />
          <col className="email-column" />
          <col className="phone-column" />
          <col className="role-column" />
          <col className="manager-column" />
          <col className="status-column" />
          <col className="action-column" />
        </colgroup>

        <thead>
          <tr>
            <th>
              <div className="employee-table-th-content">
                <span>Employee Code</span>
                <button
                  type="button"
                  onClick={() => onSort("employeeCode")}
                  className={`sort-button${sortBy === "employeeCode" ? " sort-button-active" : ""}`}
                  aria-label="Sort by employee code"
                >
                  {sortBy === "employeeCode" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>
            <th>
              <div className="employee-table-th-content">
                <span>Full Name</span>
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className={`sort-button${
                    sortBy === "name" ? " sort-button-active" : ""
                  }`}
                  aria-label="Sort by full name"
                >
                  {sortBy === "name" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>

            <th>
              <div className="employee-table-th-content">
                <span>Email</span>
                <button
                  type="button"
                  onClick={() => onSort("email")}
                  className={`sort-button${
                    sortBy === "email" ? " sort-button-active" : ""
                  }`}
                  aria-label="Sort by email"
                >
                  {sortBy === "email" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>

            <th>Phone Number</th>

            <th>
              <div className="employee-table-th-content">
                <span>Role</span>
                <button
                  type="button"
                  onClick={() => onSort("role")}
                  className={`sort-button${
                    sortBy === "role" ? " sort-button-active" : ""
                  }`}
                  aria-label="Sort by role"
                >
                  {sortBy === "role" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>
            <th>Manager</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.employeeCode}>
              <td>
                <span
                  className="employee-table-text"
                  title={employee.employeeCode}
                >
                  {employee.employeeCode}
                </span>
              </td>
              <td>
                <span className="employee-table-text" title={employee.fullName}>
                  {employee.fullName}
                </span>
              </td>
              <td>
                <span className="employee-table-text" title={employee.email}>
                  {employee.email}
                </span>
              </td>
              <td>
                <span
                  className="employee-table-text"
                  title={employee.phoneNumber}
                >
                  {employee.phoneNumber}
                </span>
              </td>
              <td>
                <span className="employee-table-text" title={employee.role}>
                  {employee.role}
                </span>
              </td>
              <td>
                <span
                  className="employee-table-text"
                  title={employee.managerName ?? "-"}
                >
                  {employee.managerName ?? "-"}
                </span>
              </td>
              <td>
                <span
                  className={`employee-status ${
                    STATUS_CLASS[employee.status] || "employee-status-deleted"
                  }`}
                >
                  {STATUS_LABEL[employee.status] || "Unknown"}
                </span>
              </td>
              <td>
                <div className="employee-table-actions">
                  {/*
                    IMPORTANT: EditEmployeePage reads the code from a URL
                    param (useParams), not router state, so the code must
                    be part of the path here to match.
                  */}
                  <Link
                    to={`/admin/employees/edit/${employee.employeeCode}`}
                    className="employee-edit-btn"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(employee.employeeCode)}
                    className="employee-delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
