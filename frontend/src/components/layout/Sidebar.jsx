import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * Sidebar Component
 * Interactive left sidebar navigation matching WorkForce OS theme.
 * Houses main routes (Dashboard, Employees, My Profile, Settings) and a bottom Logout button.
 */
export default function Sidebar({ isOpen, onClose }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { label: "Dashboard", path: "/dashboard", icon: "📊" },
        { label: "Employees", path: "/employees", icon: "👥" },
        { label: "My Profile", path: "/profile", icon: "👤" },
        { label: "Settings", path: "/settings", icon: "⚙️" },
    ];

    const handleLinkClick = () => {
        if (onClose && window.innerWidth <= 1024) {
            onClose();
        }
    };

    const handleLogout = async () => {
        if (onClose) onClose();
        await logout();
        navigate("/login");
    };

    return (
        <>
            {/* Backdrop overlay for mobile drawer */}
            {isOpen && <div className="ems-sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
            
            <aside className={`ems-sidebar ${isOpen ? "open" : "closed"}`}>
                <div className="ems-sidebar-top">
                    <nav className="ems-sidebar-nav">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `ems-sidebar-link ${isActive ? "active" : ""}`
                                }
                            >
                                <span style={{ marginRight: "12px", fontSize: "16px" }}>{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Bottom Logout Button */}
                <div className="ems-sidebar-bottom">
                    <button
                        type="button"
                        className="ems-sidebar-logout-btn"
                        onClick={handleLogout}
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
