import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { FaShieldAlt } from "react-icons/fa";
import { FaBuilding, FaUsers, FaKey } from "react-icons/fa6";
import PasswordInput from "../../components/common/PasswordInput";
import { AUTH_STATUS } from "../../utils/authStatus";
import "../auth/LoginPage.css";

export default function LoginPage() {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();

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
      } else if (user?.role === "Admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/employee/dashboard", { replace: true });
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
      } else if (loggedInUser?.role === "Admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/employee/dashboard", { replace: true });
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
    { label: "Organization Structure", icon: FaBuilding },
    { label: "Role-Based Control", icon: FaKey },
  ];

  return (
    <div className="ems-login-body">
      <nav className="ems-login-nav">
        <div className="ems-login-brand">
          WorkForce <span>OS</span>
        </div>
      </nav>

      <main className="ems-login-main">
        <div className="ems-login-container">
          <div className="ems-login-hero">
            <h1 className="ems-login-hero-title animate-fade-in-up delay-0">
              Enterprise Employee Management Platform
            </h1>

            <p className="ems-login-hero-subtitle animate-fade-in-up delay-100">
              Centralized workforce administration, role-based security,
              organizational structure, and audit capabilities.
            </p>

            <div className="ems-login-features animate-fade-in-up delay-100">
              {features.map((item) => (
                <span key={item.label} className="ems-login-feature">
                  <item.icon size={15} color="#3b82f6" />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div
            id="login-card"
            className="ems-login-card animate-fade-in-up delay-200"
          >
            <div className="ems-login-card-header">
              <div className="ems-login-icon">
                <FaBuilding size={24} />
              </div>

              <h2 className="ems-login-card-title">Sign In</h2>

              <p className="ems-login-card-subtitle">
                Access your enterprise workforce account
              </p>
            </div>

            {apiError && <div className="ems-login-api-error">{apiError}</div>}

            <form onSubmit={handleSubmit} noValidate className="ems-login-form">
              <div className="ems-login-field">
                <label className="ems-login-label" htmlFor="email">
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
                  className={`ems-login-input ${
                    fieldErrors.email ? "error" : ""
                  }`}
                />

                {fieldErrors.email && (
                  <span className="ems-login-error-text">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="ems-login-field">
                <label className="ems-login-label" htmlFor="password">
                  Password
                </label>

                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={`ems-login-input ${
                    fieldErrors.password ? "error" : ""
                  }`}
                />

                {fieldErrors.password && (
                  <span className="ems-login-error-text">
                    {fieldErrors.password}
                  </span>
                )}

                <div className="ems-login-field ems-login-remember">
                  <label className="ems-login-checkbox-label">
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
                className="ems-login-submit-btn"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="ems-login-footer-link">
                <span className="ems-login-link">
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
