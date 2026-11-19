import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
} from "react-icons/hi2";

import leaveApi from "../../api/leaveApi";
import LeaveBalanceDonut from "../../components/leave/LeaveBalanceDonut";

/**
 * Custom Calendar Header for MUI DatePicker
 * - Locks navigation strictly to the current leave year (no year picker).
 * - Provides a dropdown menu of upcoming months of the leave year.
 * - Prev/Next month navigation buttons with boundary checks.
 */
function LeaveCalendarHeader(props) {
  const { currentMonth, onMonthChange, minDate, maxDate } = props;
  const currentLeaveYear = minDate ? minDate.year() : dayjs().year();

  const minMonth = minDate ? minDate.month() : 0;
  const maxMonth = maxDate ? maxDate.month() : 11;

  const upcomingMonths = useMemo(() => {
    const list = [];
    for (let m = minMonth; m <= maxMonth; m++) {
      list.push({
        value: m,
        label: dayjs().month(m).format("MMMM"),
      });
    }
    return list;
  }, [minMonth, maxMonth]);

  const canGoPrev = minDate
    ? currentMonth.isAfter(minDate.startOf("month"))
    : true;
  const canGoNext = maxDate
    ? currentMonth.isBefore(maxDate.startOf("month"))
    : true;

  const handlePrev = () => {
    if (canGoPrev) {
      onMonthChange(currentMonth.subtract(1, "month"), "left");
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onMonthChange(currentMonth.add(1, "month"), "right");
    }
  };

  const handleMonthSelect = (e) => {
    const selectedMonth = Number(e.target.value);
    onMonthChange(currentMonth.month(selectedMonth), "center");
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-white">
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canGoPrev}
        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Previous Month"
      >
        <HiOutlineChevronLeft size={16} />
      </button>

      {/* Month Dropdown + Constant Leave Year */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={currentMonth.month()}
            onChange={handleMonthSelect}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-1 pr-7 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors"
          >
            {upcomingMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <HiOutlineChevronDown
            size={12}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Constant Year (Non-editable, current leave year only) */}
        <span className="text-xs font-bold text-slate-700 tracking-wide select-none px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
          {currentLeaveYear}
        </span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext}
        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Next Month"
      >
        <HiOutlineChevronRight size={16} />
      </button>
    </div>
  );
}

