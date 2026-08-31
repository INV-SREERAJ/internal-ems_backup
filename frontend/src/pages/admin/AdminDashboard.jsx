import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../hooks/useAuth";
import { CiPause1 } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi2";
import { LiaUserSolid } from "react-icons/lia";
import { FaPlus } from "react-icons/fa6";
import { CiEdit } from "react-icons/ci";
import {
  EMPLOYEE_STATUS,
  STATUS_LABEL,
} from "../../utils/constants";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch first page of employees to derive dashboard stats
        const response = await api.get("/admin/employees", {
          params: {
            pageNumber: 1,
            pageSize: 100,
            includeDeleted: true,
          },
        });

        const allEmployees = response.data.data || [];

        // Compute stats from the data
        const totalEmployees = allEmployees.filter(
          (e) => e.status !== EMPLOYEE_STATUS.Deleted
        ).length;

        const activeCount = allEmployees.filter(
          (e) => e.status === EMPLOYEE_STATUS.Active
        ).length;

        const inactiveCount = allEmployees.filter(
          (e) => e.status === EMPLOYEE_STATUS.Inactive
        ).length;

        // Count roles by string value (API returns role as a display string)
        const roleCounts = {};
        for (const e of allEmployees) {
          if (e.status !== EMPLOYEE_STATUS.Deleted && e.role) {
            roleCounts[e.role] = (roleCounts[e.role] || 0) + 1;
          }
        }

        setStats({
          total: totalEmployees,
          active: activeCount,
          inactive: inactiveCount,
          roles: roleCounts,

        });

        // Get the 5 most recent (non-deleted) for the table
        const recent = allEmployees
          .filter((e) => e.status !== EMPLOYEE_STATUS.Deleted)
          .slice(-8);

        setRecentEmployees(recent);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case EMPLOYEE_STATUS.Active:
        return "dashboard-table-status-active";
      case EMPLOYEE_STATUS.Inactive:
        return "dashboard-table-status-inactive";
      case EMPLOYEE_STATUS.Deleted:
        return "dashboard-table-status-deleted";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <section className="dashboard">
        <div className="dashboard-loading">Loading dashboard…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard">
        <div className="dashboard-error">{error}</div>
      </section>
    );
  }

  const roleEntries = stats ? Object.entries(stats.roles) : [];
  const roleTotal = roleEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <section className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back{user?.email ? `, ${user.email}` : ""}. Here's
          an overview of your organization.
        </p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="dashboard-stats">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon dashboard-stat-icon-blue">
              <HiOutlineUsers size={22} />
            </div>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-label">Total Employees</span>
              <span className="dashboard-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon dashboard-stat-icon-green">
              <LiaUserSolid size={22} />
            </div>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-label">Active</span>
              <span className="dashboard-stat-value">{stats.active}</span>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon dashboard-stat-icon-amber">
              <CiPause1 size={22} />
            </div>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-label">Inactive</span>
              <span className="dashboard-stat-value">{stats.inactive}</span>
            </div>
          </div>

        </div>
      )}

      {/* Body: table + sidebar */}
      <div className="dashboard-body">
        {/* Recent employees */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Recent Employees</h2>
            <Link to="/admin/employees" className="dashboard-section-link">
              View all
            </Link>
          </div>

          {recentEmployees.length === 0 ? (
            <div className="dashboard-table-empty">
              No employees found.
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map((emp) => (
                  <tr key={emp.employeeCode}>
                    <td>
                      <div className="dashboard-table-name">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="dashboard-table-code">
                        {emp.employeeCode}
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>{emp.role || "—"}</td>
                    <td>
                      <span
                        className={`dashboard-table-status ${getStatusClass(emp.status)}`}
                      >
                        {STATUS_LABEL[emp.status] || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar: Quick actions + Role breakdown */}
        <div className="dashboard-quick-actions">
          {/* Quick actions */}
          <div className="dashboard-actions-card">
            <div className="dashboard-actions-card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="dashboard-actions-list">
              <Link
                to="/admin/employees/create-employee"
                className="dashboard-action-link"
              >
                <div className="dashboard-action-icon">
                  <FaPlus size={18} />
                </div>
                Create Employee
              </Link>

              <Link
                to="/admin/employees"
                className="dashboard-action-link"
              >
                <div className="dashboard-action-icon">
                  <HiOutlineUsers size={18} />
                </div>
                View All Employees
              </Link>

              <Link
                to="/admin/employees/edit"
                className="dashboard-action-link"
              >
                <div className="dashboard-action-icon">
                  <CiEdit size={18} />
                </div>
                Edit Employees
              </Link>
            </div>
          </div>

          {/* Role breakdown */}
          {roleTotal > 0 && (
            <div className="dashboard-actions-card">
              <div className="dashboard-actions-card-header">
                <h2>Role Breakdown</h2>
              </div>
              <div className="dashboard-breakdown">
                {roleEntries.map(([role, count], index) => {
                  const barColors = [
                    "dashboard-breakdown-fill-admin",
                    "dashboard-breakdown-fill-manager",
                    "dashboard-breakdown-fill-employee",
                  ];
                  return (
                    <div key={role}>
                      <div className="dashboard-breakdown-row">
                        <span className="dashboard-breakdown-label">
                          {role}s
                        </span>
                        <span className="dashboard-breakdown-value">
                          {count}
                        </span>
                      </div>
                      <div className="dashboard-breakdown-bar">
                        <div
                          className={`dashboard-breakdown-fill ${barColors[index % barColors.length]}`}
                          style={{
                            width: `${(count / roleTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
