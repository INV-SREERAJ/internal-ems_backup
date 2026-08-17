import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function AdminSidebar({ onNavigate }) {
  const { logout } = useAuth();
  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin" end className={linkClass} onClick={onNavigate}>
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/employees"
          end
          className={linkClass}
          onClick={onNavigate}
        >
          View Employees
        </NavLink>

        <NavLink
          to="/admin/employees/create-employee"
          end
          className={linkClass}
          onClick={onNavigate}
        >
          Create Employee
        </NavLink>

        <NavLink
          to="/admin/employees/edit"
          end
          className={linkClass}
          onClick={onNavigate}
        >
          Edit Employees
        </NavLink>

        <button type="button" className="admin-logout-btn" onClick={logout}>
          Logout
        </button>
      </nav>
    </aside>
  );
}
