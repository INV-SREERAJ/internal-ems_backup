import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { HiOutlinePlus, HiOutlineCalendar } from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import dashboardApi from "../../api/dashboardApi";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { formatLeaveDateRange } from "../../utils/dateUtils";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [balances, setBalances] = useState([]);
  const [latestRequest, setLatestRequest] = useState(null);
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time-appropriate greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const formattedDate = useMemo(() => {
    return dayjs().format("dddd, D MMMM YYYY");
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Single clean BFF endpoint
        const res = await dashboardApi.getEmployeeDashboard();

        if (!mounted) return;

        setBalances(Array.isArray(res?.balances) ? res.balances : []);
        setLatestRequest(res?.latestRequest || null);
        setManager(res?.manager || null);
      } catch (err) {
        if (mounted) {
          console.error("Failed to load employee dashboard:", err);
          setError(err.response?.data?.message || "Failed to load dashboard data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const userName = user?.firstName || user?.name || "Employee";

  if (loading) {
    return (
      <section className="w-full max-w-[1200px] mx-auto pt-2 pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2" />
            <div className="h-4 w-44 bg-slate-100 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        </div>

        {/* Balance Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs min-h-[130px] flex flex-col justify-between"
            >
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded mt-4" />
            </div>
          ))}
        </div>

        {/* Bottom Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs min-h-[130px] lg:col-span-2 flex flex-col justify-between">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-6 w-56 bg-slate-200 rounded mt-4" />
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs min-h-[130px] flex flex-col justify-between">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-6 w-36 bg-slate-200 rounded mt-4" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto pt-2 pb-12">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.5px] text-slate-900 m-0">
            {greeting}, {userName}
          </h1>
          <p className="mt-1.5 mb-0 text-slate-500 text-sm font-medium">
            {formattedDate}
          </p>
        </div>

        <Link
          to="/employee/leaves/apply"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs hover:shadow-sm transition-all shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <HiOutlinePlus size={18} />
          <span>Apply leave</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Row 1: Leave Balance Cards or Clean Empty State */}
      {balances.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {balances.map((item) => (
            <div
              key={item.leaveTypeId || item.leaveTypeCode || item.leaveTypeName}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[130px]"
            >
              <span className="text-slate-500 text-sm font-medium">
                {item.leaveTypeName}
              </span>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                  {item.availableDays ?? 0}
                </span>
                <span className="text-slate-500 font-medium text-sm lg:text-base ml-2">
                  {item.availableDays === 1 ? "day left" : "days left"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 mb-5 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
            <HiOutlineCalendar size={22} />
          </div>
          <p className="text-base font-semibold text-slate-800 m-0">
            No leave balances allocated yet
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm m-0">
            Your leave quotas for the current year have not been assigned yet. Please contact your HR administrator.
          </p>
        </div>
      )}

      {/* Row 2: Latest Request & Reporting Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Latest Request Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[130px] lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">
              Latest request
            </span>
            {latestRequest && (
              <Link
                to="/employee/leaves"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
              >
                View all
              </Link>
            )}
          </div>

          {latestRequest ? (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <span className="text-slate-900 font-semibold text-base sm:text-lg">
                {latestRequest.leaveTypeName} ·{" "}
                {formatLeaveDateRange(
                  latestRequest.fromDate,
                  latestRequest.toDate
                )}
              </span>
              <LeaveStatusBadge status={latestRequest.status} variant="subtle" />
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-slate-400 text-sm italic">
                No recent leave requests
              </span>
              <Link
                to="/employee/leaves/apply"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
              >
                Apply now
              </Link>
            </div>
          )}
        </div>

        {/* Reporting Manager Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[130px] lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">
              Reporting manager
            </span>
            {manager && (
              <Link
                to="/profile"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
              >
                View details
              </Link>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-slate-900 font-semibold text-base sm:text-lg truncate">
              {manager?.managerName || "Not assigned"}
            </span>
            {manager?.managerEmployeeCode && (
              <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-md font-mono shrink-0">
                {manager.managerEmployeeCode}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
