import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";

import "./AdminLayout.css";
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <AdminNavbar onMenuClick={() => setSidebarOpen((current) => !current)} />

      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeSidebar} />
      )}

      {sidebarOpen && <AdminSidebar onNavigate={closeSidebar} />}

      <main className={`admin-main${sidebarOpen ? " admin-main-shifted" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
