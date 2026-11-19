import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

import leaveApi from "../../api/leaveApi";
import adminApi from "../../api/adminApi";
import LeaveCalendar, {
  getCalendarRange,
} from "../../components/leave/LeaveCalendar";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import RejectLeaveDialog from "../../components/leave/RejectLeaveDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Date badge styles for upcoming leaves
const BADGE_COLOR_VARIANTS = [
  "bg-sky-50 text-sky-700 border-sky-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-indigo-50 text-indigo-700 border-indigo-100",
  "bg-amber-50 text-amber-800 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
];

function getInitials(name) {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLeaveDateRange(from, to) {
  const f = dayjs(from);
  const t = dayjs(to);
  if (f.isSame(t, "day")) {
    return f.format("D MMM");
  }
  if (f.month() === t.month()) {
    return `${f.format("D")} – ${t.format("D MMM")}`;
  }
  return `${f.format("D MMM")} – ${t.format("D MMM")}`;
}

export default function AdminLeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => dayjs());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week'
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Side widget data: Out Today and Coming Up
  const [outTodayList, setOutTodayList] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);
  const [sideLoading, setSideLoading] = useState(true);

  // Drawer state
  const [activeRequest, setActiveRequest] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Dialog states for Approve / Reject actions
  const [approveDialogState, setApproveDialogState] = useState({
    open: false,
    request: null,
    loading: false,
  });
  const [rejectDialogState, setRejectDialogState] = useState({
    open: false,
    request: null,    
    loading: false,
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 5000);
  };

  const today = useMemo(() => dayjs(), []);
  const todayStr = useMemo(() => today.format("YYYY-MM-DD"), [today]);

  // 1. Initial metadata: Leave types and total employee count
  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      try {
        const [types, empCount] = await Promise.all([
          leaveApi.getLeaveTypeOptions(false),
          adminApi.getActiveEmployeesCount(),
        ]);

        if (mounted) {
          if (Array.isArray(types)) {
            setLeaveTypeOptions(types);
          }
          if (typeof empCount === "number") {
            setTotalEmployees(empCount);
          }
        }
      } catch (err) {
        console.error("Failed to load calendar metadata:", err);
      }
    }

    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Side Widgets: Out Today and Coming Up (next 7 days)
  const fetchSideWidgetsData = useCallback(async () => {
    try {
      setSideLoading(true);
      const tomorrow = today.add(1, "day").format("YYYY-MM-DD");
      const next7Days = today.add(7, "day").format("YYYY-MM-DD");

      // Query leaves for today and upcoming 7-day range
      const [todayRes, upcomingRes] = await Promise.all([
        leaveApi.getCalendar({ from: todayStr, to: todayStr }),
        leaveApi.getCalendar({ from: tomorrow, to: next7Days }),
      ]);

      const todayData = Array.isArray(todayRes)
        ? todayRes
        : Array.isArray(todayRes?.data)
        ? todayRes.data
        : [];

      const upcomingData = Array.isArray(upcomingRes)
        ? upcomingRes
        : Array.isArray(upcomingRes?.data)
        ? upcomingRes.data
        : [];

      setOutTodayList(todayData);

      // Filter strictly to leaves starting within the next 7 days, sorted chronologically
      const tomorrowStart = today.add(1, "day").startOf("day");
      const limitEnd = today.add(7, "day").endOf("day");

      const sortedUpcoming = upcomingData
        .filter((item) => {
          const itemFrom = dayjs(item.fromDate || item.FromDate).startOf("day");
          return (
            itemFrom.isSameOrAfter(tomorrowStart) &&
            itemFrom.isSameOrBefore(limitEnd)
          );
        })
        .sort((a, b) =>
          dayjs(a.fromDate || a.FromDate).diff(dayjs(b.fromDate || b.FromDate))
        );

      setUpcomingList(sortedUpcoming);
    } catch (err) {
      console.error("Failed to load side widget leaves data:", err);
    } finally {
      setSideLoading(false);
    }
  }, [today, todayStr]);

  useEffect(() => {
    fetchSideWidgetsData();
  }, [fetchSideWidgetsData]);

  // 3. Compute date boundaries for calendar grid API query
  const { from: queryFrom, to: queryTo } = useMemo(
    () => getCalendarRange(currentDate, viewMode),
    [currentDate, viewMode]
  );

  // 4. Fetch approved calendar items for the viewed period
  const fetchCalendarEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getCalendar({
        from: queryFrom,
        to: queryTo,
      });

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.value)
        ? res.value
        : [];

      setCalendarEvents(list);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  }, [queryFrom, queryTo]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  // Open slide-over drawer on event or card item click
  const handleEventClick = async (event) => {
    const reqId = event.leaveRequestId || event.id;
    try {
      const detailed = await adminApi.getLeaveRequestById(reqId);
      setActiveRequest(detailed?.data || detailed);
    } catch {
      setActiveRequest({
        id: reqId,
        employeeName: event.employeeName || "Employee",
        employeeCode: event.employeeCode || "",
        leaveTypeName: event.leaveTypeName,
        status: event.status || "Approved",
        fromDate: event.fromDate || event.FromDate,
        toDate: event.toDate || event.ToDate,
        numberOfDays: event.numberOfDays,
        reason: event.reason || "Approved Leave",
      });
    }
  };

  // Refresh all calendar & widget data
  const refreshAll = useCallback(() => {
    fetchCalendarEvents();
    fetchSideWidgetsData();
  }, [fetchCalendarEvents, fetchSideWidgetsData]);

  // Approve action handlers
  const handleOpenApprove = (req) => {
    setApproveDialogState({
      open: true,
      request: req,
      loading: false,
    });
  };

  const handleConfirmApprove = async () => {
    const target = approveDialogState.request;
    if (!target) return;

    try {
      setApproveDialogState((prev) => ({ ...prev, loading: true }));
      await adminApi.approveLeaveRequest(target.id);

      setApproveDialogState({ open: false, request: null, loading: false });
      if (activeRequest && activeRequest.id === target.id) {
        setActiveRequest(null);
      }
      refreshAll();
      showFeedback(
        "success",
        `Approved ${target.leaveTypeName} request for ${target.employeeName}.`
      );
    } catch (err) {
      console.error("Failed to approve leave request:", err);
      setApproveDialogState((prev) => ({ ...prev, loading: false }));
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to approve leave request."
      );
    }
  };

  // Reject action handlers
  const handleOpenReject = (req) => {
    setRejectDialogState({
      open: true,
      request: req,
      loading: false,
    });
  };

  const handleConfirmReject = async (requestId, reason) => {
    const target = rejectDialogState.request;
    if (!target) return;

    try {
      setRejectDialogState((prev) => ({ ...prev, loading: true }));
      await adminApi.rejectLeaveRequest(requestId, reason);

      setRejectDialogState({ open: false, request: null, loading: false });
      if (activeRequest && activeRequest.id === target.id) {
        setActiveRequest(null);
      }
      refreshAll();
      showFeedback(
        "success",
        `Rejected ${target.leaveTypeName} request for ${target.employeeName}.`
      );
    } catch (err) {
      console.error("Failed to reject leave request:", err);
      setRejectDialogState((prev) => ({ ...prev, loading: false }));
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to reject leave request."
      );
    }
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 py-6 md:px-8 md:py-8 font-sans">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
          Leave Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Approved leave of all employees. Pending requests are not shown.
        </p>
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`mb-6 flex items-start justify-between gap-3 p-4 rounded-xl text-sm ${
            feedback.type === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "error" ? (
              <HiOutlineExclamationCircle size={18} className="shrink-0" />
            ) : (
              <HiOutlineCheckCircle size={18} className="shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Organization Calendar */}
        <div className="lg:col-span-8 xl:col-span-9">
          <LeaveCalendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            events={calendarEvents}
            leaveTypeOptions={leaveTypeOptions}
            loading={loading}
            mode="admin"
            selectedLeaveTypeId={selectedLeaveTypeId}
            onLeaveTypeIdChange={setSelectedLeaveTypeId}
            showPending={false}
            showPendingToggle={false}
            onEventClick={handleEventClick}
            renderWeekEmptyDay={() => (
              <span className="text-xs text-slate-300 font-medium select-none">
                No leaves
              </span>
            )}
          />
        </div>

        {/* Right Column: Out Today & Coming Up Cards */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
          {/* 1. Dark Card: Out Today */}
          <div className="bg-[#111827] text-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400">
              Out today &middot; {today.format("D MMM YYYY")}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight leading-none">
                {outTodayList.length}
              </span>
              <span className="text-sm font-normal text-slate-400">
                of {totalEmployees || "—"} people
              </span>
            </div>

            {sideLoading ? (
              <div className="mt-5 space-y-2.5 animate-pulse">
                <div className="h-9 bg-slate-800 rounded-lg" />
                <div className="h-9 bg-slate-800 rounded-lg" />
              </div>
            ) : outTodayList.length > 0 ? (
              <div className="mt-5 space-y-3.5 divide-y divide-slate-800/80">
                {outTodayList.map((item) => {
                  const toDate = item.toDate || item.ToDate;
                  const isSingleDay =
                    (item.fromDate || item.FromDate) === toDate ||
                    item.numberOfDays === 1;

                  return (
                    <div
                      key={item.leaveRequestId || item.id}
                      onClick={() => handleEventClick(item)}
                      className="pt-3.5 first:pt-0 flex items-center gap-3 cursor-pointer group"
                      title="Click to view leave details"
                    >
                      {/* Initials Avatar */}
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(item.employeeName)}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                          {item.employeeName}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {item.leaveTypeName} &middot;{" "}
                          {isSingleDay
                            ? "today"
                            : `until ${dayjs(toDate).format("D MMM")}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                Everyone is working today. No approved leaves.
              </div>
            )}
          </div>

          {/* 2. Light Card: Coming Up */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Coming up (Next 7 Days)
            </h2>

            {sideLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
              </div>
            ) : upcomingList.length > 0 ? (
              <div className="space-y-3.5">
                {upcomingList.map((item, idx) => {
                  const fromDate = item.fromDate || item.FromDate;
                  const toDate = item.toDate || item.ToDate;
                  const monthName = dayjs(fromDate).format("MMM").toUpperCase();
                  const dayNum = dayjs(fromDate).format("D");
                  const badgeStyle =
                    BADGE_COLOR_VARIANTS[idx % BADGE_COLOR_VARIANTS.length];

                  return (
                    <div
                      key={`upcoming-${item.leaveRequestId || item.id}-${idx}`}
                      onClick={() => handleEventClick(item)}
                      className="flex items-center gap-3.5 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      title="Click to view leave details"
                    >
                      {/* Date Pill Badge */}
                      <div
                        className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${badgeStyle}`}
                      >
                        <span className="text-[10px] font-extrabold tracking-wider leading-none">
                          {monthName}
                        </span>
                        <span className="text-base font-black leading-tight mt-0.5">
                          {dayNum}
                        </span>
                      </div>

                      {/* Leave Info */}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {item.employeeName}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {item.leaveTypeName} &middot;{" "}
                          {formatLeaveDateRange(fromDate, toDate)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {item.numberOfDays}{" "}
                          {item.numberOfDays === 1 ? "day" : "days"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No upcoming approved leaves in the next 7 days.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over details drawer (Admin mode) */}
      <LeaveDetailsDrawer
        open={Boolean(activeRequest)}
        request={activeRequest}
        mode="admin"
        onClose={() => setActiveRequest(null)}
        onApprove={(req) => handleOpenApprove(req)}
        onReject={(req) => handleOpenReject(req)}
      />

      {/* Approval Confirmation Dialog */}
      <ConfirmDialog
        open={approveDialogState.open}
        title="Approve Leave Request?"
        message={
          approveDialogState.request
            ? `Are you sure you want to approve this ${
                approveDialogState.request.leaveTypeName
              } request for ${
                approveDialogState.request.employeeName
              } (${approveDialogState.request.numberOfDays} ${
                approveDialogState.request.numberOfDays === 1
                  ? "day"
                  : "days"
              })? Admin override: The normal flow is Employee → Manager.`
            : ""
        }
        confirmLabel="Yes, Approve"
        cancelLabel="Go Back"
        variant="success"
        loading={approveDialogState.loading}
        onConfirm={handleConfirmApprove}
        onCancel={() =>
          setApproveDialogState({ open: false, request: null, loading: false })
        }
      />

      {/* Rejection Dialog with Reason */}
      <RejectLeaveDialog
        open={rejectDialogState.open}
        request={rejectDialogState.request}
        loading={rejectDialogState.loading}
        onConfirm={handleConfirmReject}
        onCancel={() =>
          setRejectDialogState({ open: false, request: null, loading: false })
        }
      />
    </div>
  );
}

