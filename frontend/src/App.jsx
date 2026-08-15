import LoginPage from "./pages/auth/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SplashScreen from "./pages/Loading/SplashScreen";
import useAuth from "./hooks/useAuth";
import { AUTH_STATUS } from "./utils/authStatus";

export default function App() {
  const { status } = useAuth();

  if (status === AUTH_STATUS.INITIALIZING) {
    return <SplashScreen />;
  }

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return <AdminDashboard />;
  }

  return <LoginPage />;
}
