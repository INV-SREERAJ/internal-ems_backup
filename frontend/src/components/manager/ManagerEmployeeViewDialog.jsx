import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/axios";
import leaveApi from "../../api/leaveApi";
import {
  STATUS_LABEL,
  STATUS_CLASS,
} from "../../utils/constants";
import { HiOutlineChevronDown } from "react-icons/hi2";

/**
 * Detail view dialog for a reporting team employee (Manager view).
 * Features tabbed Overview and Leave Balances views.
 *
 * Props:
 *  - employeeCode: string | null – when truthy the dialog opens
 *  - onClose: () => void – called to close the dialog
 */
export default function ManagerEmployeeViewDialog({
  employeeCode,
  onClose,
}) {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab & Leave Balances states
  const currentYear = useMemo(() => dayjs().year(), []);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "balances"
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState(null);

  // Year options for dropdown: past 2 years up to next 2 years
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Aggregate leave metrics
  const totalAvailable = useMemo(
    () => balances.reduce((sum, b) => sum + (b.availableDays || 0), 0),
    [balances]
  );
  const totalUsed = useMemo(
    () => balances.reduce((sum, b) => sum + (b.usedDays || 0), 0),
    [balances]
  );
  const totalPending = useMemo(
    () => balances.reduce((sum, b) => sum + (b.pendingDays || 0), 0),
    [balances]
  );

  // Fetch employee details when employeeCode changes
  useEffect(() => {
    if (!employeeCode) return;

    let isMounted = true;
    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/manager/employees/${encodeURIComponent(employeeCode)}`
        );
        if (isMounted) {
          setEmployee(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Failed to load employee details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployee();
    return () => {
      isMounted = false;
    };
  }, [employeeCode]);

  // Fetch employee leave balances whenever employeeCode or selectedYear changes
  useEffect(() => {
    if (!employeeCode) return;

    let isMounted = true;
    const fetchBalances = async () => {
      setLoadingBalances(true);
      setBalanceError(null);
      try {
        const data = await leaveApi.getEmployeeBalances(
          employeeCode,
          selectedYear
        );
        if (isMounted) {
          setBalances(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setBalanceError(
            err.response?.data?.message || "Failed to load leave balances."
          );
          setBalances([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBalances(false);
        }
      }
    };

    fetchBalances();
    return () => {
      isMounted = false;
    };
  }, [employeeCode, selectedYear]);

  // Close on Escape
  useEffect(() => {
    if (!employeeCode) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [employeeCode, onClose]);

  if (!employeeCode) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const normalizedDate = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
    const date = new Date(normalizedDate);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const fieldLabelClass = "text-slate-400 text-xs font-medium";
  const fieldValueClass = "text-slate-900 text-sm font-medium break-words";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[780px] max-h-[90vh] bg-white rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-y-auto max-[767px]:max-w-none max-[767px]:max-h-[95vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-employee-view-dialog-title"
      >
        {/* Loading */}
        {loading && (
          <div className="px-6 py-12 text-slate-500 text-sm text-center">
            Loading employee details…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 text-red-700 text-sm text-center">{error}</div>
        )}

        {/* Content */}
        {!loading && !error && employee && (
          <>
            {/* Header */}
            <div className="pt-6 px-6 pb-4 flex items-start justify-between gap-4 max-[767px]:pt-5 max-[767px]:px-[18px]">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2
                    id="manager-employee-view-dialog-title"
                    className="m-0 text-slate-900 text-xl font-bold tracking-[-0.3px] max-[767px]:text-lg"
                  >
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      STATUS_CLASS[Number(employee.status)] ||
                      "bg-red-100 text-red-800"
                    }`}
                  >
                    {STATUS_LABEL[Number(employee.status)] || "—"}
                  </span>
                </div>
                <p className="mt-1 mb-0 text-slate-500 text-[13px] font-medium">
                  {employee.employeeCode}{" "}
                  {employee.role ? `· ${employee.role}` : ""}
                </p>
              </div>

              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center p-0 bg-transparent text-slate-400 border-none rounded-md text-lg cursor-pointer shrink-0 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
                onClick={onClose}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Tabs Bar */}
            <div className="px-6 border-b border-slate-200 flex items-center gap-6 max-[767px]:px-[18px]">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`py-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("balances")}
                className={`py-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === "balances"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Leave balances</span>
                {balances.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
                    {balances.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content: Overview */}
            {activeTab === "overview" && (
              <div className="p-6 max-[767px]:px-[18px] max-[767px]:py-5">
                {/* Personal information */}
                <div className="mb-6 last:mb-0">
                  <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>First Name</span>
                      <span className={fieldValueClass}>
                        {employee.firstName}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Last Name</span>
                      <span className={fieldValueClass}>{employee.lastName}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Email</span>
                      <span className={fieldValueClass}>{employee.email}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Phone Number</span>
                      <span className={fieldValueClass}>
                        {employee.phoneNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organization */}
                <div className="mb-6 last:mb-0">
                  <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                    Organization
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Role</span>
                      <span className={fieldValueClass}>
                        {employee.role || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Status</span>
                      <span
                        className={`inline-flex w-fit px-2 py-[3px] rounded-full text-xs font-semibold ${
                          STATUS_CLASS[Number(employee.status)] ||
                          "bg-red-100 text-red-800"
                        }`}
                      >
                        {STATUS_LABEL[Number(employee.status)] || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Manager</span>
                      <span className={fieldValueClass}>
                        {employee.managerName
                          ? `${employee.managerName} (${employee.managerEmployeeCode})`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mb-6 last:mb-0">
                  <h3 className="m-0 mb-3.5 text-slate-600 text-xs font-semibold uppercase tracking-[0.5px]">
                    Record Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Employee Code</span>
                      <span className={fieldValueClass}>
                        {employee.employeeCode}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Created At</span>
                      <span className={fieldValueClass}>
                        {formatDate(employee.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={fieldLabelClass}>Updated At</span>
                      <span className={fieldValueClass}>
                        {formatDate(employee.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Leave Balances */}
            {activeTab === "balances" && (
              <div className="p-6 max-[767px]:px-[18px] max-[767px]:py-5">
                {/* Top Header: Summary & Year Select */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="text-sm">
                    <span className="font-bold text-slate-900">{selectedYear}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-600 font-medium">
                      {totalAvailable} days available · {totalUsed} used ·{" "}
                      {totalPending} pending
                    </span>
                  </div>

                  <div className="relative shrink-0 w-28">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 outline-none cursor-pointer transition-all"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <HiOutlineChevronDown
                      size={13}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </div>

                {/* Loading State */}
                {loadingBalances ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading leave balances...</span>
                  </div>
                ) : balanceError ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center">
                    {balanceError}
                  </div>
                ) : balances.length === 0 ? (
                  <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-800 m-0">
                      No leave balances found
                    </p>
                    <p className="text-xs text-slate-400 mt-1 m-0">
                      No leave allocations configured for this employee in{" "}
                      {selectedYear}.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Grid of Leave Balance Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {balances.map((b) => {
                        const total =
                          b.allocatedDays && b.allocatedDays > 0
                            ? b.allocatedDays
                            : (b.usedDays || 0) +
                                (b.pendingDays || 0) +
                                (b.availableDays || 0) || 1;
                        const availablePercent = Math.min(
                          100,
                          Math.max(0, ((b.availableDays || 0) / total) * 100)
                        );
                        const pendingPercent = Math.min(
                          100 - availablePercent,
                          Math.max(0, ((b.pendingDays || 0) / total) * 100)
                        );
                        const usedPercent = Math.min(
                          100 - availablePercent - pendingPercent,
                          Math.max(0, ((b.usedDays || 0) / total) * 100)
                        );

                        return (
                          <div
                            key={b.leaveTypeId || b.leaveTypeCode}
                            className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                          >
                            <div>
                              {/* Card Header */}
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <h4
                                  className="m-0 text-sm font-semibold text-slate-900 tracking-tight truncate"
                                  title={b.leaveTypeName}
                                >
                                  {b.leaveTypeName}
                                </h4>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase shrink-0">
                                  {b.leaveTypeCode || "LV"}
                                </span>
                              </div>

                              {/* Days Left */}
                              <div className="flex items-baseline gap-1.5 my-2">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                                  {b.availableDays ?? 0}
                                </span>
                                <span className="text-xs font-medium text-slate-500">
                                  of {b.allocatedDays ?? 0} left
                                </span>
                              </div>

                              {/* Segmented Progress Bar */}
                              <div className="w-full bg-slate-100 rounded-full h-2 my-2.5 overflow-hidden flex">
                                {availablePercent > 0 && (
                                  <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${availablePercent}%` }}
                                    title={`Left: ${b.availableDays} days`}
                                  />
                                )}
                                {pendingPercent > 0 && (
                                  <div
                                    className="bg-amber-400 h-full transition-all duration-300"
                                    style={{ width: `${pendingPercent}%` }}
                                    title={`Pending: ${b.pendingDays} days`}
                                  />
                                )}
                                {usedPercent > 0 && (
                                  <div
                                    className="bg-slate-300 h-full transition-all duration-300"
                                    style={{ width: `${usedPercent}%` }}
                                    title={`Used: ${b.usedDays} days`}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Card Subtext */}
                            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span>
                                <strong className="text-slate-700 font-medium">
                                  {b.usedDays ?? 0}
                                </strong>{" "}
                                used ·{" "}
                                <strong className="text-slate-700 font-medium">
                                  {b.pendingDays ?? 0}
                                </strong>{" "}
                                pending
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Footer: Navigation Link & Legend */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(
                            `/manager/leaves/all?search=${encodeURIComponent(
                              employee.employeeCode
                            )}`
                          );
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>View full leave history</span>
                        <span>&rarr;</span>
                      </button>

                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                          <span>Left</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                          <span>Pending</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400/60 shrink-0" />
                          <span>Used</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
