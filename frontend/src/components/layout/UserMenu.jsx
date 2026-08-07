import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * UserMenu Component
 * Displays authenticated user info and actions matching backend scope:
 * Profile, Change Password, Logout.
 */
export default function UserMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const toggleMenu = () => setIsOpen((prev) => !prev);

    // Close menu when clicking outside
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

    return (
        <div className="ems-user-menu" ref={menuRef}>
            <button
                type="button"
                className="ems-user-menu-button"
                onClick={toggleMenu}
                aria-expanded={isOpen}
                aria-label="User menu"
            >
                <span>{displayName}</span>
                {user?.role && <span style={{ fontSize: "11px", opacity: 0.7 }}>({user.role})</span>}
                <span style={{ fontSize: "10px", marginLeft: "4px" }}>▼</span>
            </button>

            {isOpen && (
                <div className="ems-user-menu-dropdown">
                    <button
                        type="button"
                        className="ems-user-menu-item"
                        onClick={() => handleNavigation("/profile")}
                    >
                        My Profile
                    </button>
                    <button
                        type="button"
                        className="ems-user-menu-item"
                        onClick={() => handleNavigation("/change-password")}
                    >
                        Change Password
                    </button>
                    <button
                        type="button"
                        className="ems-user-menu-item logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
