import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./pages/Loading/Splashscreen";
import useAuth from "./hooks/useAuth";
import { AUTH_STATUS } from "./utils/authStatus";

export default function App() {

    const { status } = useAuth();

    if (status === AUTH_STATUS.INITIALIZING) {
        return <SplashScreen />;
    }

    return <AppRoutes />;
}