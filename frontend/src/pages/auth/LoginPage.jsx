import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { AUTH_STATUS } from "../../utils/authStatus";

export default function LoginPage() {
    const { login, status, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === AUTH_STATUS.AUTHENTICATED) {
            if (user?.mustChangePassword) {
                navigate("/change-password", { replace: true });
            } else {
                navigate("/dashboard", { replace: true });
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
            const { user: loggedInUser } = await login({ email, password });
            if (loggedInUser?.mustChangePassword) {
                navigate("/change-password", { replace: true });
            } else {
                navigate("/dashboard", { replace: true });
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

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: "#f4f6f8",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    padding: "32px",
                }}
            >
                <h2 style={{ marginBottom: "8px", textAlign: "center" }}>
                    Employee Login
                </h2>
                <p
                    style={{
                        marginBottom: "24px",
                        textAlign: "center",
                        color: "#666",
                        fontSize: "14px",
                    }}
                >
                    Sign in to your account
                </p>

                {apiError && (
                    <div
                        style={{
                            backgroundColor: "#fde8e8",
                            color: "#9b1c1c",
                            padding: "12px",
                            borderRadius: "6px",
                            marginBottom: "16px",
                            fontSize: "14px",
                        }}
                    >
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: "16px" }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                            }}
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            placeholder="name@company.com"
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                border: fieldErrors.email
                                    ? "1px solid #e53e3e"
                                    : "1px solid #ccc",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                        {fieldErrors.email && (
                            <span
                                style={{
                                    color: "#e53e3e",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                    display: "block",
                                }}
                            >
                                {fieldErrors.email}
                            </span>
                        )}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            placeholder="••••••••"
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                border: fieldErrors.password
                                    ? "1px solid #e53e3e"
                                    : "1px solid #ccc",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                        {fieldErrors.password && (
                            <span
                                style={{
                                    color: "#e53e3e",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                    display: "block",
                                }}
                            >
                                {fieldErrors.password}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: loading ? "#a0aec0" : "#3182ce",
                            color: "#ffffff",
                            fontWeight: "600",
                            fontSize: "16px",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Logging in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}