import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import { AUTH_STATUS } from "./utils/authStatus";
import SplashScreen from "./pages/Loading/SplashScreen";
import { ROLES, ROLE_LABEL } from "./utils/constants";

// LazyLoading pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const UnauthorizedPage = lazy(() => import("./pages/auth/UnauthorizedPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const EmployeesPage = lazy(() => import("./pages/admin/EmployeesPage"));
const EditEmployeePage = lazy(() => import("./pages/admin/EditEmployeePage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ChangePasswordPage = lazy(() => import("./pages/auth/ChangePasswordPage"));
const CreateEmployee = lazy(() => import("./pages/admin/CreateEmployee"));
const EditEmployeesSearchPage = lazy(() =>
  import("./pages/admin/EditEmployeesSearchPage")
);

// Manager pages
const ManagerLayout = lazy(() => import("./pages/manager/ManagerLayout"));
const ManagerDashboard = lazy(() => import("./pages/manager/ManagerDashboard"));
const ManagerTeamPage = lazy(() => import("./pages/manager/ManagerTeamPage"));
const ManagerProfilePage = lazy(() =>
  import("./pages/manager/ManagerProfilePage")
);

function ProtectedRoute({ children, allowedRoles, checkPasswordChange = true }) {
  const { status, user } = useAuth();

  if (status === AUTH_STATUS.INITIALIZING) {
    return <SplashScreen />;
  }

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/login" replace />;
  }

  if (checkPasswordChange && user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function getDefaultRoute(user) {
  switch (user?.role) {
    case ROLE_LABEL[ROLES.Admin]:
      return "/admin";
    case ROLE_LABEL[ROLES.Manager]:
      return "/manager";
    default:
      return "/unauthorized";
  }
}

export default function App() {
  const { status, user } = useAuth();

  if (status === AUTH_STATUS.INITIALIZING) return <SplashScreen />;

  const defaultRoute = getDefaultRoute(user);

  return (
    // Suspense wraps the whole Routes tree
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        <Route
          path="/login"
          element={
            status === AUTH_STATUS.AUTHENTICATED ? (
              <Navigate to={defaultRoute} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        <Route
          path="/change-password"
          element={
            <ProtectedRoute checkPasswordChange={false}>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLE_LABEL[ROLES.Admin]]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route
            path="employees/create-employee"
            element={<CreateEmployee />}
          />
          <Route
            path="employees/edit/:employeeCode"
            element={<EditEmployeePage />}
          />
          <Route path="employees/edit" element={<EditEmployeesSearchPage />} />
        </Route>

        {/* Manager Routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={[ROLE_LABEL[ROLES.Manager]]}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="team" element={<ManagerTeamPage />} />
          <Route path="profile" element={<ManagerProfilePage />} />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={status === AUTH_STATUS.AUTHENTICATED ? defaultRoute : "/login"}
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}