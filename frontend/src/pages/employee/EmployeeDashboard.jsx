import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { HiOutlinePlus } from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import leaveApi from "../../api/leaveApi";
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

        const currentYear = new Date().getFullYear();

        const [balancesRes, requestsRes, managerRes] = await Promise.allSettled([
          leaveApi.getMyBalances(currentYear),
          leaveApi.getMyRequests({ page: 1, pageSize: 5 }),
          leaveApi.getMyManager(),
        ]);

        if (!mounted) return;

        // Leave Balances
        if (balancesRes.status === "fulfilled" && Array.isArray(balancesRes.value)) {
          setBalances(balancesRes.value);
        }

        // Latest Request
        if (requestsRes.status === "fulfilled" && requestsRes.value) {
          const reqList =
            requestsRes.value.data ||
            requestsRes.value.items ||
            (Array.isArray(requestsRes.value) ? requestsRes.value : []);
          if (reqList.length > 0) {
            setLatestRequest(reqList[0]);
          } else {
            setLatestRequest(null);
          }
        }

        // Manager details
        if (managerRes.status === "fulfilled" && managerRes.value) {
          setManager(managerRes.value);
        }
      } catch (err) {
        if (mounted) {
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

  // Display cards: if balances is empty, provide sensible defaults so UI mirrors design
  const displayBalances = useMemo(() => {
    if (balances && balances.length > 0) {
      return balances;
    }
    return [
      { leaveTypeId: 1, leaveTypeName: "Casual leave", availableDays: 0 },
      { leaveTypeId: 2, leaveTypeName: "Earned leave", availableDays: 0 },
      { leaveTypeId: 3, leaveTypeName: "Sick leave", availableDays: 0 },
    ];
  }, [balances]);

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
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm min-h-[130px] flex flex-col justify-between"
            >
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded mt-4" />
            </div>
          ))}
        </div>

        {/* Bottom Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm min-h-[130px] lg:col-span-2 flex flex-col justify-between">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-6 w-56 bg-slate-200 rounded mt-4" />
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm min-h-[130px] flex flex-col justify-between">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-6 w-36 bg-slate-200 rounded mt-4" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto pt-2 pb-12">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="m-0 text-slate-900 text-2xl sm:text-[28px] font-bold tracking-[-0.5px]">
            {greeting}, {userName}
          </h1>
          <p className="mt-1.5 mb-0 text-slate-500 text-sm font-medium">
            {formattedDate}
          </p>
        </div>

        <Link
          to="/employee/leaves/apply"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all shrink-0 self-start sm:self-auto"
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

      {/* Row 1: Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        {displayBalances.map((item) => (
          <div
            key={item.leaveTypeId || item.leaveTypeCode || item.leaveTypeName}
            className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]"
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

      {/* Row 2: Latest Request & Reporting Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Latest Request Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px] lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">
              Latest request
            </span>
            {latestRequest && (
              <Link
                to="/employee/leaves"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
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
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Apply now
              </Link>
            </div>
          )}
        </div>

        {/* Reporting Manager Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px] lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">
              Reporting manager
            </span>
            {manager && (
              <Link
                to="/employee/my-manager"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
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
