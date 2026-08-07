import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Icon from "../common/Icon";

/**
 * Sidebar Component
 * Renders role-specific navigation for Admin vs Employee users using clean SVG icons.
 */
export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.role === "Admin";

    const adminNavItems = [
        { label: "Dashboard", path: "/admin/dashboard", icon: "layout" },
        { label: "Employees", path: "/admin/employees", icon: "users" },
        { label: "Organization", path: "/admin/organization", icon: "building" },
        { label: "My Profile", path: "/admin/profile", icon: "user" },
        { label: "Settings", path: "/admin/settings", icon: "settings" },
    ];

    const employeeNavItems = [
        { label: "Dashboard", path: "/employee/dashboard", icon: "layout" },
        { label: "My Profile", path: "/employee/profile", icon: "user" },
        { label: "Organization", path: "/employee/organization", icon: "building" },
    ];

    const navItems = isAdmin ? adminNavItems : employeeNavItems;

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
                                <Icon name={item.icon} size={18} />
                                <span>{item.label}</span>
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
                        <Icon name="logout" size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
