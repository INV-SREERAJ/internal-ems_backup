import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function AdminSidebar({ onNavigate }) {
  const { logout } = useAuth();

  const linkBase =
    "w-full box-border block px-3.5 py-[11px] bg-transparent text-slate-300 border-none rounded-lg font-sans text-sm font-medium text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-white/8 hover:text-white";

  const linkClass = ({ isActive }) =>
    isActive ? `${linkBase} !bg-blue-600 !text-white` : linkBase;

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-60 py-6 px-4 box-border bg-slate-900 border-t border-white/6 shadow-[8px_0_20px_rgba(0,0,0,0.15)] z-[90] overflow-y-auto max-[1023px]:w-[220px] max-[767px]:w-60">
      <nav className="flex flex-col gap-1.5">
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

        <button
          type="button"
          className={`${linkBase} mt-[400px]`}
          onClick={logout}
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}