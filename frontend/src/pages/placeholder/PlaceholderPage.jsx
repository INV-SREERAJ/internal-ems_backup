import PageContainer from "../../components/layout/PageContainer";

/**
 * PlaceholderPage Component
 * Generic placeholder page matching WorkForce OS dark aesthetic.
 */
export default function PlaceholderPage({ title }) {
    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: title, active: true },
    ];

    return (
        <PageContainer title={title} breadcrumbs={breadcrumbs}>
            <div
                style={{
                    backgroundColor: "#131b2e",
                    border: "1px solid #31394d",
                    borderRadius: "12px",
                    padding: "32px",
                }}
            >
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
                    {title} Module
                </h2>
                <p style={{ color: "#a0a5b2", fontSize: "15px", lineHeight: "1.6" }}>
                    This module route is fully connected to the WorkForce OS application shell and ready for feature implementation.
                </p>
            </div>
        </PageContainer>
    );
}
