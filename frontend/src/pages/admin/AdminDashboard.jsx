import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../hooks/useAuth";
import { CiPause1 } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi2";
import { LiaUserSolid } from "react-icons/lia";
import { FaPlus } from "react-icons/fa6";
import { CiEdit } from "react-icons/ci";
import { EMPLOYEE_STATUS, STATUS_LABEL } from "../../utils/constants";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch first page of employees to derive dashboard stats
        const response = await api.get("/admin/employees", {
          params: {
            pageNumber: 1,
            pageSize: 100,
          },
        });

        const allEmployees = response.data.data || [];

        // Compute stats from the data
        const totalEmployees = allEmployees.filter(
          (e) => e.status !== EMPLOYEE_STATUS.Deleted,
        ).length;

        const activeCount = allEmployees.filter(
          (e) => e.status === EMPLOYEE_STATUS.Active,
        ).length;

        const inactiveCount = allEmployees.filter(
          (e) => e.status === EMPLOYEE_STATUS.Inactive,
        ).length;

        // Count roles by string value (API returns role as a display string)
        const roleCounts = {};
        for (const e of allEmployees) {
          if (e.status !== EMPLOYEE_STATUS.Deleted && e.role) {
            roleCounts[e.role] = (roleCounts[e.role] || 0) + 1;
          }
        }

        setStats({
          total: totalEmployees,
          active: activeCount,
          inactive: inactiveCount,
          roles: roleCounts,
        });

        // Get the 5 most recent (non-deleted) for the table
        const recent = allEmployees
          .filter((e) => e.status !== EMPLOYEE_STATUS.Deleted)
          .slice(-8);

        setRecentEmployees(recent);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case EMPLOYEE_STATUS.Active:
        return "bg-green-100 text-green-800";
      case EMPLOYEE_STATUS.Inactive:
        return "bg-amber-100 text-amber-800";
      case EMPLOYEE_STATUS.Deleted:
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <section className="w-full max-w-[1400px] mx-auto">
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          Loading dashboard…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-[1400px] mx-auto">
        <div className="px-6 py-12 text-center text-sm text-red-700 bg-red-50 border border-red-300 rounded-xl">
          {error}
        </div>
      </section>
    );
  }

  const roleEntries = stats ? Object.entries(stats.roles) : [];
  const roleTotal = roleEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <section className="w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 max-[480px]:mb-6">
        <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl max-[480px]:text-[22px]">
          Dashboard
        </h1>
        <p className="mt-1.5 mb-0 text-slate-500 text-sm">
          Welcome back{user?.email ? `, ${user.email}` : ""}. Here's an overview
          of your organization.
        </p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-5 mb-8 max-[1023px]:grid-cols-2 max-[767px]:grid-cols-1 max-[767px]:gap-3">
          <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-start gap-4 max-[767px]:p-5">
            <div className="w-11 h-11 flex items-center justify-center rounded-[10px] shrink-0 bg-blue-50 text-blue-600">
              <HiOutlineUsers size={22} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-slate-500 text-[13px] font-medium">
                Total Employees
              </span>
              <span className="text-slate-900 text-[28px] font-bold tracking-[-0.5px] leading-[1.1] max-[767px]:text-2xl">
                {stats.total}
              </span>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-start gap-4 max-[767px]:p-5">
            <div className="w-11 h-11 flex items-center justify-center rounded-[10px] shrink-0 bg-green-50 text-green-600">
              <LiaUserSolid size={22} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-slate-500 text-[13px] font-medium">
                Active
              </span>
              <span className="text-slate-900 text-[28px] font-bold tracking-[-0.5px] leading-[1.1] max-[767px]:text-2xl">
                {stats.active}
              </span>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-start gap-4 max-[767px]:p-5">
            <div className="w-11 h-11 flex items-center justify-center rounded-[10px] shrink-0 bg-amber-50 text-amber-600">
              <CiPause1 size={22} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-slate-500 text-[13px] font-medium">
                Inactive
              </span>
              <span className="text-slate-900 text-[28px] font-bold tracking-[-0.5px] leading-[1.1] max-[767px]:text-2xl">
                {stats.inactive}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Body: table + sidebar */}
      <div className="grid grid-cols-[1fr_340px] gap-6 max-[1023px]:grid-cols-1">
        {/* Recent employees */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200 max-[767px]:px-[18px] max-[767px]:py-4">
            <h2 className="m-0 text-slate-900 text-base font-semibold">
              Recent Employees
            </h2>
            <Link
              to="/admin/employees"
              className="text-blue-600 text-[13px] font-semibold no-underline hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          {recentEmployees.length === 0 ? (
            <div className="px-6 py-10 text-slate-500 text-sm text-center">
              No employees found.
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
                      Role
                    </th>
                    <th className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap max-[767px]:px-[18px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {recentEmployees.map((emp) => (
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
                        {emp.role || "—"}
                      </td>
                      <td className="px-6 py-3.5 border-b border-slate-100 whitespace-nowrap max-[767px]:px-[18px]">
                        <span
                          className={`inline-flex px-2 py-[3px] rounded-full text-xs font-semibold ${getStatusClass(emp.status)}`}
                        >
                          {STATUS_LABEL[emp.status] || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar: Quick actions + Role breakdown */}
        <div className="flex flex-col gap-6">
          {/* Quick actions */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 max-[767px]:px-[18px] max-[767px]:py-4">
              <h2 className="m-0 text-slate-900 text-base font-semibold">
                Quick Actions
              </h2>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <Link
                to="/admin/employees/create-employee"
                className="p-3 flex items-center gap-3 rounded-lg text-slate-700 text-sm font-medium no-underline transition-colors duration-150 hover:bg-slate-50"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <FaPlus size={18} />
                </div>
                Create Employee
              </Link>

              <Link
                to="/admin/employees"
                className="p-3 flex items-center gap-3 rounded-lg text-slate-700 text-sm font-medium no-underline transition-colors duration-150 hover:bg-slate-50"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <HiOutlineUsers size={18} />
                </div>
                View All Employees
              </Link>

              <Link
                to="/admin/employees/edit"
                className="p-3 flex items-center gap-3 rounded-lg text-slate-700 text-sm font-medium no-underline transition-colors duration-150 hover:bg-slate-50"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <CiEdit size={18} />
                </div>
                Edit Employees
              </Link>
            </div>
          </div>

          {/* Role breakdown */}
          {roleTotal > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 max-[767px]:px-[18px] max-[767px]:py-4">
                <h2 className="m-0 text-slate-900 text-base font-semibold">
                  Role Breakdown
                </h2>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4 max-[767px]:px-[18px] max-[767px]:py-4">
                {roleEntries.map(([role, count], index) => {
                  const barColors = [
                    "bg-blue-600",
                    "bg-violet-600",
                    "bg-sky-500",
                  ];
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm font-medium">
                          {role}s
                        </span>
                        <span className="text-slate-900 text-sm font-bold">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-[3px] overflow-hidden">
                        <div
                          className={`h-full rounded-[3px] ${barColors[index % barColors.length]}`}
                          style={{
                            width: `${(count / roleTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
