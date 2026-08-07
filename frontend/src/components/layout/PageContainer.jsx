import Breadcrumbs from "./Breadcrumbs";

/**
 * PageContainer Component
 * Layout wrapper providing uniform content width, spacing, and optional breadcrumbs layout.
 * Pure container component with zero business logic.
 */
export default function PageContainer({ children, breadcrumbs, title }) {
    return (
        <main className="ems-page-container">
            {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
            {title && (
                <div style={{ marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a" }}>{title}</h1>
                </div>
            )}
            {children}
        </main>
    );
}
