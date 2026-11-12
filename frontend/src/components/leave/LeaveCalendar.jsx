import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineCalendar,
} from "react-icons/hi2";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);

// Color palette for leave types
export const LEAVE_TYPE_COLORS = [
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

export const SHORT_MONTH_NAMES = [
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

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * Computes the API date boundaries (from, to) for a given date and view mode.
 */
export function getCalendarRange(currentDate, viewMode) {
  if (viewMode === "month") {
    const startOfMonth = currentDate.startOf("month");
    const start = startOfMonth.startOf("isoWeek");
    const endOfMonth = currentDate.endOf("month");
    const end = endOfMonth.endOf("isoWeek");
    return {
      from: start.format("YYYY-MM-DD"),
      to: end.format("YYYY-MM-DD"),
    };
  } else {
    const start = currentDate.startOf("isoWeek");
    const end = currentDate.endOf("isoWeek");
    return {
      from: start.format("YYYY-MM-DD"),
      to: end.format("YYYY-MM-DD"),
    };
  }
}

/**
 * Reusable Leave Calendar Component
 * Supporting Month & Week views, month/year picker popover, leave type filters,
 * pending requests toggling, and dedicated card rendering for both employee and manager roles.
 */
export default function LeaveCalendar({
  currentDate: controlledDate,
  onDateChange,
  viewMode: controlledViewMode,
  onViewModeChange,
  events = [],
  pendingRequests = [],
  leaveTypeOptions = [],
  loading = false,
  mode = "employee", // 'employee' | 'manager'
  onEventClick,
  renderWeekEmptyDay,
  selectedLeaveTypeId: controlledLeaveTypeId,
  onLeaveTypeIdChange,
  showPending: controlledShowPending,
  onShowPendingChange,
  extraToolbarActions,
}) {
  // Controlled vs uncontrolled state for currentDate
  const [internalDate, setInternalDate] = useState(() => dayjs());
  const currentDate = controlledDate ?? internalDate;
  const setCurrentDate = useCallback(
    (updater) => {
      const nextDate = typeof updater === "function" ? updater(currentDate) : updater;
      if (onDateChange) {
        onDateChange(nextDate);
      } else {
        setInternalDate(nextDate);
      }
    },
    [currentDate, onDateChange]
  );

  // Controlled vs uncontrolled state for viewMode ('month' | 'week')
  const [internalViewMode, setInternalViewMode] = useState("month");
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = useCallback(
    (modeVal) => {
      if (onViewModeChange) {
        onViewModeChange(modeVal);
      } else {
        setInternalViewMode(modeVal);
      }
    },
    [onViewModeChange]
  );

  // Leave Type Filter
  const [internalLeaveTypeId, setInternalLeaveTypeId] = useState("");
  const selectedLeaveTypeId = controlledLeaveTypeId ?? internalLeaveTypeId;
  const setSelectedLeaveTypeId = useCallback(
    (id) => {
      if (onLeaveTypeIdChange) {
        onLeaveTypeIdChange(id);
      } else {
        setInternalLeaveTypeId(id);
      }
    },
    [onLeaveTypeIdChange]
  );

  // Show Pending Toggle
  const [internalShowPending, setInternalShowPending] = useState(true);
  const showPending = controlledShowPending ?? internalShowPending;
  const setShowPending = useCallback(
    (val) => {
      if (onShowPendingChange) {
        onShowPendingChange(val);
      } else {
        setInternalShowPending(val);
      }
    },
    [onShowPendingChange]
  );

  // Month & Year Picker Popover state
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => currentDate.year());
  const pickerRef = useRef(null);

  // Sync pickerYear when currentDate year changes
  useEffect(() => {
    setPickerYear(currentDate.year());
  }, [currentDate]);

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

  // Query range helper
  const { from: queryFrom, to: queryTo } = useMemo(
    () => getCalendarRange(currentDate, viewMode),
    [currentDate, viewMode]
  );

  // Color mapping for leave types
  const colorMap = useMemo(() => {
    const map = {};
    leaveTypeOptions.forEach((type, idx) => {
      const palette = LEAVE_TYPE_COLORS[idx % LEAVE_TYPE_COLORS.length];
      map[type.id] = palette;
      map[type.name] = palette;
    });
    return map;
  }, [leaveTypeOptions]);

  const getColorForEvent = useCallback(
    (event) => {
      if (event.leaveTypeId && colorMap[event.leaveTypeId]) {
        return colorMap[event.leaveTypeId];
      }
      if (event.leaveTypeName && colorMap[event.leaveTypeName]) {
        return colorMap[event.leaveTypeName];
      }
      return LEAVE_TYPE_COLORS[0];
    },
    [colorMap]
  );

  // Filter events by leave type
  const filteredEvents = useMemo(() => {
    if (!selectedLeaveTypeId) return events;
    return events.filter((ev) => {
      const typeId = ev.leaveTypeId ?? ev.LeaveTypeId;
      return String(typeId) === String(selectedLeaveTypeId);
    });
  }, [events, selectedLeaveTypeId]);

  const filteredPending = useMemo(() => {
    if (!showPending) return [];
    if (!selectedLeaveTypeId) return pendingRequests;
    return pendingRequests.filter((req) => {
      const typeId = req.leaveTypeId ?? req.LeaveTypeId;
      return String(typeId) === String(selectedLeaveTypeId);
    });
  }, [pendingRequests, showPending, selectedLeaveTypeId]);

  // Navigation Handlers
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
    const now = dayjs();
    setCurrentDate(now);
    setPickerYear(now.year());
    setIsMonthPickerOpen(false);
  };

  const handleSelectMonth = (monthIndex) => {
    setCurrentDate((prev) => prev.year(pickerYear).month(monthIndex).date(1));
    setIsMonthPickerOpen(false);
  };

  // Calendar Weeks Calculation
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
      const result = [];

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
          result.push({
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
          const fromRaw = req.fromDate || req.FromDate;
          const toRaw = req.toDate || req.ToDate;
          if (!fromRaw || !toRaw) return;
          const evStart = dayjs(fromRaw).startOf("day");
          const evEnd = dayjs(toRaw).startOf("day");

          if (evStart.isSameOrBefore(weekEnd) && evEnd.isSameOrAfter(weekStart)) {
            const startIndex = Math.max(0, evStart.diff(weekStart, "day"));
            const endIndex = Math.min(6, evEnd.diff(weekStart, "day"));
            result.push({
              ...req,
              leaveRequestId: req.id,
              isPending: true,
              colStart: startIndex + 1,
              colSpan: endIndex - startIndex + 1,
              startsBefore: evStart.isBefore(weekStart),
              endsAfter: evEnd.isAfter(weekEnd),
            });
          }
        });
      }

      return result;
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm relative flex flex-col">
      {/* Toolbar */}
      <div className="p-4 md:px-6 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 bg-white relative rounded-t-2xl">
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
          <div className="relative ml-1 sm:ml-2" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white text-base md:text-lg font-bold text-slate-900 transition-all cursor-pointer group shadow-2xs"
            >
              <HiOutlineCalendar className="text-blue-600" size={19} />
              <span>{calendarTitle}</span>
              <HiOutlineChevronDown
                size={15}
                className={`text-slate-400 group-hover:text-blue-600 transition-transform ${
                  isMonthPickerOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {/* Month & Year Picker Dropdown Popover */}
            {isMonthPickerOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[100]">
                {/* Year Stepper */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
                      dayjs().month() === idx && dayjs().year() === pickerYear;

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
          {/* Include Pending Toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPending}
              onChange={(e) => setShowPending(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <span>
              Include Pending
              {pendingRequests.length > 0 && ` (${pendingRequests.length})`}
            </span>
          </label>

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

          {extraToolbarActions}
        </div>
      </div>

      {/* Calendar Body: Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-center">
        {viewMode === "month"
          ? WEEKDAYS.map((day, idx) => {
              const isWeekend = idx >= 5;
              return (
                <div
                  key={day}
                  className={`py-2 text-[11px] font-bold tracking-wider uppercase ${
                    isWeekend ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {day}
                </div>
              );
            })
          : calendarWeeks[0]?.days.map((day, idx) => {
              const isWeekend = idx >= 5;
              const isToday = day.isSame(dayjs(), "day");
              return (
                <div
                  key={day.format("YYYY-MM-DD")}
                  className={`py-3 px-2 flex flex-col items-center justify-center transition-colors ${
                    isToday
                      ? "bg-blue-50/50 text-blue-900 font-bold"
                      : isWeekend
                      ? "text-slate-400 bg-slate-50/60"
                      : "text-slate-700 bg-white"
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                    {WEEKDAYS[idx]}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`text-sm font-extrabold ${
                        isToday
                          ? "px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs"
                          : isWeekend
                          ? "text-slate-400"
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
        <div className="min-h-[500px] flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500">
              Loading calendar events...
            </span>
          </div>
        </div>
      ) : viewMode === "week" ? (
        /* ============================================================ */
        /* WEEK VIEW: Dedicated 7 Daily Schedule Columns               */
        /* ============================================================ */
        <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[460px] bg-white">
          {calendarWeeks[0]?.days.map((day, idx) => {
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
              const fromRaw = req.fromDate || req.FromDate;
              const toRaw = req.toDate || req.ToDate;
              if (!fromRaw || !toRaw) return false;
              const fromStr = dayjs(fromRaw).format("YYYY-MM-DD");
              const toStr = dayjs(toRaw).format("YYYY-MM-DD");
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
                    ? "bg-slate-50/60"
                    : isToday
                    ? "bg-blue-50/15"
                    : "bg-white"
                }`}
              >
                <div className="flex-1 flex flex-col">
                  {allDayEvents.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {allDayEvents.map((ev, i) => {
                        const color = getColorForEvent(ev);
                        const typeName = ev.leaveTypeName || "Leave";
                        const daysCount = ev.numberOfDays ?? 1;
                        const fromDay = dayjs(ev.fromDate || ev.FromDate);
                        const toDay = dayjs(ev.toDate || ev.ToDate);
                        const isMultiDay = daysCount > 1;
                        const employeeName = ev.employeeName;

                        return (
                          <div
                            key={`col-${ev.isPending ? "p" : "a"}-${ev.id || ev.leaveRequestId || i}`}
                            onClick={() => onEventClick?.(ev, ev.isPending)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xs ${
                              ev.isPending
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : `${color.bg} ${color.text} ${color.border}`
                            }`}
                          >
                            {/* Manager Mode: show employee name prominently */}
                            {mode === "manager" && employeeName && (
                              <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-black/5">
                                <span className="w-5 h-5 rounded-full bg-white/80 border border-slate-300/80 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {employeeName.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-bold text-xs truncate">
                                  {employeeName}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-1.5 gap-1">
                              <span className="font-bold truncate text-xs">
                                {typeName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  ev.isPending
                                    ? "bg-amber-200 text-amber-900 border border-amber-300"
                                    : "bg-white/90 text-slate-700 border border-slate-200/60"
                                }`}
                              >
                                {ev.isPending ? "Pending" : "Approved"}
                              </span>
                            </div>

                            <div className="text-[11px] font-medium opacity-85">
                              {isMultiDay ? (
                                <span>
                                  {daysCount} days ({fromDay.format("D MMM")} –{" "}
                                  {toDay.format("D MMM")})
                                </span>
                              ) : (
                                <span>1 working day</span>
                              )}
                            </div>

                            {ev.reason && (
                              <div className="mt-2 pt-1.5 border-t border-black/5 text-[11px] opacity-75 truncate italic">
                                &ldquo;{ev.reason}&rdquo;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] group/slot">
                      {isWeekend ? (
                        <span className="text-xs text-slate-300 font-medium select-none">
                          Weekend
                        </span>
                      ) : renderWeekEmptyDay ? (
                        renderWeekEmptyDay(dateStr, isWeekend)
                      ) : (
                        <span className="text-xs text-slate-300 font-medium select-none">
                          No leaves
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================ */
        /* MONTH VIEW: 5-6 Week Rows with Spanning Bars                */
        /* ============================================================ */
        <div className="flex flex-col divide-y divide-slate-100 min-h-[500px] bg-white">
          {calendarWeeks.map((week, wIdx) => {
            const weekEvents = getEventsForWeek(week.weekStart, week.weekEnd);

            return (
              <div
                key={`month-week-${wIdx}`}
                className="min-h-[110px] flex flex-col justify-between py-1.5 px-2 relative group transition-colors hover:bg-slate-50/20"
              >
                {/* Day Numbers row */}
                <div className="grid grid-cols-7 gap-1 mb-1.5">
                  {week.days.map((day) => {
                    const isCurrentMonth = day.month() === currentDate.month();
                    const isToday = day.isSame(dayjs(), "day");
                    const isWeekend = day.isoWeekday() >= 6;

                    return (
                      <div
                        key={day.format("YYYY-MM-DD")}
                        className="flex items-center justify-between px-1.5"
                      >
                        <span
                          className={`text-xs font-semibold ${
                            isToday
                              ? "w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold"
                              : !isCurrentMonth
                              ? "text-slate-300"
                              : isWeekend
                              ? "text-slate-400"
                              : "text-slate-700"
                          }`}
                        >
                          {day.format("D")}
                        </span>
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
                    const employeePrefix =
                      mode === "manager" && ev.employeeName
                        ? `${ev.employeeName}: `
                        : "";

                    return (
                      <button
                        key={`bar-${ev.isPending ? "p" : "a"}-${reqId}-${wIdx}-${i}`}
                        type="button"
                        onClick={() => onEventClick?.(ev, ev.isPending)}
                        style={{
                          gridColumn: `${ev.colStart} / span ${ev.colSpan}`,
                        }}
                        className={`h-6.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-between truncate transition-transform hover:scale-[1.01] cursor-pointer shadow-2xs ${
                          ev.isPending
                            ? "bg-amber-50 text-amber-900 border border-dashed border-amber-400"
                            : `${color.bg} ${color.text} border ${color.border}`
                        }`}
                        title={`${employeePrefix}${typeName} (${daysCount} days) · ${
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
                          <span className="truncate font-semibold">
                            {mode === "manager" && ev.employeeName && (
                              <strong className="font-bold mr-1">
                                {ev.employeeName}:
                              </strong>
                            )}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Summary Footer */}
      <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 rounded-b-2xl">
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
  );
}
