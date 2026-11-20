import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import {
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

import leaveApi from "../../api/leaveApi";
import LeaveCalendar, {
  getCalendarRange,
} from "../../components/leave/LeaveCalendar";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import RejectLeaveDialog from "../../components/leave/RejectLeaveDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function ManagerTeamCalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => dayjs());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week'
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [showPending, setShowPending] = useState(true);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Drawer & Dialog states
  const [activeRequest, setActiveRequest] = useState(null);
  const [approveDialogState, setApproveDialogState] = useState({
    open: false,
    request: null,
    loading: false,
  });
  const [rejectDialogState, setRejectDialogState] = useState({
    open: false,
    request: null,
    loading: false,
    error: "",
  });

  // 1. Load active leave types & pending requests from team
  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await leaveApi.getTeamRequests({ pageSize: 100, status: "Pending" });
      const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setPendingRequests(list.filter((r) => r.status === "Pending"));
    } catch (err) {
      console.error("Failed to load team pending requests:", err);
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

  // 3. Fetch approved calendar items for team
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

  // Open drawer on click
  const handleEventClick = async (event, isPending = false) => {
    const reqId = event.leaveRequestId || event.id;
    try {
      const detailed = await leaveApi.getTeamRequestById(reqId);
      setActiveRequest(detailed);
    } catch {
      setActiveRequest({
        id: reqId,
        employeeName: event.employeeName || "Team Member",
        employeeCode: event.employeeCode || "",
        leaveTypeName: event.leaveTypeName,
        status: isPending ? "Pending" : event.status || "Approved",
        fromDate: event.fromDate || event.FromDate,
        toDate: event.toDate || event.ToDate,
        numberOfDays: event.numberOfDays,
        reason: event.reason || (isPending ? "Pending Approval" : "Approved Leave"),
      });
    }
  };

  // Approve from Drawer
  const handleOpenApprove = (req) => {
    setApproveDialogState({
      open: true,
      request: req,
      loading: false,
    });
  };

  const handleConfirmApprove = async () => {
    const req = approveDialogState.request;
    if (!req) return;

    try {
      setApproveDialogState((prev) => ({ ...prev, loading: true }));
      await leaveApi.approveTeamRequest(req.id);

      setFeedback({
        type: "success",
        message: `Leave request for ${req.employeeName} approved successfully.`,
      });

      setApproveDialogState({ open: false, request: null, loading: false });
      setActiveRequest(null);
      window.dispatchEvent(new CustomEvent("team-requests-updated"));
      fetchPendingRequests();
      fetchEvents();
    } catch (err) {
      console.error("Failed to approve request:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to approve leave request.",
      });
      setApproveDialogState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Reject from Drawer
  const handleOpenReject = (req) => {
    setRejectDialogState({
      open: true,
      request: req,
      loading: false,
      error: "",
    });
  };

  const handleConfirmReject = async (requestId, reason) => {
    const req = rejectDialogState.request;
    try {
      setRejectDialogState((prev) => ({ ...prev, loading: true, error: "" }));
      await leaveApi.rejectTeamRequest(requestId, reason);

      setFeedback({
        type: "success",
        message: `Leave request for ${req?.employeeName || "employee"} has been rejected.`,
      });

      setRejectDialogState({ open: false, request: null, loading: false, error: "" });
      if (activeRequest?.id === requestId) {
        setActiveRequest(null);
      }
      refreshCalendar();
    } catch (err) {
      console.error("Failed to reject request:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to reject leave request.";
      setFeedback({
        type: "error",
        message: msg,
      });
      setRejectDialogState((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
            Team Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track planned and pending leaves across all members of your team.
          </p>
        </div>
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

      {/* Reusable Leave Calendar (Manager Mode) */}
      <LeaveCalendar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        events={calendarEvents}
        pendingRequests={pendingRequests}
        leaveTypeOptions={leaveTypeOptions}
        loading={loading}
        mode="manager"
        selectedLeaveTypeId={selectedLeaveTypeId}
        onLeaveTypeIdChange={setSelectedLeaveTypeId}
        showPending={showPending}
        onShowPendingChange={setShowPending}
        onEventClick={handleEventClick}
        renderWeekEmptyDay={() => (
          <span className="text-xs text-slate-300 font-medium select-none">
            No leaves
          </span>
        )}
      />

      {/* Details Slide-Over Drawer */}
      <LeaveDetailsDrawer
        open={Boolean(activeRequest)}
        request={activeRequest}
        mode="manager"
        onClose={() => setActiveRequest(null)}
        onApprove={(req) => handleOpenApprove(req)}
        onReject={(req) => handleOpenReject(req)}
      />

      {/* Approval Confirmation Dialog */}
      <ConfirmDialog
        open={approveDialogState.open}
        title="Do you want to approve this Leave?"
        message={
          approveDialogState.request
            ? `${approveDialogState.request.employeeName}, ${approveDialogState.request.leaveTypeName} (${approveDialogState.request.numberOfDays} working days). This leave will be moved from pending to used.`
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

      {/* Rejection Dialog */}
      <RejectLeaveDialog
        open={rejectDialogState.open}
        request={rejectDialogState.request}
        loading={rejectDialogState.loading}
        apiError={rejectDialogState.error}
        onConfirm={handleConfirmReject}
        onCancel={() =>
          setRejectDialogState({ open: false, request: null, loading: false, error: "" })
        }
      />
    </div>
  );
}
