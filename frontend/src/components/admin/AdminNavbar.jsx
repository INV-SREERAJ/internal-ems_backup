import { useEffect, useRef, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";

export default function AdminNavbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout } = useAuth();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <button
          type="button"
          className="admin-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <Link to="/admin" className="admin-brand">
          Workforce <span>OS</span>
        </Link>
      </div>

      <div className="admin-profile" ref={profileRef}>
        <button
          type="button"
          className="admin-profile-btn"
          onClick={() => setProfileOpen((current) => !current)}
        >
          Profile
        </button>

        {profileOpen && (
          <div className="admin-profile-menu">
            <button type="button">Edit Profile</button>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
