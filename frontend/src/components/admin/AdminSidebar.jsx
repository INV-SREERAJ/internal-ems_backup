import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <aside>
      <nav>
        <Link to = "/admin/employees">
          View Employees
        </Link>
        <Link to = "/admin/employees/edit">
          Edit Employees
        </Link>
        <button>Logout</button>
      </nav>
    </aside>
  );
}
