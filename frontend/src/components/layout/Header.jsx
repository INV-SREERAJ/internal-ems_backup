import UserMenu from "./UserMenu";

/**
 * Header Component
 * Top bar housing application branding, interactive sidebar toggle button (3 lines ☰), and user profile controls.
 */
export default function Header({ onToggleSidebar }) {
    return (
        <header className="ems-header">
            <div className="ems-header-brand">
                <button
                    type="button"
                    className="ems-menu-toggle"
                    onClick={onToggleSidebar}
                    aria-label="Toggle navigation menu"
                    title="Toggle Sidebar"
                >
                    ☰
                </button>
                <span className="ems-header-title">
                    WorkForce <span>OS</span> | Enterprise Management
                </span>
            </div>

            <div className="ems-header-spacer" />

            <div className="ems-header-actions">
                <UserMenu />
            </div>
        </header>
    );
}
