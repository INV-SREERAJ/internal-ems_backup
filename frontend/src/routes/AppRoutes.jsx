import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import EmployeeListPage from "../pages/admin/EmployeeListPage";
import OrganizationPage from "../pages/admin/OrganizationPage";
import AdminProfilePage from "../pages/admin/AdminProfilePage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";

// Employee Pages
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import EmployeeProfilePage from "../pages/employee/EmployeeProfilePage";
import EmployeeOrgPage from "../pages/employee/EmployeeOrgPage";

// Error Pages
import ForbiddenPage from "../pages/errors/ForbiddenPage";
import NotFoundPage from "../pages/errors/NotFoundPage";

// Guard & Shell
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Password Change Route for Onboarding / Expired Passwords */}
            <Route
                path="/change-password"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <ChangePasswordPage />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            {/* Admin Shell Routes (Guarded: Admin only) */}
            <Route
                element={
                    <ProtectedRoute roles={["Admin"]}>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/employees" element={<EmployeeListPage />} />
                <Route path="/admin/organization" element={<OrganizationPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Employee Shell Routes (Guarded: Employee & Manager only) */}
            <Route
                element={
                    <ProtectedRoute roles={["Employee", "Manager"]}>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                <Route path="/employee/profile" element={<EmployeeProfilePage />} />
                <Route path="/employee/organization" element={<EmployeeOrgPage />} />
            </Route>

            {/* Error Pages */}
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}