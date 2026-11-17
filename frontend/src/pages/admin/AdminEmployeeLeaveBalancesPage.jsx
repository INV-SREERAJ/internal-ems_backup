import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  HiOutlineChevronDown,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

import adminApi from "../../api/adminApi";

export default function AdminEmployeeLeaveBalancesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentYear = useMemo(() => dayjs().year(), []);

  // Form input states
  const paramCode = searchParams.get("code") || "";
  const paramYear = searchParams.get("year") || String(currentYear);

  const [inputCode, setInputCode] = useState(paramCode);
  const [inputYear, setInputYear] = useState(paramYear);

  // Active searched criteria
  const [searchedCode, setSearchedCode] = useState(paramCode);
  const [searchedYear, setSearchedYear] = useState(paramYear);

  // Data states
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Year options: past 2 years up to next 2 years
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Fetch employee details and balances
  const fetchEmployeeBalances = useCallback(
    async (code, year) => {
      const trimmedCode = code?.trim();
      if (!trimmedCode) {
        setError("Please enter an employee code.");
        setBalances([]);
        setEmployeeInfo(null);
        return;
      }

      setLoading(true);
      setError(null);
      setSearched(true);

      try {
        // Fetch employee details and leave balances in parallel
        const [empDetails, balList] = await Promise.all([
          adminApi.getEmployeeByCode(trimmedCode),
          adminApi.getEmployeeLeaveBalances(trimmedCode, parseInt(year, 10)),
        ]);

        setEmployeeInfo(empDetails);
        setBalances(Array.isArray(balList) ? balList : []);
      } catch (err) {
        console.error("Failed to fetch employee balances:", err);
        setEmployeeInfo(null);
        setBalances([]);
        const msg =
          err.response?.data?.message ||
          err.response?.data?.title ||
          (err.response?.status === 404
            ? "Employee not found."
            : "Failed to load leave balances. Please try again.");
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-search if query params are present on mount or update
  useEffect(() => {
    if (paramCode) {
      setInputCode(paramCode);
      setInputYear(paramYear);
      setSearchedCode(paramCode);
      setSearchedYear(paramYear);
      fetchEmployeeBalances(paramCode, paramYear);
    }
  }, [paramCode, paramYear, fetchEmployeeBalances]);

  // Handle form submit
  const handleView = (e) => {
    e?.preventDefault();
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setError("Please enter an employee code.");
      return;
    }

    setSearchParams({ code: trimmed, year: inputYear });
    setSearchedCode(trimmed);
    setSearchedYear(inputYear);
    fetchEmployeeBalances(trimmed, inputYear);
  };

  // Navigate to leave requests filtered for this employee
  const handleViewRequests = () => {
    if (!searchedCode) return;
    navigate("/admin/leave-requests", {
      state: {
        employeeCode: searchedCode,
        year: parseInt(searchedYear, 10) || currentYear,
      },
    });
  };

  const employeeFullName = employeeInfo
    ? `${employeeInfo.firstName || ""} ${employeeInfo.lastName || ""}`.trim()
    : "";
  const managerDisplayName = employeeInfo?.managerName || "None";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Employee Leave Balances
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Look up any employee's balances by year
        </p>
      </div>

      {/* Lookup Controls */}
      <form onSubmit={handleView} className="flex flex-wrap items-end gap-3">
        {/* Employee Code Input */}
        <div className="flex flex-col gap-1.5 w-full sm:w-72">
          <label className="text-xs font-semibold text-slate-700">
            Employee code
          </label>
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="e.g. EMP20260042"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-xs"
          />
        </div>

        {/* Year Select */}
        <div className="flex flex-col gap-1.5 w-28 sm:w-32">
          <label className="text-xs font-semibold text-slate-700">Year</label>
          <div className="relative">
            <select
              value={inputYear}
              onChange={(e) => setInputYear(e.target.value)}
              className="w-full appearance-none px-3.5 py-2 pr-8 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-xs font-medium cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>

        {/* View Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              "View"
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <HiOutlineExclamationCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section (only displayed after searching and without blocking error) */}
      {searched && !error && (
        <div className="space-y-4">
          {/* Employee Summary Card */}
          {employeeInfo && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <p className="text-sm font-semibold text-slate-800">
                {employeeFullName} &middot; {employeeInfo.employeeCode} &middot;{" "}
                <span className="text-slate-600 font-normal">
                  Reports to {managerDisplayName}
                </span>
              </p>
            </div>
          )}

          {/* Leave Balances Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[36%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 md:px-6">Leave type</th>
                    <th className="py-3.5 px-4 text-center">Allocated</th>
                    <th className="py-3.5 px-4 text-center">Used</th>
                    <th className="py-3.5 px-4 text-center">Pending</th>
                    <th className="py-3.5 px-4 md:px-6 text-center">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-400"
                      >
                        <div className="inline-flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Loading leave balances...</span>
                        </div>
                      </td>
                    </tr>
                  ) : balances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No leave balances found for {searchedYear}.
                      </td>
                    </tr>
                  ) : (
                    balances.map((b) => (
                      <tr
                        key={b.leaveTypeId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 md:px-6 font-medium text-slate-900 truncate"
                          title={b.leaveTypeName}
                        >
                          {b.leaveTypeName}
                          {b.leaveTypeCode ? ` (${b.leaveTypeCode})` : ""}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-center whitespace-nowrap">
                          {b.allocatedDays}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-center whitespace-nowrap">
                          {b.usedDays}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-center whitespace-nowrap">
                          {b.pendingDays}
                        </td>
                        <td className="py-3.5 px-4 md:px-6 font-semibold text-slate-900 text-center whitespace-nowrap">
                          {b.availableDays}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* View this employee's requests button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleViewRequests}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50/60 active:scale-[0.98] transition-colors cursor-pointer"
            >
              View this employee&apos;s requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

