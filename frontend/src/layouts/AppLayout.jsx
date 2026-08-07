import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import "../styles/layout.css";

/**
 * AppLayout Component
 * Master dark application shell for WorkForce OS with interactive toggling sidebar.
 */
export default function AppLayout({ children }) {
    // Default open on desktop, togglable via header button
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="ems-app-shell">
            <Header onToggleSidebar={toggleSidebar} />
            <div className="ems-main-wrapper">
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                {children ? children : <Outlet />}
            </div>
        </div>
    );
}