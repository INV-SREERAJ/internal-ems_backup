import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import {
  HiOutlineMagnifyingGlass,
  HiChevronRight,
  HiOutlineChevronDown,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

import leaveApi from "../../api/leaveApi";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import RejectLeaveDialog from "../../components/leave/RejectLeaveDialog";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import { formatLeaveDateRange } from "../../utils/dateUtils";

export default function ManagerAllLeavesPage() {
  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Data states
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [leaveTypes, setLeaveTypes] = useState([]);
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
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load active leave types
  useEffect(() => {
    let mounted = true;
    async function loadLeaveTypes() {
      try {
        const types = await leaveApi.getLeaveTypeOptions();
        if (mounted && Array.isArray(types)) {
          setLeaveTypes(types);
        }
      } catch (err) {
        console.error("Failed to load leave types:", err);
      }
    }
    loadLeaveTypes();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch all team requests with filters
  const fetchAllRequests = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        page,
        pageSize,
      };

      if (debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim();
      }
      if (selectedStatus) {
        filters.status = selectedStatus;
      }
      if (selectedLeaveTypeId) {
        filters.leaveTypeId = Number(selectedLeaveTypeId);
      }
      if (fromDate) {
        filters.fromDate = fromDate;
      }
      if (toDate) {
        filters.toDate = toDate;
      }

      const res = await leaveApi.getTeamRequests(filters);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setRequests(items);
      setTotalCount(res?.totalCount ?? items.length);
      setTotalPages(res?.totalPages ?? Math.max(1, Math.ceil((res?.totalCount ?? items.length) / pageSize)));
    } catch (err) {
      console.error("Failed to fetch all team requests:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to load team leave records.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedStatus, selectedLeaveTypeId, fromDate, toDate]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  // Handle Approve
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
      if (activeRequest?.id === req.id) {
        setActiveRequest(null);
      }
      window.dispatchEvent(new CustomEvent("team-requests-updated"));
      fetchAllRequests();
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

  // Handle Reject
  const handleOpenReject = (req) => {
    setRejectDialogState({
      open: true,
      request: req,
      loading: false,
    });
  };

  const handleConfirmReject = async (requestId, reason) => {
    const req = rejectDialogState.request;
    try {
      setRejectDialogState((prev) => ({ ...prev, loading: true }));
      await leaveApi.rejectTeamRequest(requestId, reason);

      setFeedback({
        type: "success",
        message: `Leave request for ${req?.employeeName || "employee"} has been rejected.`,
      });

      setRejectDialogState({ open: false, request: null, loading: false });
      if (activeRequest?.id === requestId) {
        setActiveRequest(null);
      }
      window.dispatchEvent(new CustomEvent("team-requests-updated"));
      fetchAllRequests();
    } catch (err) {
      console.error("Failed to reject request:", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to reject leave request.",
      });
      setRejectDialogState((prev) => ({ ...prev, loading: false }));
    }
  };

  const approvalConfirmMessage = useMemo(() => {
    const req = approveDialogState.request;
    if (!req) return "";
    const firstName = req.employeeName ? req.employeeName.split(" ")[0] : "Employee";
    const dateStr = formatLeaveDateRange(req.fromDate, req.toDate);
    const daysStr = `${req.numberOfDays} working ${req.numberOfDays === 1 ? "day" : "days"}`;
    return `${firstName}, ${req.leaveTypeName} ${dateStr} (${daysStr}). This leave will be moved from pending to used.`;
  }, [approveDialogState.request]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-8 font-sans">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
          All Team Leaves
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete history and records of all leave requests from your reporting team.
        </p>
      </div>

      {/* Global Feedback Alert */}
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

      {/* Main Card */}
      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-5 md:p-6 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[260px]">
              <HiOutlineMagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, type or reason"
                className="w-full box-border pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[140px]">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 pr-9 text-sm text-slate-800 outline-none cursor-pointer transition-all"
              >
                <option value="">Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <HiOutlineChevronDown
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Leave Type Select */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedLeaveTypeId}
                onChange={(e) => {
                  setSelectedLeaveTypeId(e.target.value);
                  setPage(1);
                }}
                className="appearance-none w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 pr-9 text-sm text-slate-800 outline-none cursor-pointer transition-all"
              >
                <option value="">All leave types</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                title="From date"
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none transition-all"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                title="To date"
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none transition-all"
              />

              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[8%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-6 text-left">EMPLOYEE</th>
                <th className="py-3.5 px-6 text-left">LEAVE TYPE</th>
                <th className="py-3.5 px-6 text-left">DATES</th>
                <th className="py-3.5 px-6 text-left">DAYS</th>
                <th className="py-3.5 px-6 text-left">APPLIED ON</th>
                <th className="py-3.5 px-6 text-left">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading team leaves...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                        <HiOutlineCalendar size={22} />
                      </div>
                      <p className="text-base font-semibold text-slate-800 m-0">
                        No leave records found
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Try clearing or modifying your filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setActiveRequest(req)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-left">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {req.employeeName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {req.employeeCode}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-left text-slate-800 font-medium truncate">
                      {req.leaveTypeName}
                    </td>

                    <td className="py-4 px-6 text-left text-slate-700 whitespace-nowrap">
                      {formatLeaveDateRange(req.fromDate, req.toDate)}
                    </td>

                    <td className="py-4 px-6 text-left font-semibold text-slate-800">
                      {req.numberOfDays}
                    </td>

                    <td className="py-4 px-6 text-left text-slate-500 whitespace-nowrap text-xs">
                      {dayjs(req.createdAt).format("D MMM YYYY")}
                    </td>

                    <td className="py-4 px-6 text-left whitespace-nowrap">
                      <LeaveStatusBadge status={req.status} variant="subtle" />
                    </td>

                    <td
                      className="py-4 px-6 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-2">
                        {req.status === "Pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenApprove(req)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(req)}
                              className="px-3 py-1 rounded-lg border border-rose-300 hover:border-rose-400 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setActiveRequest(req)}
                          title="View details"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <HiChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!loading && requests.length > 0 && (
          <div className="p-4 md:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–
              {Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>

            {totalPages > 1 && (
              <Pagination
                pageNumber={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </div>
        )}
      </section>

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
        message={approvalConfirmMessage}
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
        onConfirm={handleConfirmReject}
        onCancel={() =>
          setRejectDialogState({ open: false, request: null, loading: false })
        }
      />
    </div>
  );
}

