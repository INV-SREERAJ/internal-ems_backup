import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

export default function ManagerSidebar({ onNavigate }) {
  const { logout } = useAuth();

  const linkBase =
    "w-full box-border flex items-center gap-3 px-3.5 py-2.5 bg-transparent text-slate-300 border-none rounded-lg font-sans text-sm font-medium text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-white/8 hover:text-white";

  const linkClass = ({ isActive }) =>
    isActive ? `${linkBase} !bg-blue-600 !text-white font-semibold` : linkBase;

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-60 p-4 box-border bg-slate-900 border-t border-white/6 shadow-[8px_0_20px_rgba(0,0,0,0.15)] z-[90] flex flex-col justify-between overflow-y-auto max-[1023px]:w-[220px] max-[767px]:w-60">
      <nav className="flex flex-col gap-1.5">
        <NavLink to="/manager" end className={linkClass} onClick={onNavigate}>
          <HiOutlineSquares2X2 size={20} className="shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/manager/team"
          end
          className={linkClass}
          onClick={onNavigate}
        >
          <HiOutlineUsers size={20} className="shrink-0" />
          <span>My Direct Reports</span>
        </NavLink>

        <NavLink
          to="/manager/profile"
          end
          className={linkClass}
          onClick={onNavigate}
        >
          <HiOutlineUser size={20} className="shrink-0" />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <div className="pt-4 mt-auto border-t border-white/10">
        <button
          type="button"
          className="w-full box-border flex items-center gap-3 px-3.5 py-2.5 bg-transparent text-slate-300 border-none rounded-lg font-sans text-sm font-medium text-left cursor-pointer transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
          onClick={logout}
        >
          <HiOutlineArrowRightOnRectangle size={20} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
