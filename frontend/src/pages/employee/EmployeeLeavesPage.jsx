import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

import leaveApi from "../../api/leaveApi";
import LeaveBalanceCard from "../../components/leave/LeaveBalanceCard";
import LeaveDetailsDrawer from "../../components/leave/LeaveDetailsDrawer";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";

export default function EmployeeLeavesPage() {
  // Filters & Pagination State
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [search, setSearch] = useState("");
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Data State
  const [balances, setBalances] = useState([]);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Loaders & feedback
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Drawer & Cancel Modal State
  const [activeRequest, setActiveRequest] = useState(null);
  const [cancelModalState, setCancelModalState] = useState({
    open: false,
    request: null,
    loading: false,
  });

  // 1. Initial Load: Years, Leave Types, Manager
  const [manager, setManager] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const [yearsRes, typesRes, managerRes] = await Promise.allSettled([
          leaveApi.getMyYears(),
          leaveApi.getLeaveTypeOptions(),
          leaveApi.getMyManager(),
        ]);

        if (mounted) {
          if (yearsRes.status === "fulfilled" && yearsRes.value?.years) {
            const yrs = yearsRes.value.years;
            if (Array.isArray(yrs) && yrs.length > 0) {
              setAvailableYears(yrs);
              if (!yrs.includes(selectedYear)) {
                setSelectedYear(yrs[0]);
              }
            }
          }

          if (typesRes.status === "fulfilled" && Array.isArray(typesRes.value)) {
            setLeaveTypeOptions(typesRes.value);
          }

          if (managerRes.status === "fulfilled" && managerRes.value) {
            setManager(managerRes.value);
          }
        }
      } catch (err) {
        console.error("Error loading initial leave config:", err);
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Balances whenever selectedYear changes
  const fetchBalances = useCallback(async () => {
    try {
      setLoadingBalances(true);
      const data = await leaveApi.getMyBalances(selectedYear);
      if (Array.isArray(data)) {
        setBalances(data);
      }
    } catch (err) {
      console.error("Failed to fetch leave balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // 3. Fetch Requests (paginated, filtered)
  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const params = {
        page,
        pageSize,
        year: selectedYear,
      };

      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedLeaveTypeId) {
        params.leaveTypeId = Number(selectedLeaveTypeId);
      }

      const res = await leaveApi.getMyRequests(params);
      // Backend returns PagedResponse with property .data (or .items)
      const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
      const count = res?.totalCount ?? list.length;
      setRequests(list);
      setTotalCount(count);
    } catch (err) {
      console.error("Failed to fetch leave requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [page, pageSize, selectedYear, search, selectedLeaveTypeId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Search Input Debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setSelectedLeaveTypeId(e.target.value);
    setPage(1);
  };

  // Open Drawer for detailed request view
  const handleViewDetails = async (req) => {
    setActiveRequest(req);
    // Fetch full details if needed (to get reviewer info, history, etc.)
    try {
      const detailed = await leaveApi.getRequestById(req.id);
      if (detailed) {
        setActiveRequest((prev) => (prev?.id === req.id ? { ...prev, ...detailed } : prev));
      }
    } catch (err) {
      console.warn("Could not load full request details by ID, using list item:", err);
    }
  };

  // Trigger Cancel Confirmation Dialog
  const handleOpenCancelDialog = (req) => {
    setCancelModalState({
      open: true,
      request: req,
      loading: false,
    });
  };

  // Confirm and Execute Cancellation
  const handleConfirmCancel = async () => {
    const target = cancelModalState.request;
    if (!target) return;

    try {
      setCancelModalState((prev) => ({ ...prev, loading: true }));
      await leaveApi.cancelRequest(target.id);

      setFeedback({
        type: "success",
        message: `Leave request #${target.id} cancelled successfully. Working days have been restored.`,
      });

      // Close modal & drawer
      setCancelModalState({ open: false, request: null, loading: false });
      setActiveRequest(null);

      // Refresh balances and requests
      fetchBalances();
      fetchRequests();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to cancel leave request.";
      setFeedback({ type: "error", message: msg });
      setCancelModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Status Badge Helper for Table
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-8 font-sans">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
            My Leaves
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            You can see the leaves you have applied here
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold text-slate-800 outline-none cursor-pointer transition-all shadow-xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>

          {/* + Apply Primary Button */}
          <Link
            to="/employee/leaves/apply"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-sm transition-all no-underline cursor-pointer"
          >
            <HiOutlinePlus size={18} />
            <span>Apply</span>
          </Link>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback.message && (
        <div
          className={`mb-6 flex items-start justify-between gap-3 p-4 rounded-xl text-sm ${
            feedback.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
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

      {/* 1. Leave Balance Cards Grid (Eclipse design) */}
      <section className="mb-8">
        {loadingBalances ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-60 bg-white border border-slate-200 rounded-2xl p-5 animate-pulse"
              />
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500">
            No leave balances allocated for {selectedYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {balances.map((b) => (
              <LeaveBalanceCard key={b.leaveTypeId} balance={b} />
            ))}
          </div>
        )}
      </section>

      {/* 2. My Leaves Request Section & Table */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight m-0 mb-4">
          My Leaves Request
        </h2>

        {/* Filters Bar: Search & Leave Type Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Search box */}
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by leave type or reason"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          {/* Leave Type filter */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedLeaveTypeId}
              onChange={handleTypeFilterChange}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-slate-700 outline-none cursor-pointer transition-all"
            >
              <option value="">All leave types</option>
              {leaveTypeOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>

        {/* Table of Leave Requests */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applied On</th>
                <th className="py-3 px-4 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loadingRequests ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const from = dayjs(req.fromDate);
                  const to = dayjs(req.toDate);
                  const dateStr =
                    from.format("YYYY-MM-DD") === to.format("YYYY-MM-DD")
                      ? from.format("D MMM YYYY")
                      : `${from.format("D")} - ${to.format("D MMM YYYY")}`;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {req.leaveTypeName}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {dateStr}
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {req.numberOfDays}
                      </td>
                      <td className="py-4 px-4">
                        {renderStatusBadge(req.status)}
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {dayjs(req.createdAt).format("D MMM YYYY")}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(req)}
                          title="View leave request details"
                          className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <HiOutlineEye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-100">
            <Pagination
              pageNumber={page}
              totalPages={totalPages}
              onPageClick={(p) => setPage(p)}
            />
          </div>
        )}
      </section>

      {/* 3. Leave Details Slide-out Drawer */}
      <LeaveDetailsDrawer
        open={Boolean(activeRequest)}
        request={activeRequest}
        managerName={manager?.managerName}
        onClose={() => setActiveRequest(null)}
        onRequestCancel={(req) => handleOpenCancelDialog(req)}
      />

      {/* 4. Phase-1 Cancel Dialog Exact Match */}
      {cancelModalState.request && (
        <ConfirmDialog
          open={cancelModalState.open}
          title="Cancel Leave Request?"
          message={`${cancelModalState.request.leaveTypeName}, ${dayjs(
            cancelModalState.request.fromDate
          ).format("D")} - ${dayjs(cancelModalState.request.toDate).format(
            "D MMM YYYY"
          )} (${cancelModalState.request.numberOfDays} working ${
            cancelModalState.request.numberOfDays === 1 ? "day" : "days"
          }). The days go back to your available balance. This can't be undone.`}
          confirmLabel="Yes, Cancel request."
          cancelLabel="No, Keep request."
          danger={true}
          loading={cancelModalState.loading}
          onConfirm={handleConfirmCancel}
          onCancel={() =>
            setCancelModalState({ open: false, request: null, loading: false })
          }
        />
      )}
    </div>
  );
}

