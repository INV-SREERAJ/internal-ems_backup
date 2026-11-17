import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { HiOutlineXMark } from "react-icons/hi2";
import { formatLeaveDateRange, formatDateTime, formatDate } from "../../utils/dateUtils";
import LeaveStatusBadge from "./LeaveStatusBadge";
import leaveApi from "../../api/leaveApi";
import adminApi from "../../api/adminApi";

/**
 * Unified LeaveDetailsDrawer component supporting Employee, Manager, and Admin modes.
 *
 * Props:
 *  - open: boolean
 *  - request: object | null
 *  - mode: "employee" | "manager" | "admin" (default: "employee")
 *  - onClose: () => void
 *  - onApprove: (request) => void (for manager & admin)
 *  - onReject: (request) => void (for manager & admin)
 *  - onRequestCancel: (request) => void (for employee)
 *  - managerName?: string (optional, auto-loaded for admin if omitted)
 */
export default function LeaveDetailsDrawer({
  open,
  request,
  mode = "employee",
  onClose,
  onApprove,
  onReject,
  onRequestCancel,
  managerName: initialManagerName,
}) {
  const [managerName, setManagerName] = useState(initialManagerName || "");
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Load balances, history, and manager info when drawer opens
  useEffect(() => {
    if (!open || !request) {
      setManagerName("");
      setBalance(null);
      setHistory([]);
      return;
    }

    let isMounted = true;
    const year = request.year || dayjs(request.fromDate).year();

    // 1. Fetch manager name if in admin mode and not provided
    if (mode === "admin") {
      if (initialManagerName) {
        setManagerName(initialManagerName);
      } else {
        adminApi
          .getEmployeeByCode(request.employeeCode)
          .then((emp) => {
            if (isMounted) setManagerName(emp?.managerName || "");
          })
          .catch((err) => {
            console.warn("Could not load reporting manager:", err);
          });
      }
    }

    // 2. Fetch leave balance for Manager and Admin
    if (mode === "manager" || mode === "admin") {
      setLoadingBalance(true);
      const fetchBalancesPromise =
        mode === "admin"
          ? adminApi.getEmployeeLeaveBalances(request.employeeCode, year)
          : leaveApi.getEmployeeBalancesForManager(request.employeeCode, year);

      fetchBalancesPromise
        .then((balances) => {
          if (isMounted && Array.isArray(balances)) {
            const match = balances.find((b) => b.leaveTypeId === request.leaveTypeId);
            setBalance(match || balances[0] || null);
          }
        })
        .catch((err) => {
          console.warn("Failed to load employee balance:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingBalance(false);
        });

      // 3. Fetch history trail
      setLoadingHistory(true);
      const fetchHistoryPromise =
        mode === "admin"
          ? adminApi.getLeaveRequestHistory(request.id)
          : leaveApi.getTeamRequestHistory(request.id);

      fetchHistoryPromise
        .then((res) => {
          if (isMounted) {
            const items = res?.history || res?.data || (Array.isArray(res) ? res : []);
            setHistory(items);
          }
        })
        .catch((err) => {
          console.warn("Failed to load history:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingHistory(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [open, request, mode, initialManagerName]);

  if (!open || !request) return null;

  const isPending = request.status === "Pending";
  const isApproved = request.status === "Approved";
  const requestYear = request.year || dayjs(request.fromDate).year();
  const today = dayjs().startOf("day");
  const leaveStartDate = dayjs(request.fromDate).startOf("day");
  const canRejectApproved = isApproved && !leaveStartDate.isBefore(today);
  const canReject = isPending || (mode === "manager" && canRejectApproved);

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity [animation:fadeIn_0.15s_ease]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-[480px] bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200/80 [animation:slideLeft_0.2s_ease]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-leave-title"
        >
          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-7 space-y-6">
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Leave request #{request.id}
                </span>
                <h2
                  id="drawer-leave-title"
                  className="text-xl font-bold text-slate-900 tracking-tight mt-0.5"
                >
                  {request.leaveTypeName}
                </h2>
                <div className="mt-2">
                  <LeaveStatusBadge status={request.status} variant="solid" />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer -mr-1 -mt-1"
                aria-label="Close"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            {/* Employee info (for Manager and Admin) */}
            {(mode === "manager" || mode === "admin") && (
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-slate-900 m-0">
                  {request.employeeName} · {request.employeeCode}
                </p>
                {mode === "admin" && (
                  <p className="text-slate-500 m-0">
                    {managerName
                      ? `Reports to ${managerName}`
                      : "No manager assigned"}
                  </p>
                )}
              </div>
            )}

            {/* Dates & Working days cards (2-column layout) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center">
                <span className="text-[11px] font-medium text-slate-400">
                  Dates
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1">
                  {formatLeaveDateRange(request.fromDate, request.toDate)}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center">
                <span className="text-[11px] font-medium text-slate-400">
                  Working days
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1">
                  {request.numberOfDays}{" "}
                  <span className="font-normal text-slate-500 text-[11px]">
                    (excl. weekends)
                  </span>
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Reason
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed m-0 break-words">
                {request.reason || "No reason provided."}
              </p>
            </div>

            {/* Rejection Reason (if rejected and present) */}
            {request.rejectionReason && (
              <div>
                <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block mb-1">
                  Rejection Reason
                </span>
                <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 leading-relaxed m-0 break-words">
                  {request.rejectionReason}
                </p>
              </div>
            )}

            {/* Balance section (for Manager and Admin) */}
            {(mode === "manager" || mode === "admin") && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Balance · {request.leaveTypeName} {requestYear}
                </span>

                {loadingBalance ? (
                  <div className="py-6 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading balance details...</span>
                  </div>
                ) : balance ? (
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-center">
                      <span className="block text-base font-bold text-slate-900">
                        {balance.allocatedDays}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">
                        Allocated
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="block text-base font-bold text-slate-900">
                        {balance.usedDays}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">
                        Used
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="block text-base font-bold text-amber-600">
                        {balance.pendingDays}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">
                        Pending
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="block text-base font-bold text-emerald-700">
                        {balance.availableDays}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">
                        Available
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-400 text-center">
                    Balance details not found for {requestYear}.
                  </div>
                )}
              </div>
            )}

            {/* History section (for Manager and Admin) */}
            {(mode === "manager" || mode === "admin") ? (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  History
                </span>

                {loadingHistory ? (
                  <div className="py-6 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading history trail...</span>
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="text-xs text-slate-600 border-l-2 border-slate-200 pl-3 py-0.5"
                      >
                        <p className="m-0 leading-relaxed font-medium text-slate-700">
                          {formatDateTime(item.performedAt)} ·{" "}
                          <span className="font-semibold text-slate-900">
                            {item.action || item.newStatus}
                          </span>{" "}
                          · {item.performedByName || item.performedByEmployeeCode}
                        </p>
                        {item.comments && (
                          <p className="mt-1 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            &ldquo;{item.comments}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-600 border-l-2 border-slate-200 pl-3 py-0.5">
                      <p className="m-0 leading-relaxed font-medium text-slate-700">
                        {formatDateTime(request.createdAt)} ·{" "}
                        <span className="font-semibold text-slate-900">
                          Applied
                        </span>{" "}
                        · {request.employeeName}
                      </p>
                    </div>
                    {request.status !== "Pending" && request.reviewedByName && (
                      <div className="text-xs text-slate-600 border-l-2 border-slate-200 pl-3 py-0.5">
                        <p className="m-0 leading-relaxed font-medium text-slate-700">
                          {formatDateTime(request.reviewedAt || request.updatedAt)}{" "}
                          ·{" "}
                          <span className="font-semibold text-slate-900">
                            {request.status}
                          </span>{" "}
                          · {request.reviewedByName}
                        </p>
                        {request.rejectionReason && (
                          <p className="mt-1 text-[11px] text-rose-600 italic bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                            &ldquo;{request.rejectionReason}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Employee info trail
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>Applied On:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                {request.reviewedByName && (
                  <div className="flex justify-between">
                    <span>Reviewed By:</span>
                    <span className="font-semibold text-slate-800">
                      {request.reviewedByName}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="p-5 border-t border-slate-100 bg-white shadow-xs">
            {mode === "employee" ? (
              isPending && onRequestCancel ? (
                <button
                  type="button"
                  onClick={() => onRequestCancel(request)}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-300 hover:border-rose-400 hover:bg-rose-50 text-rose-600 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer text-center"
                >
                  Cancel Request
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              )
            ) : isPending || (mode === "manager" && canReject) ? (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {isPending && onApprove && (
                    <button
                      type="button"
                      onClick={() => onApprove(request)}
                      className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer text-center"
                    >
                      Approve
                    </button>
                  )}
                  {onReject && (
                    <button
                      type="button"
                      onClick={() => onReject(request)}
                      className={`w-full py-2.5 px-4 rounded-xl border border-rose-500 text-rose-600 hover:bg-rose-50 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer text-center ${
                        !isPending ? "col-span-2" : ""
                      }`}
                    >
                      Reject
                    </button>
                  )}
                </div>
                {mode === "admin" && (
                  <p className="text-[11px] text-slate-400 text-center mt-2.5 m-0 leading-tight">
                    Admin override. The normal flow is Employee &rarr; Manager.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status:{" "}
                  <strong className="text-slate-800">{request.status}</strong>
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
