import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../hooks/useAuth";
import { HiOutlineUsers, HiOutlineUser } from "react-icons/hi2";
import { LiaUserSolid } from "react-icons/lia";
import { CiPause1 } from "react-icons/ci";
import { EMPLOYEE_STATUS } from "../../utils/constants";
import RecentEmployeesCard from "../../components/common/RecentEmployeesCard";

export default function ManagerDashboard() {
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
        const [statsRes, recentRes] = await Promise.all([
          api.get("/manager/stats"),
          api.get("/manager/employees", {
            params: {
              pageNumber: 1,
              pageSize: 8,
              sortBy: "CreatedAt",
              descending: true,
            },
          }),
        ]);

        setStats({
          total: statsRes.data.totalEmployees,
          active: statsRes.data.activeEmployees,
          inactive: statsRes.data.inactiveEmployees,
        });

        setRecentEmployees(recentRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <section className="w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 max-[480px]:mb-6">
        <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl max-[480px]:text-[22px]">
          Manager Dashboard
        </h1>
        <p className="mt-1.5 mb-0 text-slate-500 text-sm">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Here is an
          overview of your reporting team.
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
                Total Direct Reports
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
                Active Members
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
                Inactive Members
              </span>
              <span className="text-slate-900 text-[28px] font-bold tracking-[-0.5px] leading-[1.1] max-[767px]:text-2xl">
                {stats.inactive}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Body: table + sidebar */}
      <div className="grid grid-cols-[1fr_320px] gap-6 max-[1023px]:grid-cols-1">
        {/* Recent direct reports */}
        <RecentEmployeesCard
          title="Direct Reports"
          viewAllLink="/manager/team"
          employees={recentEmployees}
          extraColumn="phone"
          emptyMessage="No direct reports found."
        />

        {/* Quick actions sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04)]">
            <div className="px-6 py-5 border-b border-slate-200 max-[767px]:px-[18px] max-[767px]:py-4">
              <h2 className="m-0 text-slate-900 text-base font-semibold">
                Quick Actions
              </h2>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <Link
                to="/manager/team"
                className="p-3 flex items-center gap-3 rounded-lg text-slate-700 text-sm font-medium no-underline transition-colors duration-150 hover:bg-slate-50"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <HiOutlineUsers size={18} />
                </div>
                View Team
              </Link>

              <Link
                to="/manager/profile"
                className="p-3 flex items-center gap-3 rounded-lg text-slate-700 text-sm font-medium no-underline transition-colors duration-150 hover:bg-slate-50"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <HiOutlineUser size={18} />
                </div>
                My Profile & Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
