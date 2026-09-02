import { Link } from "react-router-dom";
import { STATUS_LABEL, STATUS_CLASS } from "../../utils/constants";

/**
 * Reusable card displaying a recent employees / direct reports table.
 *
 * @param {Object} props
 * @param {string} [props.title="Recent Employees"] - Header title
 * @param {string} [props.viewAllLink="/admin/employees"] - Route for "View all" link
 * @param {string} [props.viewAllText="View all"] - Text for "View all" link
 * @param {Array} props.employees - List of employee records
 * @param {string} [props.emptyMessage="No employees found."] - Message when employees list is empty
 * @param {"role"|"phone"} [props.extraColumn="role"] - Context column: "role" (admin) or "phone" (manager)
 */
export default function RecentEmployeesCard({
  title = "Recent Employees",
  viewAllLink = "/admin/employees",
  viewAllText = "View all",
  employees = [],
  emptyMessage = "No employees found.",
  extraColumn = "role",
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200 max-[767px]:px-[18px] max-[767px]:py-4">
        <h2 className="m-0 text-slate-900 text-base font-semibold">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-blue-600 text-[13px] font-semibold no-underline hover:text-blue-700"
          >
            {viewAllText}
          </Link>
        )}
      </div>

      {/* Content */}
      {employees.length === 0 ? (
        <div className="px-6 py-10 text-slate-500 text-sm text-center">
          {emptyMessage}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap max-[767px]:px-[18px]">
                  Employee Code
                </th>
                <th className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap max-[767px]:px-[18px]">
                  Name
                </th>
                <th className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap max-[767px]:px-[18px]">
                  Email
                </th>
                <th className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap max-[767px]:px-[18px]">
                  {extraColumn === "phone" ? "Phone" : "Role"}
                </th>
                <th className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap max-[767px]:px-[18px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {employees.map((emp) => (
                <tr
                  key={emp.employeeCode}
                  className="hover:bg-slate-50/80 transition-colors duration-150"
                >
                  <td className="px-6 py-3.5 border-b border-slate-100 font-medium text-slate-900 whitespace-nowrap max-[767px]:px-[18px]">
                    {emp.employeeCode}
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-100 text-slate-800 font-medium whitespace-nowrap max-[767px]:px-[18px]">
                    {emp.fullName ||
                      `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                      "—"}
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap max-[767px]:px-[18px]">
                    {emp.email}
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap max-[767px]:px-[18px]">
                    {extraColumn === "phone"
                      ? emp.phoneNumber || "—"
                      : emp.role || "—"}
                  </td>
                  <td className="px-6 py-3.5 border-b border-slate-100 whitespace-nowrap max-[767px]:px-[18px]">
                    <span
                      className={`inline-flex px-2 py-[3px] rounded-full text-xs font-semibold ${
                        STATUS_CLASS[Number(emp.status)] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABEL[emp.status] || emp.status || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
