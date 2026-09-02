import { useEffect, useRef, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
} from "react-icons/hi2";

export default function ManagerNavbar({ onMenuClick }) {
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
    "w-full box-border flex items-center gap-2.5 px-3 py-2 bg-transparent text-slate-700 border-none rounded-lg font-sans text-sm text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900";

  const logoutItemClass =
    "w-full box-border flex items-center gap-2.5 px-3 py-2 bg-transparent text-slate-700 border-none rounded-lg font-sans text-sm text-left no-underline cursor-pointer transition-colors duration-150 hover:bg-red-50 hover:text-red-600";

  return (
    <header className="fixed top-0 inset-x-0 h-16 box-border flex items-center justify-between bg-slate-900 text-white z-[100] px-6 max-[767px]:px-4 max-[480px]:px-3">
      <div className="flex items-center gap-4 max-[480px]:gap-2.5">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center p-0 bg-transparent text-white border-none rounded-lg text-[22px] cursor-pointer transition-colors duration-150 hover:bg-white/8"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <HiOutlineBars3 size={24} />
        </button>

        <Link
          to="/manager"
          className="flex items-center gap-2 text-white text-xl font-bold tracking-[-0.5px] no-underline max-[767px]:text-lg max-[480px]:text-[17px]"
        >
          <span>
            Workforce <span className="text-blue-500">OS</span>
          </span>
          <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full tracking-normal">
            Manager
          </span>
        </Link>
      </div>

      <div className="relative" ref={profileRef}>
        <button
          type="button"
          className="bg-blue-600 text-white border-none rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 px-4 py-[9px] max-[767px]:px-3 max-[767px]:py-2 max-[480px]:text-[13px]"
          onClick={() => setProfileOpen((current) => !current)}
          aria-expanded={profileOpen}
        >
          {user?.firstName ? `${user.firstName}` : "Profile"}
        </button>

        {profileOpen && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-[180px] p-1.5 box-border flex flex-col gap-0.5 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12),0_8px_10px_-6px_rgba(15,23,42,0.08)] z-[200]">
            <Link
              to="/manager/profile"
              className={menuItemClass}
              onClick={() => setProfileOpen(false)}
            >
              <HiOutlineUser size={17} className="text-slate-500 shrink-0" />
              <span>My Profile</span>
            </Link>
            <button
              type="button"
              className={logoutItemClass}
              onClick={() => {
                setProfileOpen(false);
                logout();
              }}
            >
              <HiOutlineArrowRightOnRectangle
                size={17}
                className="text-red-500 shrink-0"
              />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
