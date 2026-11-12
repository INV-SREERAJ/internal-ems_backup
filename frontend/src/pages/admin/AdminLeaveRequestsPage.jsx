import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dayjs from "dayjs";
import {
  HiOutlineChevronDown,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineInbox,
} from "react-icons/hi2";

import adminApi from "../../api/adminApi";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import RejectLeaveDialog from "../../components/leave/RejectLeaveDialog";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import { formatLeaveDateRange } from "../../utils/dateUtils";

export default function AdminLeaveRequestsPage() {
  const currentYear = useMemo(() => dayjs().year(), []);

  // Filter states (defaults to "Pending" matching wireframe)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const datePickerRef = useRef(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data states
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Drawer states
  const [drawerRequest, setDrawerRequest] = useState(null);
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

  // Toast feedback
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4500);
  };

  // Close date popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target)
      ) {
        setDatePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Year options: current year - 3 to current year + 1
  const yearOptions = useMemo(() => {
    return [
      currentYear + 1,
      currentYear,
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
    ];
  }, [currentYear]);

  // 1. Fetch leave types for dropdown
  useEffect(() => {
    adminApi
      .getLeaveTypes(false)
      .then((types) => {
        setLeaveTypes(Array.isArray(types) ? types : []);
      })
      .catch((err) => {
        console.error("Failed to fetch leave types:", err);
      });
  }, []);

  // 2. Fetch leave requests from backend
  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        pageSize,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (selectedStatus && selectedStatus !== "All") {
        params.status = selectedStatus;
      }
      if (selectedLeaveTypeId) {
        params.leaveTypeId = parseInt(selectedLeaveTypeId, 10);
      }
      if (selectedYear && selectedYear !== "All") {
        params.year = parseInt(selectedYear, 10);
      }
      if (fromDate) {
        params.fromDate = fromDate;
      }
      if (toDate) {
        params.toDate = toDate;
      }

      const res = await adminApi.getLeaveRequests(params);
      const items = Array.isArray(res?.data) ? res.data : [];
      setRequests(items);
      setTotalCount(res?.totalCount ?? items.length);
      setTotalPages(res?.totalPages ?? Math.max(1, Math.ceil((res?.totalCount ?? items.length) / pageSize)));
    } catch (err) {
      console.error("Failed to load leave requests:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load leave requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    debouncedSearch,
    selectedStatus,
    selectedLeaveTypeId,
    selectedYear,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  // Approve action handler
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
      if (drawerRequest && drawerRequest.id === target.id) {
        setDrawerRequest(null);
      }
      fetchLeaveRequests();
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

  // Reject action handler
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
      if (drawerRequest && drawerRequest.id === target.id) {
        setDrawerRequest(null);
      }
      fetchLeaveRequests();
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

  // Clear date range
  const handleClearDates = () => {
    setFromDate("");
    setToDate("");
    setPage(1);
    setDatePopoverOpen(false);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Toast Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {feedback.type === "success" ? (
              <HiOutlineCheckCircle size={20} className="text-emerald-600" />
            ) : (
              <HiOutlineExclamationCircle size={20} className="text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <HiOutlineXMark size={16} />
          </button>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Leave Requests
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {selectedStatus === "Pending"
            ? "Pending requests awaiting a decision. Change the status filter to see all requests."
            : "Review, approve, or reject employee leave requests across the organization."}
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-4 md:px-6 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
          {/* 1. Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, reason"
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HiOutlineXMark size={14} />
              </button>
            )}
          </div>

          {/* 2. Leave Types Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedLeaveTypeId}
              onChange={(e) => {
                setSelectedLeaveTypeId(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 font-medium outline-none cursor-pointer transition-all"
            >
              <option value="">All leave types</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* 3. Status Dropdown */}
          <div className="relative min-w-[120px]">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 font-medium outline-none cursor-pointer transition-all"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
              <option value="All">All statuses</option>
            </select>
            <HiOutlineChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* 4. Year Dropdown */}
          <div className="relative min-w-[90px]">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 font-medium outline-none cursor-pointer transition-all"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              <option value="All">All years</option>
            </select>
            <HiOutlineChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* 5. Date Range Filter Popover */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setDatePopoverOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                fromDate || toDate
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <HiOutlineCalendar size={14} className="text-slate-400 shrink-0" />
              <span>
                {fromDate && toDate
                  ? `${dayjs(fromDate).format("DD MMM")} – ${dayjs(toDate).format("DD MMM")}`
                  : fromDate
                  ? `From ${dayjs(fromDate).format("DD MMM")}`
                  : toDate
                  ? `Until ${dayjs(toDate).format("DD MMM")}`
                  : "Date range"}
              </span>
              <HiOutlineChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>

            {datePopoverOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 p-4 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 flex flex-col gap-3 [animation:slideUp_0.15s_ease]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Filter by Dates
                  </span>
                  {(fromDate || toDate) && (
                    <button
                      type="button"
                      onClick={handleClearDates}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setDatePopoverOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Content Area */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading leave requests...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <p className="text-xs font-semibold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={fetchLeaveRequests}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-24 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <HiOutlineInbox size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              No leave requests found
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {selectedStatus === "Pending"
                ? "There are currently no pending requests awaiting a decision."
                : "Try adjusting your filters or search keywords."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 md:px-6">Employee</th>
                  <th className="py-3 px-4">Leave type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied on</th>
                  <th className="py-3 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Employee */}
                    <td className="py-3.5 px-4 md:px-6 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-slate-900 leading-snug">
                          {req.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {req.employeeCode}
                        </div>
                      </div>
                    </td>

                    {/* Leave type */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {req.leaveTypeName}
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      {formatLeaveDateRange(req.fromDate, req.toDate)}
                    </td>

                    {/* Days */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold">
                      {req.numberOfDays}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <LeaveStatusBadge status={req.status} variant="solid" />
                    </td>

                    {/* Applied on */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {dayjs(req.createdAt).format("DD MMM YYYY")}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 md:px-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === "Pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenApprove(req)}
                              className="px-2.5 py-1 rounded-md border border-emerald-600 text-emerald-600 hover:bg-emerald-50 active:scale-[0.98] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(req)}
                              className="px-2.5 py-1 rounded-md border border-rose-500 text-rose-600 hover:bg-rose-50 active:scale-[0.98] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setDrawerRequest(req)}
                              className="px-2.5 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-[0.98] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDrawerRequest(req)}
                            className="px-2.5 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-[0.98] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Pagination */}
        {!loading && requests.length > 0 && (
          <div className="p-4 md:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-white">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–
              {Math.min(page * pageSize, totalCount)} of {totalCount}{" "}
              {selectedStatus === "Pending" ? "pending" : "requests"}
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
      </div>

      {/* Slide-Over Drawer Details */}
      <LeaveDetailsDrawer
        open={Boolean(drawerRequest)}
        request={drawerRequest}
        mode="admin"
        onClose={() => setDrawerRequest(null)}
        onApprove={(req) => {
          handleOpenApprove(req);
        }}
        onReject={(req) => {
          handleOpenReject(req);
        }}
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

