import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Icon from "../common/Icon";

/**
 * UserMenu Component
 * Displays authenticated user info and actions matching user role.
 */
export default function UserMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const toggleMenu = () => setIsOpen((prev) => !prev);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
        navigate("/login");
    };

    const handleNavigation = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const displayName = user?.email ? user.email.split("@")[0] : user?.employeeCode || "User";
    const initial = displayName.charAt(0).toUpperCase();
    const profilePath = user?.role === "Admin" ? "/admin/profile" : "/employee/profile";

    return (
        <div className="ems-user-menu" ref={menuRef}>
            <button
                type="button"
                className="ems-user-menu-button"
                onClick={toggleMenu}
                aria-expanded={isOpen}
                aria-label="User menu"
            >
                <div
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        fontSize: "12px",
                    }}
                >
                    {initial}
                </div>
                <span style={{ fontWeight: "500", color: "#0f172a" }}>{displayName}</span>
                {user?.role && (
                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>
                        {user.role}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="ems-user-menu-dropdown">
                    <button
                        type="button"
                        className="ems-user-menu-item"
                        onClick={() => handleNavigation(profilePath)}
                    >
                        <Icon name="user" size={16} />
                        <span>My Profile</span>
                    </button>
                    <button
                        type="button"
                        className="ems-user-menu-item"
                        onClick={() => handleNavigation("/change-password")}
                    >
                        <Icon name="key" size={16} />
                        <span>Change Password</span>
                    </button>
                    <button
                        type="button"
                        className="ems-user-menu-item logout"
                        onClick={handleLogout}
                    >
                        <Icon name="logout" size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
}
