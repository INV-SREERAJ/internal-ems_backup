import { HiOutlineEye } from "react-icons/hi2";
import { STATUS_LABEL, EMPLOYEE_STATUS } from "../../utils/constants";

export default function EmployeeTable({
  employees,
  onSort,
  sortBy,
  descending,
  onView,
  showManager = true,
  showRole = true,
}) {
  const STATUS_BADGE = {
    [EMPLOYEE_STATUS.Active]: "bg-emerald-100 text-emerald-700",
    [EMPLOYEE_STATUS.Inactive]: "bg-amber-100 text-amber-700",
    [EMPLOYEE_STATUS.Deleted]: "bg-red-100 text-red-700",
  };

  const sortBtnBase =
    "inline-flex items-center justify-center w-[18px] h-[18px] p-0 bg-transparent border-none rounded text-slate-400 text-xs leading-none cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600 max-[767px]:pl-1 max-[767px]:text-sm";
  const thBase =
    "px-4 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-center whitespace-nowrap";
  const tdBase =
    "h-[52px] px-4 py-2.5 box-border border-b border-slate-100 text-slate-700 text-center overflow-hidden max-[767px]:p-3";

  return (
    <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.05)] max-[767px]:rounded-[10px]">
      <table className="w-full min-w-[1000px] table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[140px]" />
          <col className="w-[160px]" />
          <col className="w-[220px]" />
          <col className="w-[130px]" />
          {showRole && <col className="w-[100px]" />}
          {showManager && <col className="w-[160px]" />}
          <col className="w-[100px]" />
          <col className="w-[100px]" />
        </colgroup>

        <thead>
          <tr>
            <th className={thBase}>
              <div className="flex items-center justify-center gap-1.5">
                <span>Employee Code</span>
                <button
                  type="button"
                  onClick={() => onSort("employeeCode")}
                  className={`${sortBtnBase} ${sortBy === "employeeCode" ? "text-blue-600" : ""}`}
                  aria-label="Sort by employee code"
                >
                  {sortBy === "employeeCode" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>
            <th className={thBase}>
              <div className="flex items-center justify-center gap-1.5">
                <span>Full Name</span>
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className={`${sortBtnBase} ${sortBy === "name" ? "text-blue-600" : ""}`}
                  aria-label="Sort by full name"
                >
                  {sortBy === "name" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>

            <th className={thBase}>
              <div className="flex items-center justify-center gap-1.5">
                <span>Email</span>
                <button
                  type="button"
                  onClick={() => onSort("email")}
                  className={`${sortBtnBase} ${sortBy === "email" ? "text-blue-600" : ""}`}
                  aria-label="Sort by email"
                >
                  {sortBy === "email" ? (descending ? "↓" : "↑") : "↕"}
                </button>
              </div>
            </th>

            <th className={thBase}>Phone Number</th>

            {showRole && (
              <th className={thBase}>
                <div className="flex items-center justify-center gap-1.5">
                  <span>Role</span>
                  <button
                    type="button"
                    onClick={() => onSort("role")}
                    className={`${sortBtnBase} ${sortBy === "role" ? "text-blue-600" : ""}`}
                    aria-label="Sort by role"
                  >
                    {sortBy === "role" ? (descending ? "↓" : "↑") : "↕"}
                  </button>
                </div>
              </th>
            )}

            {showManager && <th className={thBase}>Manager</th>}
            <th className={thBase}>Status</th>
            <th className={thBase}>Actions</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {employees.map((employee) => (
            <tr
              key={employee.employeeCode}
              className="transition-colors duration-150 hover:[&>td]:bg-slate-50"
            >
              <td className={tdBase}>
                <span
                  className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  title={employee.employeeCode}
                >
                  {employee.employeeCode}
                </span>
              </td>
              <td className={tdBase}>
                <span
                  className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  title={
                    employee.fullName ||
                    `${employee.firstName || ""} ${employee.lastName || ""}`.trim()
                  }
                >
                  {employee.fullName ||
                    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
                    "—"}
                </span>
              </td>
              <td className={tdBase}>
                <span
                  className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  title={employee.email}
                >
                  {employee.email}
                </span>
              </td>
              <td className={tdBase}>
                <span
                  className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  title={employee.phoneNumber || "—"}
                >
                  {employee.phoneNumber || "—"}
                </span>
              </td>
              {showRole && (
                <td className={tdBase}>
                  <span
                    className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                    title={employee.role}
                  >
                    {employee.role}
                  </span>
                </td>
              )}
              {showManager && (
                <td className={tdBase}>
                  <span
                    className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                    title={employee.managerName ?? "-"}
                  >
                    {employee.managerName ?? "-"}
                  </span>
                </td>
              )}
              <td className={tdBase}>
                <span
                  className={`inline-flex px-[9px] py-1 rounded-full text-xs font-semibold ${
                    STATUS_BADGE[employee.status] || "bg-red-100 text-red-700"
                  }`}
                >
                  {STATUS_LABEL[employee.status] || "Deleted"}
                </span>
              </td>
              <td className={tdBase}>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-3.5 py-[7px] bg-slate-100 text-slate-600 border border-slate-200 rounded-[7px] font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    onClick={() => onView(employee.employeeCode)}
                    title="View Details"
                  >
                    <HiOutlineEye size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
