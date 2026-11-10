import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

import leaveApi from "../../api/leaveApi";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import ConfirmDialog from "../../components/common/ConfirmDialog";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);

// Color palette for leave types
const LEAVE_TYPE_COLORS = [
  {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    badgeBg: "#dbeafe",
    code: "CL",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-200",
    badgeBg: "#fef3c7",
    code: "SL",
  },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200",
    badgeBg: "#d1fae5",
    code: "EL",
  },
  {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    badgeBg: "#f3e8ff",
    code: "ML",
  },
  {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-200",
    badgeBg: "#ffe4e6",
    code: "OL",
  },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => dayjs());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week'
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [showPending, setShowPending] = useState(true);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month & Year Picker Popover state
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => dayjs().year());
  const pickerRef = useRef(null);

  // Drawer for inspecting an event
  const [activeRequest, setActiveRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Close month picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsMonthPickerOpen(false);
      }
    }
    if (isMonthPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  // Sync pickerYear with currentDate
  useEffect(() => {
    setPickerYear(currentDate.year());
  }, [currentDate]);

  // 1. Load active leave types & pending requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await leaveApi.getMyRequests({ pageSize: 50, status: "Pending" });
      const list =
        res?.data ||
        res?.items ||
        (Array.isArray(res) ? res : []);
      setPendingRequests(list.filter((r) => r.status === "Pending"));
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchInitial() {
      try {
        const [typesRes] = await Promise.allSettled([
          leaveApi.getLeaveTypeOptions(),
        ]);

        if (mounted) {
          if (typesRes.status === "fulfilled" && Array.isArray(typesRes.value)) {
            setLeaveTypeOptions(typesRes.value);
          }
        }
      } catch (err) {
        console.error("Failed to load initial calendar data:", err);
      }
    }
    fetchInitial();
    fetchPendingRequests();
    return () => {
      mounted = false;
    };
  }, [fetchPendingRequests]);

  // 2. Compute date boundaries for API query
  const { queryFrom, queryTo } = useMemo(() => {
    if (viewMode === "month") {
      const startOfMonth = currentDate.startOf("month");
      const start = startOfMonth.startOf("isoWeek");
      const endOfMonth = currentDate.endOf("month");
      const end = endOfMonth.endOf("isoWeek");
      return {
        queryFrom: start.format("YYYY-MM-DD"),
        queryTo: end.format("YYYY-MM-DD"),
      };
    } else {
      const start = currentDate.startOf("isoWeek");
      const end = currentDate.endOf("isoWeek");
      return {
        queryFrom: start.format("YYYY-MM-DD"),
        queryTo: end.format("YYYY-MM-DD"),
      };
    }
  }, [currentDate, viewMode]);

  // 3. Fetch approved calendar items
  const fetchEvents = useCallback(async () => {
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
        : Array.isArray(res?.items)
        ? res.items
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
    fetchEvents();
  }, [fetchEvents]);

  // 4. Color map for leave types
  const colorMap = useMemo(() => {
    const map = {};
    leaveTypeOptions.forEach((type, idx) => {
      const palette = LEAVE_TYPE_COLORS[idx % LEAVE_TYPE_COLORS.length];
      map[type.id] = palette;
      map[type.name] = palette;
    });
    return map;
  }, [leaveTypeOptions]);

  const getColorForEvent = (event) => {
    if (event.leaveTypeId && colorMap[event.leaveTypeId]) {
      return colorMap[event.leaveTypeId];
    }
    if (event.leaveTypeName && colorMap[event.leaveTypeName]) {
      return colorMap[event.leaveTypeName];
    }
    return LEAVE_TYPE_COLORS[0];
  };

  // 5. Filter events by leave type dropdown
  const filteredEvents = useMemo(() => {
    if (!selectedLeaveTypeId) return calendarEvents;
    return calendarEvents.filter((ev) => {
      const typeId = ev.leaveTypeId ?? ev.LeaveTypeId;
      return String(typeId) === String(selectedLeaveTypeId);
    });
  }, [calendarEvents, selectedLeaveTypeId]);

  const filteredPending = useMemo(() => {
    if (!showPending) return [];
    if (!selectedLeaveTypeId) return pendingRequests;
    return pendingRequests.filter((req) => {
      const typeId = req.leaveTypeId ?? req.LeaveTypeId;
      return String(typeId) === String(selectedLeaveTypeId);
    });
  }, [pendingRequests, showPending, selectedLeaveTypeId]);

  // 6. Navigation Handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => prev.subtract(1, "month"));
    } else {
      setCurrentDate((prev) => prev.subtract(1, "week"));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => prev.add(1, "month"));
    } else {
      setCurrentDate((prev) => prev.add(1, "week"));
    }
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
    setPickerYear(dayjs().year());
    setIsMonthPickerOpen(false);
  };

  const handleSelectMonth = (monthIndex) => {
    setCurrentDate((prev) => prev.year(pickerYear).month(monthIndex));
    setIsMonthPickerOpen(false);
  };

  // 7. Calendar Weeks Calculation (handles both Month and Week views)
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    if (viewMode === "month") {
      let curr = dayjs(queryFrom);
      const end = dayjs(queryTo);
      while (curr.isBefore(end)) {
        const weekStart = curr.startOf("isoWeek");
        const weekEnd = curr.endOf("isoWeek");
        const days = [];
        for (let i = 0; i < 7; i++) {
          days.push(weekStart.add(i, "day"));
        }
        weeks.push({
          weekStart,
          weekEnd,
          days,
          weekNumber: weekStart.isoWeek(),
        });
        curr = curr.add(1, "week");
      }
    } else {
      const weekStart = currentDate.startOf("isoWeek");
      const weekEnd = currentDate.endOf("isoWeek");
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(weekStart.add(i, "day"));
      }
      weeks.push({
        weekStart,
        weekEnd,
        days,
        weekNumber: weekStart.isoWeek(),
      });
    }
    return weeks;
  }, [viewMode, queryFrom, queryTo, currentDate]);

  // Compute Spanning Leave Bars for any given week (1-indexed for CSS Grid colStart & colSpan)
  const getEventsForWeek = useCallback(
    (weekStart, weekEnd) => {
      const events = [];

      // 1. Approved leaves
      filteredEvents.forEach((ev) => {
        const fromRaw = ev.fromDate || ev.FromDate;
        const toRaw = ev.toDate || ev.ToDate;
        if (!fromRaw || !toRaw) return;
        const evStart = dayjs(fromRaw).startOf("day");
        const evEnd = dayjs(toRaw).startOf("day");

        if (evStart.isSameOrBefore(weekEnd) && evEnd.isSameOrAfter(weekStart)) {
          const startIndex = Math.max(0, evStart.diff(weekStart, "day"));
          const endIndex = Math.min(6, evEnd.diff(weekStart, "day"));
          events.push({
            ...ev,
            isPending: false,
            colStart: startIndex + 1,
            colSpan: endIndex - startIndex + 1,
            startsBefore: evStart.isBefore(weekStart),
            endsAfter: evEnd.isAfter(weekEnd),
          });
        }
      });

      // 2. Pending leaves
      if (showPending) {
        filteredPending.forEach((req) => {
          const evStart = dayjs(req.fromDate).startOf("day");
          const evEnd = dayjs(req.toDate).startOf("day");

          if (evStart.isSameOrBefore(weekEnd) && evEnd.isSameOrAfter(weekStart)) {
            const startIndex = Math.max(0, evStart.diff(weekStart, "day"));
            const endIndex = Math.min(6, evEnd.diff(weekStart, "day"));
            events.push({
              ...req,
              isPending: true,
              colStart: startIndex + 1,
              colSpan: endIndex - startIndex + 1,
              startsBefore: evStart.isBefore(weekStart),
              endsAfter: evEnd.isAfter(weekEnd),
            });
          }
        });
      }

      return events;
    },
    [filteredEvents, filteredPending, showPending]
  );

  // Dynamic Title for Month / Week view
  const calendarTitle = useMemo(() => {
    if (viewMode === "month") {
      return currentDate.format("MMMM YYYY");
    } else {
      const weekStart = currentDate.startOf("isoWeek");
      const weekEnd = currentDate.endOf("isoWeek");
      if (weekStart.year() !== weekEnd.year()) {
        return `${weekStart.format("D MMM YYYY")} – ${weekEnd.format("D MMM YYYY")}`;
      }
      if (weekStart.month() !== weekEnd.month()) {
        return `${weekStart.format("D MMM")} – ${weekEnd.format("D MMM YYYY")}`;
      }
      return `${weekStart.format("D")} – ${weekEnd.format("D MMMM YYYY")}`;
    }
  }, [currentDate, viewMode]);

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Open drawer to inspect leave request
  const handleEventClick = async (event, isPending = false) => {
    const reqId = event.leaveRequestId || event.id;
    try {
      const detailed = await leaveApi.getRequestById(reqId);
      setActiveRequest(detailed);
    } catch {
      setActiveRequest({
        id: reqId,
        leaveTypeName: event.leaveTypeName,
        status: isPending ? "Pending" : event.status || "Approved",
        fromDate: event.fromDate,
        toDate: event.toDate,
        numberOfDays: event.numberOfDays,
        reason: event.reason || (isPending ? "Pending Approval" : "Approved Leave"),
      });
    }
  };

  // Cancellation handler from drawer
  const handleConfirmCancel = async () => {
    if (!cancellingRequest) return;
    try {
      setCancelling(true);
      await leaveApi.cancelRequest(cancellingRequest.id);
      setCancellingRequest(null);
      setActiveRequest(null);
      fetchPendingRequests();
      fetchEvents();
    } catch (err) {
      console.error("Failed to cancel leave request:", err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
            Leave Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your approved schedule and pending leave requests in one place.
          </p>
        </div>

        {/* Action Link to Apply */}
        <div className="flex items-center gap-3">
          <Link
            to="/employee/leaves"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors no-underline shadow-2xs"
          >
            Balances & Requests
          </Link>
          <Link
            to="/employee/leaves/apply"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors no-underline shadow-xs"
          >
            + Apply for Leave
          </Link>
        </div>
      </div>

      {/* Main Full-Width Calendar Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 md:px-6 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 bg-white relative">
          {/* Left: Navigation Buttons & Interactive Month/Year Title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                title="Previous"
                className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              >
                <HiOutlineChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                title="Next"
                className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              >
                <HiOutlineChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Today
            </button>

            {/* Interactive Month & Year Selector Popover Trigger */}
            <div className="relative ml-2" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white text-base md:text-lg font-bold text-slate-900 transition-all cursor-pointer group shadow-2xs"
              >
                <HiOutlineCalendar className="text-blue-600" size={19} />
                <span>{calendarTitle}</span>
                {viewMode === "week" && (
                  <span className="ml-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                    W{currentDate.isoWeek()}
                  </span>
                )}
                <HiOutlineChevronDown
                  size={15}
                  className={`text-slate-400 group-hover:text-blue-600 transition-transform ${
                    isMonthPickerOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              {/* Month & Year Picker Dropdown Popover */}
              {isMonthPickerOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Year Stepper */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y - 1)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Previous Year"
                    >
                      <HiOutlineChevronLeft size={16} />
                    </button>
                    <span className="text-base font-bold text-slate-900">
                      {pickerYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y + 1)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Next Year"
                    >
                      <HiOutlineChevronRight size={16} />
                    </button>
                  </div>

                  {/* 12 Months Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {SHORT_MONTH_NAMES.map((name, idx) => {
                      const isSelected =
                        currentDate.month() === idx &&
                        currentDate.year() === pickerYear;
                      const isCurrentActualMonth =
                        dayjs().month() === idx &&
                        dayjs().year() === pickerYear;

                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleSelectMonth(idx)}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs font-bold"
                              : isCurrentActualMonth
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick 'Current Month' Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={handleToday}
                      className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      Go to current {viewMode === "week" ? "week" : "month"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMonthPickerOpen(false)}
                      className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Filter, Pending Toggle, & Month/Week Pill */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter by Leave Type */}
            <div className="relative">
              <select
                value={selectedLeaveTypeId}
                onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-3.5 py-1.5 pr-8 text-xs font-medium text-slate-700 outline-none cursor-pointer transition-all"
              >
                <option value="">All leave types</option>
                {leaveTypeOptions.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Toggle Pending Requests on Calendar */}
            

            {/* View Mode Toggle: Month / Week */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "month"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "week"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Body: Weekday Header */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-white text-center">
          {viewMode === "month"
            ? weekdays.map((day, idx) => {
                const isWeekend = idx === 5 || idx === 6;
                return (
                  <div
                    key={day}
                    className={`py-2.5 text-[11px] font-bold tracking-wider ${
                      isWeekend ? "text-red-600 bg-red-50/50" : "text-slate-500"
                    }`}
                  >
                    {day}
                  </div>
                );
              })
            : calendarWeeks[0]?.days.map((day, idx) => {
                const isWeekend = idx === 5 || idx === 6;
                const isToday = day.isSame(dayjs(), "day");
                return (
                  <div
                    key={day.format("YYYY-MM-DD")}
                    className={`py-3 px-2 flex flex-col items-center justify-center transition-colors ${
                      isToday
                        ? "bg-blue-50/50 text-blue-900 font-bold"
                        : isWeekend
                        ? "text-red-600 bg-red-50/50"
                        : "text-slate-700 bg-white"
                    }`}
                  >
                    <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                      {weekdays[idx]}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`text-sm font-extrabold ${
                          isToday
                            ? "px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs"
                            : isWeekend
                            ? "text-red-600"
                            : "text-slate-900"
                        }`}
                      >
                        {day.format("D MMM")}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Calendar Grid Container */}
        {loading ? (
          <div className="min-h-[540px] flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500">
                Loading calendar events...
              </span>
            </div>
          </div>
        ) : viewMode === "week" ? (
          /* ============================================================ */
          /* WEEK VIEW: Dedicated Timeline + 7 Detailed Schedule Columns */
          /* ============================================================ */
          <div className="flex flex-col divide-y divide-slate-100 min-h-[520px] bg-white">
            {/* 1. Spanning Leave Bars Section */}
            {(() => {
              const currentWeek = calendarWeeks[0];
              if (!currentWeek) return null;
              const weekEvents = getEventsForWeek(
                currentWeek.weekStart,
                currentWeek.weekEnd
              );

              return (
                <div className="p-3.5 bg-slate-50/70 border-b border-slate-200/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Week Leave Timeline
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {weekEvents.length}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {currentWeek.weekStart.format("D MMM")} –{" "}
                      {currentWeek.weekEnd.format("D MMM YYYY")}
                    </span>
                  </div>

                  {weekEvents.length === 0 ? (
                    <div className="py-2.5 px-4 rounded-xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                      No leave requests active during this week.
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {weekEvents.map((ev, i) => {
                        const color = getColorForEvent(ev);
                        const reqId = ev.id || ev.leaveRequestId || i;
                        const typeName = ev.leaveTypeName || "Leave";
                        const daysCount = ev.numberOfDays ?? 1;

                        return (
                          <button
                            key={`week-bar-${ev.isPending ? "p" : "a"}-${reqId}`}
                            type="button"
                            onClick={() => handleEventClick(ev, ev.isPending)}
                            style={{
                              gridColumn: `${ev.colStart} / span ${ev.colSpan}`,
                            }}
                            className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all hover:scale-[1.01] hover:brightness-95 cursor-pointer shadow-2xs ${
                              ev.isPending
                                ? "bg-amber-50 text-amber-900 border border-dashed border-amber-400"
                                : `${color.bg} ${color.text} border ${color.border}`
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5 font-bold">
                              {ev.isPending && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              )}
                              {ev.startsBefore && (
                                <span className="text-[10px] opacity-75">◀</span>
                              )}
                              <span>{typeName}</span>
                              <span className="font-normal opacity-85">
                                · {daysCount} {daysCount === 1 ? "day" : "days"}
                              </span>
                              {ev.isPending && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                                  Pending
                                </span>
                              )}
                              {ev.endsAfter && (
                                <span className="text-[10px] opacity-75">▶</span>
                              )}
                            </span>
                            <span className="text-[11px] font-medium opacity-75 hidden sm:inline ml-2 shrink-0">
                              {dayjs(ev.fromDate).format("D MMM")} –{" "}
                              {dayjs(ev.toDate).format("D MMM")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. 7 Daily Schedule Columns */}
            {calendarWeeks[0] && (
              <div className="grid grid-cols-7 divide-x divide-slate-100 flex-1 min-h-[440px]">
                {calendarWeeks[0].days.map((day, idx) => {
                  const isWeekend = idx === 5 || idx === 6;
                  const isToday = day.isSame(dayjs(), "day");
                  const dateStr = day.format("YYYY-MM-DD");

                  const dayApprovedEvents = filteredEvents.filter((ev) => {
                    const fromRaw = ev.fromDate || ev.FromDate;
                    const toRaw = ev.toDate || ev.ToDate;
                    if (!fromRaw || !toRaw) return false;
                    const fromStr = dayjs(fromRaw).format("YYYY-MM-DD");
                    const toStr = dayjs(toRaw).format("YYYY-MM-DD");
                    return dateStr >= fromStr && dateStr <= toStr;
                  });

                  const dayPendingEvents = filteredPending.filter((req) => {
                    const fromStr = dayjs(req.fromDate).format("YYYY-MM-DD");
                    const toStr = dayjs(req.toDate).format("YYYY-MM-DD");
                    return dateStr >= fromStr && dateStr <= toStr;
                  });

                  const allDayEvents = [
                    ...dayApprovedEvents.map((e) => ({ ...e, isPending: false })),
                    ...dayPendingEvents.map((e) => ({ ...e, isPending: true })),
                  ];

                  return (
                    <div
                      key={dateStr}
                      className={`p-3 flex flex-col justify-between transition-colors ${
                        isWeekend
                          ? "bg-red-50/30"
                          : isToday
                          ? "bg-blue-50/20"
                          : "bg-white"
                      }`}
                    >
                      <div>
                        {/* Day Column Subhead */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                          <span
                            className={`text-xs font-bold ${
                              isWeekend
                                ? "text-red-700"
                                : isToday
                                ? "text-blue-700"
                                : "text-slate-700"
                            }`}
                          >
                            {day.format("dddd")}
                          </span>
                          {isWeekend && (
                            <span className="text-[10px] text-red-600 font-semibold px-1.5 py-0.5 rounded bg-red-50 border border-red-100">
                              Weekend
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[10px] text-blue-600 font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Daily Leave Schedule Cards */}
                        <div className="flex flex-col gap-2">
                          {allDayEvents.length === 0 ? (
                            <div className="py-10 text-center text-xs text-slate-300 font-medium select-none">
                              No leave
                            </div>
                          ) : (
                            allDayEvents.map((ev, i) => {
                              const color = getColorForEvent(ev);
                              const typeName = ev.leaveTypeName || "Leave";
                              const daysCount = ev.numberOfDays ?? 1;

                              return (
                                <div
                                  key={`col-${ev.isPending ? "p" : "a"}-${ev.id || i}`}
                                  onClick={() =>
                                    handleEventClick(ev, ev.isPending)
                                  }
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                                    ev.isPending
                                      ? "bg-amber-50 text-amber-900 border-amber-300"
                                      : `${color.bg} ${color.text} ${color.border}`
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold">{typeName}</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        ev.isPending
                                          ? "bg-amber-200 text-amber-900"
                                          : "bg-white/80 text-slate-700"
                                      }`}
                                    >
                                      {ev.isPending ? "Pending" : "Approved"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] opacity-80">
                                    {daysCount}{" "}
                                    {daysCount === 1 ? "day" : "days"} (
                                    {dayjs(ev.fromDate).format("D MMM")} –{" "}
                                    {dayjs(ev.toDate).format("D MMM")})
                                  </div>
                                  {ev.reason && (
                                    <div className="mt-1 text-[11px] opacity-75 truncate italic">
                                      "{ev.reason}"
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* MONTH VIEW: 5-6 Week Rows with Spanning Bars */
          /* ============================================================ */
          <div className="flex flex-col divide-y divide-slate-100 min-h-[540px] bg-white">
            {calendarWeeks.map((week, wIdx) => {
              const weekEvents = getEventsForWeek(week.weekStart, week.weekEnd);

              return (
                <div
                  key={`month-week-${wIdx}`}
                  className="min-h-[110px] flex flex-col justify-between py-1.5 transition-colors hover:bg-slate-50/20"
                >
                  {/* Day Numbers row */}
                  <div className="grid grid-cols-7 text-center">
                    {week.days.map((day, dIdx) => {
                      const isCurrentMonth = day.month() === currentDate.month();
                      const isToday = day.isSame(dayjs(), "day");
                      const isWeekend = dIdx === 5 || dIdx === 6;

                      return (
                        <div
                          key={day.format("YYYY-MM-DD")}
                          className={`px-2 py-1 flex items-center justify-between ${
                            !isCurrentMonth ? "opacity-40" : ""
                          }`}
                        >
                          {isToday ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                              {day.date()}
                            </div>
                          ) : (
                            <span
                              className={`text-xs font-semibold ${
                                isWeekend
                                  ? isCurrentMonth
                                    ? "text-red-600 font-bold"
                                    : "text-red-400"
                                  : isCurrentMonth
                                  ? "text-slate-800"
                                  : "text-slate-400"
                              }`}
                            >
                              {day.date()}
                            </span>
                          )}

                          {isWeekend && (
                            <span className="text-[10px] text-red-500 font-semibold px-1 py-0.2 rounded bg-red-50 border border-red-100">
                              W
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Spanning Event Bars for this week row */}
                  <div className="grid grid-cols-7 gap-1 px-1.5 my-1.5">
                    {weekEvents.map((ev, i) => {
                      const color = getColorForEvent(ev);
                      const reqId = ev.id || ev.leaveRequestId || i;
                      const typeName = ev.leaveTypeName || "Leave";
                      const daysCount = ev.numberOfDays ?? 1;

                      return (
                        <button
                          key={`bar-${ev.isPending ? "p" : "a"}-${reqId}-${wIdx}`}
                          type="button"
                          onClick={() => handleEventClick(ev, ev.isPending)}
                          style={{
                            gridColumn: `${ev.colStart} / span ${ev.colSpan}`,
                          }}
                          className={`h-6.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-between truncate transition-transform hover:scale-[1.01] cursor-pointer shadow-2xs ${
                            ev.isPending
                              ? "bg-amber-50 text-amber-900 border border-dashed border-amber-400"
                              : `${color.bg} ${color.text} border ${color.border}`
                          }`}
                          title={`${typeName} (${daysCount} days) · ${
                            ev.isPending ? "Pending" : "Approved"
                          } - Click to view`}
                        >
                          <span className="truncate flex items-center gap-1">
                            {ev.isPending && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            )}
                            {ev.startsBefore && (
                              <span className="text-[9px] opacity-75">◀</span>
                            )}
                            <span>
                              {typeName} · {daysCount}d
                            </span>
                            {ev.isPending && (
                              <span className="text-[9px] opacity-75">
                                (Pending)
                              </span>
                            )}
                            {ev.endsAfter && (
                              <span className="text-[9px] opacity-75">▶</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Weekend Column Subtle Indicators in Month View */}
                  <div className="grid grid-cols-7 h-1">
                    {week.days.map((day, dIdx) => {
                      const isWeekend = dIdx === 5 || dIdx === 6;
                      return (
                        <div
                          key={`bg-${day.format("YYYY-MM-DD")}`}
                          className={isWeekend ? "bg-red-50/20" : "bg-transparent"}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend & Summary Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-5 sm:gap-6">
            <span className="font-semibold text-slate-700">Legend:</span>
            {leaveTypeOptions.map((type) => {
              const color = getColorForEvent({ leaveTypeId: type.id });
              return (
                <div key={type.id} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 border"
                    style={{
                      backgroundColor: color.badgeBg,
                      borderColor: "#cbd5e1",
                    }}
                  />
                  <span className="font-medium text-slate-700">
                    {type.name}
                  </span>
                </div>
              );
            })}

            {/* Pending Chip */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-amber-100 border border-dashed border-amber-400" />
              <span className="font-medium text-amber-800">
                Pending Approval
              </span>
            </div>

            {/* Weekend */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-slate-100 border border-slate-300" />
              <span className="font-medium text-slate-600">Weekend</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {pendingRequests.length}{" "}
                {pendingRequests.length === 1 ? "request" : "requests"} pending
                decision
              </span>
            )}
            <span className="text-slate-400">
              Loaded {dayjs(queryFrom).format("MM/DD")} to{" "}
              {dayjs(queryTo).format("MM/DD")}
            </span>
          </div>
        </div>
      </div>

      {/* Leave Details Drawer */}
      <LeaveDetailsDrawer
        open={Boolean(activeRequest)}
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onRequestCancel={(req) => setCancellingRequest(req)}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(cancellingRequest)}
        title="Cancel Leave Request?"
        message={
          cancellingRequest
            ? `${cancellingRequest.leaveTypeName}, ${dayjs(
                cancellingRequest.fromDate
              ).format("D MMM")} – ${dayjs(cancellingRequest.toDate).format(
                "D MMM YYYY"
              )} (${cancellingRequest.numberOfDays} working ${
                cancellingRequest.numberOfDays === 1 ? "day" : "days"
              }). The days go back to your available balance. This can't be undone.`
            : ""
        }
        confirmText={cancelling ? "Cancelling..." : "Yes, Cancel request."}
        cancelText="No, Keep request."
        danger
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingRequest(null)}
      />
    </div>
  );
}