export default function ApplyLeavePage() {
  const navigate = useNavigate();

  // State
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [manager, setManager] = useState(null);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("fromDate");
    return p && dayjs(p).isValid() ? dayjs(p) : null;
  });
  const [toDate, setToDate] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("fromDate");
    return p && dayjs(p).isValid() ? dayjs(p) : null;
  });
  const [reason, setReason] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load leave types, user balances and manager info from backend
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoadingInitial(true);
        const currentYear = new Date().getFullYear();

        const [typesRes, balancesRes, managerRes] = await Promise.allSettled([
          leaveApi.getLeaveTypeOptions(),
          leaveApi.getMyBalances(currentYear),
          leaveApi.getMyManager(),
        ]);

        if (mounted) {
          // Leave types options from backend
          if (typesRes.status === "fulfilled" && Array.isArray(typesRes.value)) {
            setLeaveTypes(typesRes.value);
            // Leave types dropdown defaults to empty placeholder ("Select a leave type")
            setSelectedLeaveTypeId("");
          }

          // Leave balances for current user
          if (balancesRes.status === "fulfilled" && Array.isArray(balancesRes.value)) {
            setBalances(balancesRes.value);
          }

          // Reporting manager info
          if (managerRes.status === "fulfilled" && managerRes.value) {
            setManager(managerRes.value);
          }
        }
      } catch (err) {
        console.error("Error loading leave apply data:", err);
      } finally {
        if (mounted) {
          setLoadingInitial(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter leave types to only those that have an active configuration and balance for this year
  const availableLeaveTypes = useMemo(() => {
    return leaveTypes.filter((type) =>
      balances.some((b) => b.leaveTypeId === type.id)
    );
  }, [leaveTypes, balances]);

  // Currently selected leave type object from availableLeaveTypes list
  const selectedType = useMemo(() => {
    if (!selectedLeaveTypeId) return null;
    return availableLeaveTypes.find((t) => String(t.id) === String(selectedLeaveTypeId)) || null;
  }, [availableLeaveTypes, selectedLeaveTypeId]);

  // Balance record for selected leave type (if any)
  const selectedBalance = useMemo(() => {
    if (!selectedLeaveTypeId) return null;
    return (
      balances.find((b) => String(b.leaveTypeId) === String(selectedLeaveTypeId)) || null
    );
  }, [balances, selectedLeaveTypeId]);

  // Calculate working days count (skipping Saturdays and Sundays)
  const workingDaysCount = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    if (!fromDate.isValid() || !toDate.isValid()) return 0;
    if (toDate.isBefore(fromDate, "day")) return 0;

    let count = 0;
    let curr = fromDate.startOf("day");
    const end = toDate.startOf("day");

    while (curr.isBefore(end) || curr.isSame(end, "day")) {
      const dayOfWeek = curr.day(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek > 0 && dayOfWeek < 6) {
        count++;
      }
      curr = curr.add(1, "day");
    }
    console.log(count);
    return count;

  }, [fromDate, toDate]);

  // Reference today's date start of day & end of leave year
  const today = useMemo(() => dayjs().startOf("day"), []);
  const endOfLeaveYear = useMemo(() => today.endOf("year"), [today]);

  // Validation
  const validationError = useMemo(() => {
    if (!selectedLeaveTypeId) return "Please choose a leave type.";
    if (!fromDate) return "Please choose a start date.";
    if (!fromDate.isValid()) return "Please enter a valid start date.";
    if (fromDate.isBefore(today, "day")) return "Cannot apply leave for previous dates.";
    if (!toDate) return "Please choose an end date.";
    if (!toDate.isValid()) return "Please enter a valid end date.";
    if (toDate.isBefore(fromDate, "day"))
      return "End date cannot be earlier than start date.";
    if (fromDate.year() !== toDate.year())
      return "Leave dates must be within the same calendar year.";
    if (workingDaysCount === 0)
      return "The selected date range contains no working days (weekends only).";
    if (!selectedBalance)
      return "Selected leave type is not active or configured for this year.";
    if (workingDaysCount > selectedBalance.availableDays)
      return `Insufficient balance: You only have ${selectedBalance.availableDays} day(s) available.`;
    if (!reason.trim()) return "Please provide a reason for your leave request.";
    return null;
  }, [
    selectedLeaveTypeId,
    fromDate,
    toDate,
    workingDaysCount,
    selectedBalance,
    reason,
  ]);

  const handleClear = () => {
    setSelectedLeaveTypeId("");
    setFromDate(null);
    setToDate(null);
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leaveTypeId: Number(selectedLeaveTypeId),
        fromDate: fromDate.format("YYYY-MM-DD"),
        toDate: toDate.format("YYYY-MM-DD"),
        reason: reason.trim(),
      };

      await leaveApi.applyLeave(payload);
      setSuccessMessage("Leave application submitted successfully!");

      // Refresh balances from backend
      const currentYear = new Date().getFullYear();
      const updatedBalances = await leaveApi.getMyBalances(currentYear);
      setBalances(updatedBalances);

      // Reset dates & reason
      setFromDate(null);
      setToDate(null);
      setReason("");

      // Redirect after brief notification
      setTimeout(() => {
        navigate("/employee/leaves");
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to submit leave request. Please check your inputs.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Manager display name
  const managerDisplayName = useMemo(() => {
    if (!manager) return "Your reporting manager";
    return manager.managerName || "Your reporting manager";
  }, [manager]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-full max-w-[1280px] mx-auto px-4 py-6 md:px-8 md:py-8 font-sans">
        {/* Breadcrumb Header */}
        <div className="mb-6">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-2">
            <Link
              to="/employee/leaves"
              className="hover:underline text-blue-600 no-underline"
            >
              My Leaves
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">Apply for Leave</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
            Apply for Leave
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick a leave type and dates. Weekends are skipped automatically, and your request goes to{" "}
            <span className="font-semibold text-slate-700">{managerDisplayName}</span> for approval.
          </p>
        </div>

        {/* Global Feedback Banners */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <HiOutlineExclamationCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            <HiOutlineCheckCircle size={20} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main 2-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Apply Form */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* 1. Leave Type (Fetched directly from backend options & balances) */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  1. Leave type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedLeaveTypeId}
                    onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                    disabled={loadingInitial || submitting}
                    className="w-full appearance-none bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingInitial ? "Loading leave types..." : "Select a leave type"}
                    </option>
                    {availableLeaveTypes.map((type) => {
                      const bal = balances.find((b) => b.leaveTypeId === type.id);
                      const label = bal
                        ? `${type.name} (${bal.availableDays} days available)`
                        : type.name;
                      return (
                        <option key={type.id} value={type.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Only active leave types are listed.
                </p>
              </div>

              {/* 2. Dates with working day count badge only */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  2. Dates <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* From Date */}
                  <div className="sm:col-span-5">
                    <span className="block text-xs font-medium text-slate-500 mb-1">
                      From
                    </span>
                    <DatePicker
                      value={fromDate}
                      format="DD/MM/YYYY"
                      minDate={today}
                      maxDate={endOfLeaveYear}
                      views={["day"]}
                      slots={{
                        calendarHeader: LeaveCalendarHeader,
                      }}
                      onChange={(newVal) => {
                        setFromDate(newVal);
                        // If toDate is earlier than new fromDate, align or reset toDate
                        if (toDate && newVal && toDate.isBefore(newVal, "day")) {
                          setToDate(newVal);
                        }
                      }}
                      disabled={submitting}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          placeholder: "dd/mm/yyyy",
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "0.75rem",
                              backgroundColor: "#ffffff",
                              fontSize: "0.875rem",
                              "&:hover fieldset": { borderColor: "#94a3b8" },
                              "&.Mui-focused fieldset": { borderColor: "#2563eb" },
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* To Date */}
                  <div className="sm:col-span-5">
                    <span className="block text-xs font-medium text-slate-500 mb-1">
                      To
                    </span>
                    <DatePicker
                      value={toDate}
                      format="DD/MM/YYYY"
                      minDate={fromDate || today}
                      maxDate={endOfLeaveYear}
                      views={["day"]}
                      slots={{
                        calendarHeader: LeaveCalendarHeader,
                      }}
                      onChange={(newVal) => setToDate(newVal)}
                      disabled={submitting}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          placeholder: "dd/mm/yyyy",
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "0.75rem",
                              backgroundColor: "#ffffff",
                              fontSize: "0.875rem",
                              "&:hover fieldset": { borderColor: "#94a3b8" },
                              "&.Mui-focused fieldset": { borderColor: "#2563eb" },
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Number of days badge only (no individual date tiles) */}
                  <div className="sm:col-span-2">
                    <div className="h-10 box-border px-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center gap-1.5 text-blue-700 font-semibold text-xs whitespace-nowrap shadow-xs">
                      <HiOutlineClock size={16} className="shrink-0" />
                      <span>
                        {workingDaysCount}{" "}
                        {workingDaysCount === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Applicable for leave year {today.year()} only. Jump between upcoming months directly using the calendar menu.
                </p>
              </div>

              {/* 3. Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  3. Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  maxLength={500}
                  disabled={submitting}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly tell your manager why you need this leave"
                  className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl p-3.5 text-sm text-slate-800 outline-none transition-all resize-y placeholder:text-slate-400 disabled:bg-slate-50"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>Required</span>
                  <span>{reason.length} / 500</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400 italic">
                  {validationError || "Ready to submit"}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !!validationError}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit request"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Previews and Info Cards */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            {/* 1. Balance Preview Card (Donut ring) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h3 className="m-0 text-sm font-semibold text-slate-900 mb-4 tracking-tight">
                Balance preview
              </h3>
              <LeaveBalanceDonut
                balance={selectedBalance}
                leaveTypeName={selectedType?.name || ""}
                requestedDays={workingDaysCount}
              />
            </div>

            {/* 2. Request Summary Card (Navy Dark Theme) */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="m-0 text-sm font-semibold text-slate-100 mb-4 tracking-tight">
                Request summary
              </h3>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Leave type</span>
                  <span className="font-medium text-slate-200">
                    {selectedType?.name || selectedBalance?.leaveTypeName || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dates</span>
                  <span className="font-medium text-slate-200">
                    {fromDate && toDate && fromDate.isValid() && toDate.isValid()
                      ? `${fromDate.format("D MMM YYYY")} - ${toDate.format("D MMM YYYY")}`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Working days</span>
                  <span className="font-medium text-slate-200">
                    {workingDaysCount > 0 ? workingDaysCount : "—"}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Goes to</span>
                  <span className="font-medium text-slate-100">
                    {managerDisplayName}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Good to know Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-xs text-slate-600">
              <h3 className="m-0 text-sm font-semibold text-slate-900 mb-3 tracking-tight">
                Good to know
              </h3>
              <ul className="m-0 p-0 pl-4 list-disc space-y-2 leading-relaxed text-slate-600">
                <li>Saturdays and Sundays are not counted.</li>
                <li>A request must stay within one calendar year.</li>
                <li>You can't overlap a pending or approved request.</li>
                <li>You can cancel a request while it is still pending.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}
