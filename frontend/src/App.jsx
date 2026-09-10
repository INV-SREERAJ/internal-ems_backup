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

// Manager pages
const ManagerLayout = lazy(() => import("./pages/manager/ManagerLayout"));
const ManagerDashboard = lazy(() => import("./pages/manager/ManagerDashboard"));
const ManagerTeamPage = lazy(() => import("./pages/manager/ManagerTeamPage"));
const ManagerMyManagerPage = lazy(() => import("./pages/manager/ManagerMyManagerPage"));

// Employee pages
const EmployeeLayout = lazy(() => import("./pages/employee/EmployeeLayout"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));

// Common pages
const AppLayout = lazy(() => import("./components/common/AppLayout"));
const ProfilePage = lazy(() => import("./pages/common/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/common/NotFoundPage"));

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
    return <Navigate to="/not-found" replace />;
  }

  return children;
}

export function getDefaultRoute(user) {
  switch (user?.role) {
    case ROLE_LABEL[ROLES.Admin]:
      return "/admin";
    case ROLE_LABEL[ROLES.Manager]:
      return "/manager";
    case ROLE_LABEL[ROLES.Employee]:
      return "/employee";
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
          path="/"
          element={
            status === AUTH_STATUS.AUTHENTICATED ? (
              <Navigate to={defaultRoute} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

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
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChangePasswordPage />} />
        </Route>

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
          <Route path="my-manager" element={<ManagerMyManagerPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={[ROLE_LABEL[ROLES.Employee]]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}