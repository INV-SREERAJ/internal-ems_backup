import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import Icon from "../../components/common/Icon";
import useAuth from "../../hooks/useAuth";

export default function ForbiddenPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleHome = () => {
        if (user?.role === "Admin") {
            navigate("/admin/dashboard");
        } else {
            navigate("/employee/dashboard");
        }
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Access Denied", active: true },
    ];

    return (
        <PageContainer title="403 - Access Denied" breadcrumbs={breadcrumbs}>
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
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px auto",
                        }}
                    >
                        <Icon name="shield" size={28} />
                    </div>
                    <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                        403 - Access Denied
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
                        You do not have permission to view or manage this corporate resource.
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
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </PageContainer>
    );
}