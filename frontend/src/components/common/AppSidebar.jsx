import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { HiOutlineArrowRightOnRectangle, HiChevronDown } from "react-icons/hi2";
import { getLayoutConfig } from "../../config/layoutConfig";

export default function AppSidebar({ onNavigate, role }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  const effectiveRole = role || user?.role;
  const config = getLayoutConfig(effectiveRole);
  const navItems = config.sidebarNav || [];

  // Track expanded state for menu groups
  const [openGroups, setOpenGroups] = useState(() => {
    const initialState = {};
    navItems.forEach((item) => {
      if (item.children) {
        // Expand if any child matches current path
        const isActive = item.children.some((child) =>
          location.pathname.startsWith(child.to)
        );
        initialState[item.label] = isActive || item.defaultOpen !== false;
      }
    });
    return initialState;
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const linkBase =
    "w-full box-border flex items-center gap-3 px-3.5 py-2.5 bg-transparent text-slate-300 border-none rounded-lg font-sans text-sm font-medium text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-white/8 hover:text-white";

  const subLinkBase =
    "w-full box-border flex items-center px-3.5 py-2 pl-10 bg-transparent text-slate-400 border-none rounded-lg font-sans text-sm font-medium text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-white/8 hover:text-white";

  const linkClass = ({ isActive }) =>
    isActive ? `${linkBase} !bg-blue-600 !text-white font-semibold` : linkBase;

  const subLinkClass = ({ isActive }) =>
    isActive
      ? `${subLinkBase} !bg-blue-600 !text-white font-semibold`
      : subLinkBase;

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-60 p-4 box-border bg-slate-900 border-t border-white/6 shadow-[8px_0_20px_rgba(0,0,0,0.15)] z-[90] flex flex-col justify-between overflow-y-auto max-[1023px]:w-[220px] max-[767px]:w-60">
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const ItemIcon = item.icon;

          if (item.children) {
            const isOpen = openGroups[item.label] ?? true;
            return (
              <div key={item.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  className="w-full box-border flex items-center justify-between px-3.5 py-2.5 bg-transparent text-slate-300 border-none rounded-lg font-sans text-sm font-medium text-left cursor-pointer transition-colors duration-150 hover:bg-white/8 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    {ItemIcon && <ItemIcon size={20} className="shrink-0" />}
                    <span>{item.label}</span>
                  </div>
                  <HiChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-1 pl-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end !== false}
                        className={subLinkClass}
                        onClick={onNavigate}
                      >
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

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
