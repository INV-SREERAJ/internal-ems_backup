/**
 * Breadcrumbs Component
 * Reusable breadcrumb architecture for navigation context.
 * Accepts an array of items or renders placeholder structure.
 */
export default function Breadcrumbs({ items }) {
    const defaultItems = [
        { label: "Home", path: "/" },
        { label: "Dashboard", active: true },
    ];

    const breadcrumbs = items && items.length > 0 ? items : defaultItems;

    return (
        <nav aria-label="Breadcrumb" className="ems-breadcrumbs">
            {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1 || item.active;

                return (
                    <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {index > 0 && <span className="ems-breadcrumb-separator">/</span>}
                        {isLast ? (
                            <span className="ems-breadcrumb-item active">{item.label}</span>
                        ) : (
                            <a href={item.path || "#"} className="ems-breadcrumb-item">
                                {item.label}
                            </a>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
