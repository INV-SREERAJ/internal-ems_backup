/**
 * Badge Component
 * Renders status and role badges with WorkForce OS color coding.
 */
export default function Badge({ type, value }) {
    let bg = "#1a2235";
    let color = "#ffffff";
    let border = "#31394d";

    const label = String(value || "").toUpperCase();

    if (type === "status") {
        if (value === 0 || value === "Active" || value === true) {
            bg = "rgba(16, 185, 129, 0.15)";
            color = "#10b981";
            border = "rgba(16, 185, 129, 0.3)";
        } else if (value === 1 || value === "Inactive" || value === false) {
            bg = "rgba(245, 158, 11, 0.15)";
            color = "#f59e0b";
            border = "rgba(245, 158, 11, 0.3)";
        } else if (value === 2 || value === "Deleted") {
            bg = "rgba(239, 68, 68, 0.15)";
            color = "#ef4444";
            border = "rgba(239, 68, 68, 0.3)";
        }
    } else if (type === "role") {
        if (value === "Admin" || value === 0) {
            bg = "rgba(249, 115, 22, 0.15)";
            color = "#f97316";
            border = "rgba(249, 115, 22, 0.3)";
        } else if (value === "Manager" || value === 1) {
            bg = "rgba(59, 130, 246, 0.15)";
            color = "#3b82f6";
            border = "rgba(59, 130, 246, 0.3)";
        } else {
            bg = "rgba(160, 165, 178, 0.15)";
            color = "#a0a5b2";
            border = "rgba(160, 165, 178, 0.3)";
        }
    }

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600",
                backgroundColor: bg,
                color: color,
                border: `1px solid ${border}`,
                letterSpacing: "0.3px",
            }}
        >
            {label}
        </span>
    );
}
