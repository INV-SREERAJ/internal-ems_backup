import React from "react";
import dayjs from "dayjs";
import {
  HiOutlineXMark,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
} from "react-icons/hi2";

/**
 * LeaveDetailsDrawer
 * Slides in from the right edge showing full details of a selected leave request:
 * - Request ID & Title
 * - Status pill (Pending / Approved / Rejected / Cancelled)
 * - Dates & Working Days boxes
 * - Reason
 * - Applied on & Reviewer / Approval status
 * - Rejection reason if applicable
 * - Cancel Request action button (active for Pending requests)
 */
export default function LeaveDetailsDrawer({
  open,
  request,
  managerName,
  onClose,
  onRequestCancel,
}) {
  if (!open || !request) return null;

  const isPending = request.status === "Pending";

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const fromDate = dayjs(request.fromDate);
  const toDate = dayjs(request.toDate);

  return (
    <div className="fixed inset-0 z-[950] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideLeft">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
              Leave request #{request.id}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>

          <h2 className="mt-2 mb-3 text-2xl font-bold text-slate-900 tracking-tight">
            {request.leaveTypeName}
          </h2>

          <div>{getStatusBadge(request.status)}</div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col gap-6">
          {/* Dates & Working Days Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Dates
              </span>
              <span className="block text-sm font-bold text-slate-900">
                {fromDate.format("D")} - {toDate.format("D MMM YYYY")}
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                {fromDate.format("ddd")} - {toDate.format("ddd")}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Working Days
              </span>
              <span className="block text-sm font-bold text-slate-900">
                {request.numberOfDays}
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Excluding weekends
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h4 className="m-0 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Reason
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
              {request.reason || "No reason specified."}
            </div>
          </div>

          {/* Rejection reason (if rejected) */}
          {request.rejectionReason && (
            <div>
              <h4 className="m-0 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1.5">
                Rejection Reason
              </h4>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 leading-relaxed break-words">
                {request.rejectionReason}
              </div>
            </div>
          )}

          {/* Meta Info: Applied On & Reviewer */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="block font-medium text-slate-500 mb-1">
                Applied on:
              </span>
              <span className="font-semibold text-slate-800 text-sm">
                {dayjs(request.createdAt).format("D MMM YYYY")}
              </span>
            </div>

            <div>
              <span className="block font-medium text-slate-500 mb-1">
                Review:
              </span>
              <span className="font-semibold text-slate-800 text-sm block">
                {request.reviewedByName || managerName || "Assigned Manager"}
              </span>
              <span className="text-slate-500 text-[11px] block mt-0.5">
                {request.status === "Pending"
                  ? "Pending Approval"
                  : request.status === "Approved"
                  ? "Approved"
                  : request.status === "Rejected"
                  ? "Rejected"
                  : "Cancelled"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Action: Cancel Request button */}
        {isPending && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => onRequestCancel(request)}
              className="w-full py-3 px-4 rounded-xl border border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Cancel Request</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

