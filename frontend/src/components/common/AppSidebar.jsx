import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { getLayoutConfig } from "../../config/layoutConfig";

export default function AppSidebar({ onNavigate, role }) {
  const { logout, user } = useAuth();

  const effectiveRole = role || user?.role;
  const config = getLayoutConfig(effectiveRole);
  const navItems = config.sidebarNav || [];

  const linkBase =
    "w-full box-border flex items-center gap-3 px-3.5 py-2.5 bg-transparent text-slate-300 border-none rounded-lg font-sans text-sm font-medium text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-white/8 hover:text-white";

  const linkClass = ({ isActive }) =>
    isActive ? `${linkBase} !bg-blue-600 !text-white font-semibold` : linkBase;

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-60 p-4 box-border bg-slate-900 border-t border-white/6 shadow-[8px_0_20px_rgba(0,0,0,0.15)] z-[90] flex flex-col justify-between overflow-y-auto max-[1023px]:w-[220px] max-[767px]:w-60">
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end !== false}
              className={linkClass}
              onClick={onNavigate}
            >
              {ItemIcon && <ItemIcon size={20} className="shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
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
