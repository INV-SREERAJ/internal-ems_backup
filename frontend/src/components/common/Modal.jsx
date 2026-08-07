import { useEffect } from "react";

/**
 * Modal Component
 * Accessible, reusable modal overlay dialog for dark WorkForce OS theme.
 */
export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(6, 14, 32, 0.8)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#131b2e",
                    border: "1px solid #31394d",
                    borderRadius: "12px",
                    width: "100%",
                    maxWidth: "560px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #1a2235",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#a0a5b2",
                            fontSize: "20px",
                            cursor: "pointer",
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: "24px" }}>{children}</div>
            </div>
        </div>
    );
}
