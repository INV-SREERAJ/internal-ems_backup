import { useState } from "react";

export default function AdminNavbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);

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

        <div className="admin-brand">
          Workforce <span>OS</span>
        </div>
      </div>

      <div className="admin-profile">
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
            <button type="button">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}