import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import leaveApi from "../../api/leaveApi";
import LeaveCalendar, {
  getCalendarRange,
} from "../../components/leave/LeaveCalendar";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => dayjs());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week'
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [showPending, setShowPending] = useState(true);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer for inspecting an event
  const [activeRequest, setActiveRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [cancelling, setCancelling] = useState(false);

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
        const types = await leaveApi.getLeaveTypeOptions(false);
        if (mounted && Array.isArray(types)) {
          setLeaveTypeOptions(types);
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
  const { from: queryFrom, to: queryTo } = useMemo(
    () => getCalendarRange(currentDate, viewMode),
    [currentDate, viewMode]
  );

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
        fromDate: event.fromDate || event.FromDate,
        toDate: event.toDate || event.ToDate,
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
      <LeaveCalendar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        events={calendarEvents}
        pendingRequests={pendingRequests}
        leaveTypeOptions={leaveTypeOptions}
        loading={loading}
        mode="employee"
        selectedLeaveTypeId={selectedLeaveTypeId}
        onLeaveTypeIdChange={setSelectedLeaveTypeId}
        showPending={showPending}
        onShowPendingChange={setShowPending}
        onEventClick={handleEventClick}
        renderWeekEmptyDay={(dateStr) => (
          <>
            <span className="text-xs text-slate-300 font-medium group-hover/slot:hidden select-none">
              No leaves
            </span>
            <Link
              to={`/employee/leaves/apply?fromDate=${dateStr}`}
              className="hidden group-hover/slot:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors no-underline shadow-2xs"
            >
              + Apply
            </Link>
          </>
        )}
      />

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
