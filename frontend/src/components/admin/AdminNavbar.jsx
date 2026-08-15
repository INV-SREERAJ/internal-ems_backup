import { useState } from "react";

export default function AdminNavbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav>
      <button onClick={onMenuClick}>☰</button>
      <h2>
        Workforce <span>OS</span>
      </h2>
      <div>
        <button onClick={() => setProfileOpen(!profileOpen)}>Profile</button>

        {profileOpen && (
          <div>
            <button>Edit Profile</button>
            <button>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}
