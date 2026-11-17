import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

import adminApi from "../../api/adminApi";
import ConfigureLeaveTypeModal from "../../components/admin/ConfigureLeaveTypeModal";
import YearlyConfigDetailsModal from "../../components/admin/YearlyConfigDetailsModal";
import AllocationBlockedModal from "../../components/admin/AllocationBlockedModal";
import AllocationSuccessToast from "../../components/admin/AllocationSuccessToast";
import ConfirmDialog from "../../components/common/ConfirmDialog";

/**
 * Parses the conflict message returned by backend when allocated days reduction is blocked.
 * Example message: "Cannot reduce allocated days to 10. The following employees have already used or requested more days: EMP001 - Arun K (14 days), EMP002 - Jane Doe (12 days)."
 */
function parseExceedingUsageMessage(message, attemptedDays) {
  if (!message) return null;

  const marker = "requested more days: ";
  const markerIndex = message.indexOf(marker);
  if (markerIndex === -1) return null;

  const rawList = message.slice(markerIndex + marker.length).replace(/\.$/, "");
  const tokens = rawList.split(", ");
  const employees = [];
  let moreCount = 0;

  tokens.forEach((token) => {
    const moreMatch = token.match(/^and (\d+) more$/i);
    if (moreMatch) {
      moreCount = parseInt(moreMatch[1], 10);
      return;
    }

    const match = token.match(/^([A-Za-z0-9_-]+)\s*-\s*(.+?)\s*\((\d+)\s*days\)$/);
    if (match) {
      employees.push({
        code: match[1],
        name: match[2],
        days: parseInt(match[3], 10),
      });
    } else {
      const daysMatch = token.match(/(\d+)\s*days/);
      employees.push({
        code: "",
        name: token.replace(/\s*\(\d+\s*days\)/, "").trim(),
        days: daysMatch ? parseInt(daysMatch[1], 10) : attemptedDays,
      });
    }
  });

  const maxDays = employees.reduce((max, e) => Math.max(max, e.days), attemptedDays);

  return {
    attemptedDays,
    employees,
    moreCount,
    maxDays,
  };
}

export default function AdminYearlyLeaveConfigPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentYear = useMemo(() => dayjs().year(), []);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [configurations, setConfigurations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pre-selected leave type if redirected from Add Leave Type
  const [preSelectedTypeId, setPreSelectedTypeId] = useState(null);

  // Check incoming redirection state from Add Leave Type
  useEffect(() => {
    const incomingId = location.state?.autoConfigureLeaveTypeId;
    const incomingName = location.state?.autoConfigureLeaveTypeName;

    if (incomingId) {
      setPreSelectedTypeId(incomingId);
      setSelectedYear(currentYear);
      setConfigureModalOpen(true);
      showFeedback(
        "success",
        `Leave type "${incomingName || "New leave type"}" created! Now set its annual allocation for ${currentYear} to make it available to employees.`
      );

      // Clean state so refreshing won't re-trigger the modal
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentYear, navigate]);

  // Year options: past 2 years up to next 2 years
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const isPastYear = selectedYear < currentYear;

  // Inline editing state: row id currently being edited
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingDays, setEditingDays] = useState("");
  const [savingRowId, setSavingRowId] = useState(null);
  const [rowError, setRowError] = useState({ id: null, message: "" });

  // Modals state
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [viewingConfig, setViewingConfig] = useState(null);
  const [conflictModalState, setConflictModalState] = useState({
    open: false,
    config: null,
    conflictInfo: null,
  });
  const [successToast, setSuccessToast] = useState({
    open: false,
    config: null,
  });

  // Track highlighted row (soft green background on update per wireframe)
  const [highlightedRowId, setHighlightedRowId] = useState(null);

  // Status toggle confirm dialog
  const [statusConfirmState, setStatusConfirmState] = useState({
    open: false,
    config: null,
    loading: false,
  });

  // Feedback banner
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4500);
  };

  // 1. Fetch leave types (for codes, names, and configuring new types)
  const fetchLeaveTypes = useCallback(async () => {
    try {
      const data = await adminApi.getLeaveTypes(false);
      setLeaveTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leave types:", err);
    }
  }, []);

  // 2. Fetch configurations for selected year
  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEditingRowId(null);
      setRowError({ id: null, message: "" });

      const data = await adminApi.getLeaveYearConfigurations(selectedYear);
      setConfigurations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load configurations:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load leave year configurations from server."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  // Initial fetch of active employees count
  useEffect(() => {
    adminApi.getActiveEmployeesCount().then((count) => {
      if (typeof count === "number") {
        setActiveEmployeesCount(count);
      }
    });
  }, []);

  // Enrich configurations with LeaveType details (code, description, dates)
  const enrichedConfigs = useMemo(() => {
    const typeMap = new Map(leaveTypes.map((t) => [t.id, t]));
    return configurations.map((cfg) => {
      const matchedType = typeMap.get(cfg.leaveTypeId);
      return {
        ...cfg,
        leaveTypeName: cfg.leaveTypeName || matchedType?.name || "Leave Type",
        leaveTypeCode: matchedType?.code || "",
        createdAt: cfg.createdAt || matchedType?.createdAt,
        updatedAt: cfg.updatedAt || matchedType?.updatedAt,
      };
    });
  }, [configurations, leaveTypes]);

  // Inline edit handlers
  const handleStartEdit = (cfg) => {
    if (isPastYear) return;
    setEditingRowId(cfg.id);
    setEditingDays(String(cfg.allocatedDays));
    setRowError({ id: null, message: "" });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingDays("");
    setRowError({ id: null, message: "" });
  };

  const handleSaveEdit = async (cfg) => {
    const daysNum = parseInt(editingDays, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      setRowError({
        id: cfg.id,
        message: "Allocated days must be between 1 and 365.",
      });
      return;
    }

    try {
      setSavingRowId(cfg.id);
      setRowError({ id: null, message: "" });

      await adminApi.updateLeaveYearConfiguration(cfg.id, {
        allocatedDays: daysNum,
      });

      setEditingRowId(null);
      fetchConfigurations();

      // Highlight the updated row with soft green background
      setHighlightedRowId(cfg.id);

      // Trigger bottom-right success notification toast
      setSuccessToast({
        open: true,
        config: {
          leaveTypeName: cfg.leaveTypeName,
          allocatedDays: daysNum,
          year: cfg.year || selectedYear,
          isNew: false,
        },
      });
    } catch (err) {
      console.error("Failed to update allocated days:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Failed to update allocated days.";

      setRowError({ id: cfg.id, message: errMsg });

      // If conflict with exceeding employees, open the dedicated prompt
      const conflictData = parseExceedingUsageMessage(errMsg, daysNum);
      if (conflictData && conflictData.employees.length > 0) {
        setConflictModalState({
          open: true,
          config: cfg,
          conflictInfo: conflictData,
        });
      }
    } finally {
      setSavingRowId(null);
    }
  };

  // Status toggle handler
  const handleOpenToggleStatus = (cfg) => {
    if (isPastYear) return;
    setStatusConfirmState({
      open: true,
      config: cfg,
      loading: false,
    });
  };

  const handleConfirmToggleStatus = async () => {
    const target = statusConfirmState.config;
    if (!target) return;

    try {
      setStatusConfirmState((prev) => ({ ...prev, loading: true }));
      const newStatus = !target.isActive;
      await adminApi.changeLeaveYearConfigurationStatus(target.id, newStatus);

      setStatusConfirmState({ open: false, config: null, loading: false });
      fetchConfigurations();
      showFeedback(
        "success",
        `Configuration for "${target.leaveTypeName}" ${
          newStatus ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setStatusConfirmState((prev) => ({ ...prev, loading: false }));
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to update configuration status."
      );
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Yearly Leave Configuration
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Set annual allocation per leave type
          </p>
        </div>

        {!isPastYear && (
          <button
            type="button"
            onClick={() => setConfigureModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <HiOutlinePlus size={16} />
            <span>Configure Leave Type</span>
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Year Filter Toolbar */}
        <div className="p-4 md:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            {/* Year Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 pr-9 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Past Year Note */}
            <span className="text-xs text-slate-400 font-medium">
              {isPastYear
                ? "Past years are read-only for history."
                : "Active configuration for annual allowances."}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {enrichedConfigs.length}{" "}
            {enrichedConfigs.length === 1 ? "leave type" : "leave types"} configured
          </div>
        </div>

        {/* Content Table Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading yearly configurations...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchConfigurations}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : enrichedConfigs.length === 0 ? (
          <div className="py-20 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <HiOutlineInformationCircle size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              No leave types configured for {selectedYear}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {!isPastYear
                ? "Click 'Configure Leave Type' above to allocate days for this year."
                : "No configurations were found for this past year."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[28%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="py-3 px-4 md:px-6">Leave type</th>
                  <th className="py-3 px-4 text-center">Allocated days</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 md:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {enrichedConfigs.map((cfg) => {
                  const isEditing = editingRowId === cfg.id;
                  const isSaving = savingRowId === cfg.id;
                  const hasRowError = rowError.id === cfg.id;

                  return (
                    <tr
                      key={cfg.id}
                      className={`transition-colors duration-300 ${
                        highlightedRowId === cfg.id
                          ? "bg-emerald-50/80"
                          : isEditing
                          ? "bg-blue-50/20"
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Leave Type Name & Code */}
                      <td className="py-3.5 px-4 md:px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{cfg.leaveTypeName}</span>
                          {cfg.leaveTypeCode && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                              {cfg.leaveTypeCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Allocated Days */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={365}
                              autoFocus
                              value={editingDays}
                              onChange={(e) => setEditingDays(e.target.value)}
                              className="w-20 px-2.5 py-1 text-sm font-semibold rounded-lg border border-blue-500 ring-2 ring-blue-100 outline-none bg-white text-slate-900 text-center"
                            />
                            {hasRowError && (
                              <span className="text-[11px] font-medium text-red-600 max-w-xs">
                                {rowError.message}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{cfg.allocatedDays}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            cfg.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cfg.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {cfg.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 md:px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(cfg)}
                                disabled={isSaving}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                              >
                                {isSaving && (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>Save</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {!isPastYear && (
                                <>
                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(cfg)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>

                                  {/* Disable / Enable Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenToggleStatus(cfg)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer ${
                                      cfg.isActive
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                    }`}
                                  >
                                    {cfg.isActive ? "Disable" : "Enable"}
                                  </button>
                                </>
                              )}

                              {/* View Details Button */}
                              <button
                                type="button"
                                onClick={() => setViewingConfig(cfg)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-blue-600 transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* How saving works note (Image 1) */}
        <div className="m-4 md:m-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 flex flex-col gap-1">
          <span className="font-bold text-slate-900">How saving works</span>
          <p className="m-0 leading-relaxed text-slate-600">
            Saving new days updates every employee's balance for that year in one step.
            If anyone has already used or requested more than the new value, the change is blocked and those employees are listed.
          </p>
        </div>
      </div>

      {/* Configure Leave Type Modal */}
      <ConfigureLeaveTypeModal
        open={configureModalOpen}
        year={selectedYear}
        existingConfigs={configurations}
        leaveTypes={leaveTypes}
        preSelectedLeaveTypeId={preSelectedTypeId}
        onClose={() => {
          setConfigureModalOpen(false);
          setPreSelectedTypeId(null);
        }}
        onSuccess={(newCfg) => {
          setPreSelectedTypeId(null);
          fetchConfigurations();

          const matchedType = leaveTypes.find((t) => t.id === newCfg.leaveTypeId);
          setHighlightedRowId(newCfg.id);
          setSuccessToast({
            open: true,
            config: {
              leaveTypeName:
                newCfg.leaveTypeName || matchedType?.name || "Leave Type",
              allocatedDays: newCfg.allocatedDays,
              year: newCfg.year || selectedYear,
              isNew: true,
            },
          });
        }}
      />

      {/* View Configuration Modal */}
      <YearlyConfigDetailsModal
        open={Boolean(viewingConfig)}
        config={viewingConfig}
        isPastYear={isPastYear}
        onClose={() => setViewingConfig(null)}
        onEdit={(cfg) => {
          setViewingConfig(null);
          handleStartEdit(cfg);
        }}
        onToggleStatus={(cfg) => {
          setViewingConfig(null);
          handleOpenToggleStatus(cfg);
        }}
      />

      {/* Allocation Reduction Blocked Conflict Modal */}
      <AllocationBlockedModal
        open={conflictModalState.open}
        config={conflictModalState.config}
        conflictInfo={conflictModalState.conflictInfo}
        onClose={() =>
          setConflictModalState({ open: false, config: null, conflictInfo: null })
        }
        onBackToEdit={() => {
          setConflictModalState({ open: false, config: null, conflictInfo: null });
        }}
      />

      {/* Allocation Success Toast (Bottom Right) */}
      <AllocationSuccessToast
        open={successToast.open}
        config={successToast.config}
        onClose={() => setSuccessToast({ open: false, config: null })}
      />

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        open={statusConfirmState.open}
        title={
          statusConfirmState.config?.isActive
            ? "Disable Configuration?"
            : "Enable Configuration?"
        }
        message={
          statusConfirmState.config
            ? statusConfirmState.config.isActive
              ? `Are you sure you want to disable "${statusConfirmState.config.leaveTypeName}" for ${selectedYear}? Employees will not be able to select this leave type for new requests.`
              : `Are you sure you want to enable "${statusConfirmState.config.leaveTypeName}" for ${selectedYear}?`
            : ""
        }
        confirmLabel={
          statusConfirmState.config?.isActive ? "Yes, Disable" : "Yes, Enable"
        }
        cancelLabel="Go Back"
        variant={statusConfirmState.config?.isActive ? "danger" : "success"}
        loading={statusConfirmState.loading}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() =>
          setStatusConfirmState({ open: false, config: null, loading: false })
        }
      />
    </div>
  );
}

