/**
 * Badge Component
 * Renders status and role badges with crisp professional enterprise colors.
 */
export default function Badge({ type, value }) {
    let bg = "#f1f5f9";
    let color = "#475569";
    let border = "#e2e8f0";

    const displayVal = String(value || "").trim();

    if (type === "status") {
        if (value === 1 || value === "Active" || value === true) {
            bg = "#dcfce7";
            color = "#15803d";
            border = "#bbf7d0";
        } else if (value === 2 || value === "Inactive" || value === false) {
            bg = "#fef3c7";
            color = "#b45309";
            border = "#fde68a";
        } else if (value === 9 || value === "Deleted") {
            bg = "#fee2e2";
            color = "#b91c1c";
            border = "#fca5a5";
        }
    } else if (type === "role") {
        if (displayVal === "Admin") {
            bg = "#e0e7ff";
            color = "#4338ca";
            border = "#c7d2fe";
        } else if (displayVal === "Manager") {
            bg = "#e0f2fe";
            color = "#0369a1";
            border = "#bae6fd";
        } else {
            bg = "#f1f5f9";
            color = "#475569";
            border = "#e2e8f0";
        }
    }

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: "600",
                backgroundColor: bg,
                color: color,
                border: `1px solid ${border}`,
                lineHeight: "1.3",
            }}
        >
            {type === "status" && (
                <span
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: color,
                    }}
                />
            )}
            {displayVal}
        </span>
    );
}
