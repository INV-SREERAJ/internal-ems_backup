import { useEffect, useRef, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";

export default function AdminNavbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout, user } = useAuth();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItemClass =
    "w-full box-border block px-3 py-[10px] bg-transparent text-slate-600 border-none rounded-md font-sans text-sm text-left no-underline cursor-pointer hover:bg-blue-50 hover:text-slate-900";

  return (
    <header className="fixed top-0 inset-x-0 h-16 box-border flex items-center justify-between bg-slate-900 text-white z-[100] px-6 max-[767px]:px-4 max-[480px]:px-3">
      <div className="flex items-center gap-4 max-[480px]:gap-2.5">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center p-0 bg-transparent text-white border-none rounded-lg text-[22px] cursor-pointer transition-colors duration-150 hover:bg-white/8"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <Link
          to="/admin"
          className="text-white text-xl font-bold tracking-[-0.5px] no-underline max-[767px]:text-lg max-[480px]:text-[17px]"
        >
          Workforce <span className="text-blue-500">OS</span>
        </Link>
      </div>

      <div className="relative" ref={profileRef}>
        <button
          type="button"
          className="bg-blue-600 text-white border-none rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 px-4 py-[9px] max-[767px]:px-3 max-[767px]:py-2 max-[480px]:text-[13px]"
          onClick={() => setProfileOpen((current) => !current)}
        >
          Profile
        </button>

        {profileOpen && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-[170px] p-2 box-border flex flex-col gap-1 bg-white border border-slate-200 rounded-lg shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] z-[200]">
            <Link
              to={`/admin/employees/edit/${user?.employeeCode}`}
              className={menuItemClass}
            >
              Edit Profile
            </Link>
            <button type="button" className={menuItemClass} onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}