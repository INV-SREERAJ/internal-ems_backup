import LoginPage from "./pages/auth/LoginPage";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "./pages/admin/AdminLayout";
import EmployeesPage from "./pages/admin/EmployeesPage";
import EditEmployeePage from "./pages/admin/EditEmployeePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import useAuth from "./hooks/useAuth";
import { AUTH_STATUS } from "./utils/authStatus";
import CreateEmployee from "./pages/admin/CreateEmployee";

export default function App() {
  const { status } = useAuth();

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />

        <Route path="employees" element={<EmployeesPage />} />

        <Route path="employees/create-employee" element={<CreateEmployee />} />
        <Route
          path="employees/edit/:employeeCode"
          element={<EditEmployeePage />}
        />

        <Route path="employees/edit" element={<EditEmployeePage />} />
      </Route>
    </Routes>
  );
}
