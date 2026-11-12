/**
 * Standardized status badge pill for leave requests.
 *
 * Props:
 *  - status: "Pending" | "Approved" | "Rejected" | "Cancelled" | string
 *  - variant: "solid" (default, solid pill from wireframe) | "subtle" (soft badge with indicator dot)
 *  - className: string (optional extra classes)
 */
export default function LeaveStatusBadge({
  status,
  variant = "solid",
  className = "",
}) {
  if (!status) return null;

  if (variant === "subtle") {
    switch (status) {
      case "Approved":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case "Pending":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "Cancelled":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold ${className}`}
          >
            {status}
          </span>
        );
    }
  }

  // Default: Solid badge pill matching wireframe
  switch (status) {
    case "Pending":
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-md bg-[#f59e0b] text-white text-xs font-semibold ${className}`}
        >
          Pending
        </span>
      );
    case "Approved":
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-semibold ${className}`}
        >
          Approved
        </span>
      );
    case "Rejected":
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-xs font-semibold ${className}`}
        >
          Rejected
        </span>
      );
    case "Cancelled":
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-md bg-slate-500 text-white text-xs font-semibold ${className}`}
        >
          Cancelled
        </span>
      );
    default:
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-semibold ${className}`}
        >
          {status}
        </span>
      );
  }
}

