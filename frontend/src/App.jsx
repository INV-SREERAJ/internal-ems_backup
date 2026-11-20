import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import { AUTH_STATUS } from "./utils/authStatus";
import SplashScreen from "./pages/Loading/Splashscreen";
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
const AdminLeaveTypesPage = lazy(() => import("./pages/admin/AdminLeaveTypesPage"));
const AdminYearlyLeaveConfigPage = lazy(() => import("./pages/admin/AdminYearlyLeaveConfigPage"));
const AdminLeaveRequestsPage = lazy(() => import("./pages/admin/AdminLeaveRequestsPage"));
const AdminEmployeeLeaveBalancesPage = lazy(() => import("./pages/admin/AdminEmployeeLeaveBalancesPage"));
const AdminLeaveCalendarPage = lazy(() => import("./pages/admin/AdminLeaveCalendarPage"));

// Manager pages
const ManagerLayout = lazy(() => import("./pages/manager/ManagerLayout"));
const ManagerDashboard = lazy(() => import("./pages/manager/ManagerDashboard"));
const ManagerTeamPage = lazy(() => import("./pages/manager/ManagerTeamPage"));
const ManagerMyManagerPage = lazy(() => import("./pages/manager/ManagerMyManagerPage"));
const ManagerPendingRequestsPage = lazy(() => import("./pages/manager/ManagerPendingRequestsPage"));
const ManagerAllLeavesPage = lazy(() => import("./pages/manager/ManagerAllLeavesPage"));
const ManagerTeamCalendarPage = lazy(() => import("./pages/manager/ManagerTeamCalendarPage"));

// Employee pages
const EmployeeLayout = lazy(() => import("./pages/employee/EmployeeLayout"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const ApplyLeavePage = lazy(() => import("./pages/employee/ApplyLeavePage"));
const EmployeeLeavesPage = lazy(() => import("./pages/employee/EmployeeLeavesPage"));
const LeaveCalendarPage = lazy(() => import("./pages/employee/LeaveCalendarPage"));
const EmployeeMyManagerPage = lazy(() => import("./pages/employee/EmployeeMyManagerPage"));

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
          <Route path="profile" element={<ProfilePage  />} />
          <Route
            path="employees/edit/:employeeCode"
            element={<EditEmployeePage />}
          />
          <Route path="leaves" element={<Navigate to="/admin/leave-types" replace />} />
          <Route path="leave-types" element={<AdminLeaveTypesPage />} />
          <Route path="yearly-configuration" element={<AdminYearlyLeaveConfigPage />} />
          <Route path="leave-year-configurations" element={<Navigate to="/admin/yearly-configuration" replace />} />
          <Route path="leave-requests" element={<AdminLeaveRequestsPage />} />
          <Route path="all-leaves" element={<Navigate to="/admin/leave-requests" replace />} />
          <Route path="employee-leave-balances" element={<AdminEmployeeLeaveBalancesPage />} />
          <Route path="team-calendar" element={<AdminLeaveCalendarPage />} />
          <Route path="leave-calendar" element={<AdminLeaveCalendarPage />} />
          <Route path="leaves/calendar" element={<Navigate to="/admin/team-calendar" replace />} />
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
          <Route path="leaves" element={<Navigate to="/manager/leaves/pending" replace />} />
          <Route path="leaves/pending" element={<ManagerPendingRequestsPage />} />
          <Route path="leaves/all" element={<ManagerAllLeavesPage />} />
          <Route path="leaves/calendar" element={<ManagerTeamCalendarPage />} />
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
          <Route path="my-manager" element={<EmployeeMyManagerPage />} />
          <Route path="leaves" element={<EmployeeLeavesPage />} />
          <Route path="leaves/apply" element={<ApplyLeavePage />} />
          <Route path="leaves/calendar" element={<LeaveCalendarPage />} />
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