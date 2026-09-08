import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";
import AppSidebar from "./AppSidebar";

export default function AppLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900">
      <AppNavbar
        onMenuClick={() => setSidebarOpen((current) => !current)}
        role={role}
      />

      {sidebarOpen && (
        <div
          className="hidden max-[767px]:block max-[767px]:fixed max-[767px]:top-16 max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:bg-slate-900/40 max-[767px]:z-[80]"
          onClick={closeSidebar}
        />
      )}

      {sidebarOpen && <AppSidebar onNavigate={closeSidebar} role={role} />}

      <main
        className={`min-h-screen box-border transition-[margin-left] duration-200 pt-[88px] px-8 pb-8 max-[1023px]:px-6 max-[767px]:pt-[84px] max-[767px]:px-4 max-[767px]:pb-6 max-[480px]:px-3${
          sidebarOpen
            ? " ml-60 max-[1023px]:ml-[220px] max-[767px]:ml-0"
            : ""
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
