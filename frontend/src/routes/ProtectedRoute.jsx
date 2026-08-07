import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SplashScreen from "../pages/Loading/Splashscreen";
import { AUTH_STATUS } from "../utils/authStatus";

export default function ProtectedRoute({ roles, children }) {
    const { status, user } = useAuth();
    const location = useLocation();

    if (status === AUTH_STATUS.INITIALIZING) {
        return <SplashScreen />;
    }

    if (status === AUTH_STATUS.UNAUTHENTICATED) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.mustChangePassword && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />;
    }

    if (roles && roles.length > 0) {
        const hasRole = roles.includes(user?.role);
        if (!hasRole) {
            return <Navigate to="/403" replace />;
        }
    }

    return children ? children : <Outlet />;
}
