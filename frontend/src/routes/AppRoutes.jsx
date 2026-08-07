import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";
import Dashboard from "../pages/dashboard/Dashboard";
import PlaceholderPage from "../pages/placeholder/PlaceholderPage";
import ForbiddenPage from "../pages/errors/ForbiddenPage";
import NotFoundPage from "../pages/errors/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Unauthenticated / Public Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Shell Routes (ProtectedRoute -> AppLayout -> Page) */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<PlaceholderPage title="Employees" />} />
                <Route path="/profile" element={<PlaceholderPage title="My Profile" />} />
                <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>

            {/* Error Pages */}
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}