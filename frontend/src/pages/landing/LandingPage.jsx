import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { AUTH_STATUS } from "../../utils/authStatus";
import "../auth/LoginPage.css";

export default function LandingPage() {
    const { login, status, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const canvasRef = useRef(null);

    // Redirect authenticated users to their role-specific dashboard
    useEffect(() => {
        if (status === AUTH_STATUS.AUTHENTICATED) {
            if (user?.mustChangePassword) {
                navigate("/change-password", { replace: true });
            } else if (user?.role === "Admin") {
                navigate("/admin/dashboard", { replace: true });
            } else {
                navigate("/employee/dashboard", { replace: true });
            }
        }
    }, [status, user, navigate]);

    // WebGL Canvas Mesh Gradient Animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl");
        if (!gl) return;

        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const vertexShaderSource = `
            attribute vec2 position;
            varying vec2 v_texCoord;
            void main() {
                v_texCoord = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            uniform float u_time;
            uniform vec2 u_resolution;
            varying vec2 v_texCoord;

            void main() {
                vec2 uv = v_texCoord;
                float t = u_time * 0.2;
                
                vec3 color = vec3(0.02, 0.05, 0.12); 
                
                vec2 p1 = vec2(0.5 + 0.3 * cos(t), 0.5 + 0.3 * sin(t * 0.8));
                vec2 p2 = vec2(0.2 + 0.2 * sin(t * 1.2), 0.8 + 0.1 * cos(t));
                vec2 p3 = vec2(0.8 + 0.1 * cos(t * 0.5), 0.2 + 0.2 * sin(t * 1.5));
                
                float d1 = length(uv - p1);
                float d2 = length(uv - p2);
                float d3 = length(uv - p3);
                
                color += vec3(0.05, 0.1, 0.25) * (1.0 - smoothstep(0.0, 0.8, d1));
                color += vec3(0.1, 0.05, 0.2) * (1.0 - smoothstep(0.0, 0.7, d2));
                color += vec3(0.0, 0.05, 0.15) * (1.0 - smoothstep(0.0, 0.9, d3));
                
                float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                color += noise * 0.01;
                
                float vignette = 1.5 - length(uv - 0.5) * 1.2;
                color *= clamp(vignette, 0.0, 1.0);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const createShader = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const timeLocation = gl.getUniformLocation(program, "u_time");
        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

        let startTime = performance.now();
        const render = (time) => {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, (time - startTime) * 0.001);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };
        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

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
            } else if (loggedInUser?.role === "Admin") {
                navigate("/admin/dashboard", { replace: true });
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

    return (
        <div className="ems-login-body">
            {/* Animated WebGL Background Shader */}
            <canvas ref={canvasRef} className="ems-login-canvas" />

            {/* Top Navigation */}
            <nav className="ems-login-nav">
                <div className="ems-login-brand">
                    WorkForce OS
                </div>
                <button
                    type="button"
                    className="ems-login-contact-btn"
                    onClick={() => {
                        const card = document.getElementById("login-card");
                        if (card) card.scrollIntoView({ behavior: "smooth" });
                    }}
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Main Content */}
            <main className="ems-login-main">
                <div className="ems-login-container">
                    {/* Left Column: Hero & Feature Chips */}
                    <div className="ems-login-hero">
                        <h1 className="ems-login-hero-title animate-fade-in-up delay-0">
                            Enterprise Employee Management Platform
                        </h1>
                        <p className="ems-login-hero-subtitle animate-fade-in-up delay-100">
                            Secure employee management, role-based access, organization hierarchy, and centralized administration.
                        </p>

                        {/* Feature Chips */}
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                marginTop: "8px",
                            }}
                            className="animate-fade-in-up delay-100"
                        >
                            {[
                                "🛡️ Secure Authentication",
                                "👥 Employee Management",
                                "🏢 Organization Hierarchy",
                                "🔐 Role-Based Access",
                            ].map((chip, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        backgroundColor: "#131b2e",
                                        border: "1px solid #31394d",
                                        color: "#ffffff",
                                        padding: "8px 16px",
                                        borderRadius: "20px",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                    }}
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Embedded Login Card */}
                    <div id="login-card" className="ems-login-card animate-fade-in-up delay-200">
                        <div style={{ textAlign: "center", marginBottom: "8px" }}>
                            <div style={{ fontSize: "32px", marginBottom: "4px" }}>🏢</div>
                            <h2 className="ems-login-card-title">Welcome Back</h2>
                            <p style={{ color: "#a0a5b2", fontSize: "14px", marginTop: "4px" }}>
                                Sign in to your enterprise account
                            </p>
                        </div>

                        {apiError && (
                            <div className="ems-login-api-error">
                                {apiError}
                            </div>
                        )}

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
                                    placeholder="name@company.com"
                                    required
                                    className={`ems-login-input ${fieldErrors.email ? "error" : ""}`}
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
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="••••••••"
                                    required
                                    className={`ems-login-input ${fieldErrors.password ? "error" : ""}`}
                                />
                                {fieldErrors.password && (
                                    <span className="ems-login-error-text">
                                        {fieldErrors.password}
                                    </span>
                                )}
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
