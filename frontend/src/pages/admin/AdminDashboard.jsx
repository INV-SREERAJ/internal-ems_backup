import { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <AdminNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {sidebarOpen && <AdminSidebar />}

      <main>
        <Routes>
          <Route
            path="/admin"
            element =
            {
              <>
                <h1>Admin Dashboard</h1>
                <p>Welcome to EMS</p>
              </>
            }
          />
          <Route
            path="/admin/employees"
            element={<EmployeesPage />}
          />
          <Route
            path="/admin/edit"
            element={<EditEmployeePage />}
          />
        </Routes>
      </main>
    </div>
  );
}
