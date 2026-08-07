import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import Icon from "../../components/common/Icon";
import useAuth from "../../hooks/useAuth";

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleHome = () => {
        if (user?.role === "Admin") {
            navigate("/admin/dashboard");
        } else if (user) {
            navigate("/employee/dashboard");
        } else {
            navigate("/login");
        }
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Page Not Found", active: true },
    ];

    return (
        <PageContainer title="404 - Page Not Found" breadcrumbs={breadcrumbs}>
            <div style={{ maxWidth: "520px", margin: "40px auto", textAlign: "center" }}>
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "40px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            backgroundColor: "#fffbeb",
                            color: "#b45309",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px auto",
                        }}
                    >
                        <Icon name="alert" size={28} />
                    </div>
                    <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                        404 - Page Not Found
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
                        The requested route or document does not exist in the system.
                    </p>
                    <button
                        type="button"
                        onClick={handleHome}
                        style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            padding: "10px 24px",
                            borderRadius: "8px",
                            border: "none",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Back to Safety
                    </button>
                </div>
            </div>
        </PageContainer>
    );
}