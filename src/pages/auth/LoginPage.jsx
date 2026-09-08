import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { FaShieldAlt } from "react-icons/fa";
import { FaBuilding, FaUsers, FaKey } from "react-icons/fa6";
import PasswordInput from "../../components/common/PasswordInput";
import { AUTH_STATUS } from "../../utils/authStatus";
import { getDefaultRoute } from "../../App";

export default function LoginPage() {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (status === AUTH_STATUS.AUTHENTICATED) {
      if (user?.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate(getDefaultRoute(user), { replace: true });
      }
    }
  }, [status, user, navigate]);

  const validate = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { user: loggedInUser } = await login({
        email,
        password,
        rememberMe,
      });

      if (loggedInUser?.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate(getDefaultRoute(loggedInUser), { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Login failed. Please check your credentials and try again.";

      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { label: "Secure Authentication", icon: FaShieldAlt },
    { label: "Employee Management", icon: FaUsers },
    { label: "Secure API", icon: FaBuilding },
    { label: "Role-Based Control", icon: FaKey },
  ];

  const inputBase =
    "w-full box-border px-3.5 py-[11px] bg-white border rounded-lg text-slate-900 text-sm outline-none transition-colors duration-150 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/15";

  return (
    <div className="login-gradient-bg min-h-screen font-sans">
      <nav className="absolute top-0 inset-x-0 w-full max-w-[1280px] mx-auto px-8 py-6 flex justify-between items-center z-20">
        <div className="text-white text-[22px] font-bold tracking-[-0.5px]">
          WorkForce <span className="text-blue-500">OS</span>
        </div>
      </nav>

      <main className="w-full min-h-screen pt-[100px] px-6 pb-10 flex items-center justify-center relative z-10">
        <div className="w-full max-w-[1200px] flex flex-col justify-center items-center gap-10 lg:flex-row lg:justify-between lg:items-center">
          <div className="max-w-[580px] flex flex-col gap-5 text-left">
            <h1 className="opacity-0 [animation:fadeInUp_0.5s_ease-out_forwards] m-0 text-white text-4xl md:text-[44px] leading-[1.25] font-bold tracking-[-0.5px]">
              Enterprise Employee Management Platform
            </h1>

            <p className="opacity-0 [animation:fadeInUp_0.5s_ease-out_forwards] [animation-delay:100ms] m-0 text-slate-400 text-[17px] leading-[1.6]">
              Centralized workforce administration, role-based security.
            </p>

            <div className="opacity-0 [animation:fadeInUp_0.5s_ease-out_forwards] [animation-delay:100ms] flex flex-wrap gap-2.5 mt-3">
              {features.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/15 rounded-full text-white text-[13px] font-medium"
                >
                  <item.icon size={15} color="#3b82f6" />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div
            id="login-card"
            className="opacity-0 [animation:fadeInUp_0.5s_ease-out_forwards] [animation-delay:200ms] w-full max-w-[440px] box-border p-10 flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.2),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.25)]"
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FaBuilding size={24} />
              </div>

              <h2 className="m-0 text-slate-900 text-[22px] font-bold text-center">
                Sign In
              </h2>

              <p className="mt-1 mb-0 text-slate-500 text-sm">
                Access your enterprise workforce account
              </p>
            </div>

            {location.state?.message && !apiError && (
              <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-green-700 text-sm text-center">
                {location.state.message}
              </div>
            )}

            {apiError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm text-center">
                {apiError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-slate-600 text-[13px] font-semibold"
                  htmlFor="email"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className={`${inputBase} ${
                    fieldErrors.email ? "border-red-600" : "border-slate-300"
                  }`}
                />

                {fieldErrors.email && (
                  <span className="mt-0.5 text-red-600 text-xs">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-slate-600 text-[13px] font-semibold"
                  htmlFor="password"
                >
                  Password
                </label>

                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={`${inputBase} ${
                    fieldErrors.password ? "border-red-600" : "border-slate-300"
                  }`}
                />

                {fieldErrors.password && (
                  <span className="mt-0.5 text-red-600 text-xs">
                    {fieldErrors.password}
                  </span>
                )}

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 px-6 py-3 flex items-center justify-center gap-2 bg-blue-600 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="mt-2 text-center">
                <span className="text-slate-500 text-[13px] transition-colors duration-150 hover:text-slate-900">
                  Need help signing in? Contact IT Administrator.
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
