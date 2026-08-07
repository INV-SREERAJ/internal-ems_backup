import useAuth from "../../hooks/useAuth";

export default function Dashboard() {
    const { status, user, logout } = useAuth();

    return (
        <div style={{ padding: "24px" }}>
            <h1>Dashboard</h1>
            <p><strong>Status:</strong> {status}</p>
            {user && (
                <div>
                    <p><strong>Employee Code:</strong> {user.employeeCode}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                </div>
            )}
            <button
                onClick={logout}
                style={{
                    marginTop: "16px",
                    padding: "8px 16px",
                    backgroundColor: "#e53e3e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                Logout
            </button>
        </div>
    );
}