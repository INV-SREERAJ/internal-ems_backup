import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

import adminApi from "../../api/adminApi";
import LeaveTypeFormModal from "../../components/admin/LeaveTypeFormModal";
import LeaveTypeDetailsModal from "../../components/admin/LeaveTypeDetailsModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AdminLeaveTypesPage() {
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [showInactive, setShowInactive] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingLeaveType, setViewingLeaveType] = useState(null);

  // Status toggle confirmation
  const [statusConfirmState, setStatusConfirmState] = useState({
    open: false,
    leaveType: null,
    loading: false,
  });

  // Feedback banner
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4000);
  };

  // Fetch leave types from backend
  const fetchLeaveTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend expects activeOnly: boolean. When showInactive is true, activeOnly is false.
      const data = await adminApi.getLeaveTypes(!showInactive);
      const list = Array.isArray(data) ? data : [];
      setLeaveTypes(list);
    } catch (err) {
      console.error("Failed to load leave types:", err);
      setError(
        err.response?.data?.message || "Failed to load leave types from server."
      );
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  // Client-side search filtering
  const filteredLeaveTypes = useMemo(() => {
    let result = leaveTypes;

    // Filter inactive if showInactive is false (even though backend handles it, ensures full client sync)
    if (!showInactive) {
      result = result.filter((item) => item.isActive);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.code?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [leaveTypes, showInactive, search]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingLeaveType(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (leaveType) => {
    setEditingLeaveType(leaveType);
    setFormModalOpen(true);
  };

  const handleOpenView = (leaveType) => {
    setViewingLeaveType(leaveType);
    setDetailsModalOpen(true);
  };

  const handleFormSuccess = (savedLeaveType, isEdit) => {
    fetchLeaveTypes();
    if (isEdit) {
      showFeedback(
        "success",
        `Leave type "${savedLeaveType.name}" updated successfully.`
      );
    } else {
      // Automatically redirect admin to configure annual allocation for this new leave type
      navigate("/admin/yearly-configuration", {
        state: {
          autoConfigureLeaveTypeId: savedLeaveType.id,
          autoConfigureLeaveTypeName: savedLeaveType.name,
        },
      });
    }
  };

  const handleOpenToggleStatus = (leaveType) => {
    setStatusConfirmState({
      open: true,
      leaveType,
      loading: false,
    });
  };

  const handleConfirmToggleStatus = async () => {
    const target = statusConfirmState.leaveType;
    if (!target) return;

    try {
      setStatusConfirmState((prev) => ({ ...prev, loading: true }));
      const newStatus = !target.isActive;
      await adminApi.changeLeaveTypeStatus(target.id, newStatus);

      setStatusConfirmState({ open: false, leaveType: null, loading: false });
      fetchLeaveTypes();
      showFeedback(
        "success",
        `Leave type "${target.name}" ${
          newStatus ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setStatusConfirmState((prev) => ({ ...prev, loading: false }));
      showFeedback(
        "error",
        err.response?.data?.message || "Failed to update leave type status."
      );
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Toast Feedback Banner */}
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
            Leave Types
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage the leave types employees can apply for
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <HiOutlinePlus size={16} />
          <span>Add Leave Type</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Controls / Filter Bar */}
        <div className="p-4 md:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          {/* Left: Filter checkbox & search */}
          <div className="flex items-center gap-5 flex-wrap">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span>Show inactive leave types</span>
            </label>

            {/* Quick search */}
            <div className="relative w-64 max-w-full">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leave types..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <HiOutlineMagnifyingGlass
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Right: Count */}
          <div className="text-xs font-semibold text-slate-500">
            {filteredLeaveTypes.length}{" "}
            {filteredLeaveTypes.length === 1 ? "leave type" : "leave types"}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading leave types...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchLeaveTypes}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredLeaveTypes.length === 0 ? (
          <div className="py-20 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <HiOutlineExclamationCircle size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              No leave types found
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {search
                ? `No leave types matching "${search}". Try adjusting your search query.`
                : "No leave types have been created yet. Click 'Add Leave Type' above to add one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="py-3 px-4 md:px-6">Leave type</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last updated</th>
                  <th className="py-3 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLeaveTypes.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4 md:px-6 font-semibold text-slate-900">
                      {item.name}
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wide">
                        {item.code}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-xs text-xs text-slate-600 truncate">
                      {item.description || (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {item.updatedAt
                        ? dayjs(item.updatedAt).format("DD MMM YYYY")
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          Edit
                        </button>

                        {/* Disable / Enable Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenToggleStatus(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer ${
                            item.isActive
                              ? "bg-rose-600 hover:bg-rose-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {item.isActive ? "Disable" : "Enable"}
                        </button>

                        {/* View Eye Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(item)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer ml-1"
                        >
                          <HiOutlineEye size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      <LeaveTypeFormModal
        open={formModalOpen}
        leaveType={editingLeaveType}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Details Slide / Modal */}
      <LeaveTypeDetailsModal
        open={detailsModalOpen}
        leaveType={viewingLeaveType}
        onClose={() => setDetailsModalOpen(false)}
        onEdit={(type) => {
          setDetailsModalOpen(false);
          handleOpenEdit(type);
        }}
        onToggleStatus={(type) => {
          setDetailsModalOpen(false);
          handleOpenToggleStatus(type);
        }}
      />

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        open={statusConfirmState.open}
        title={
          statusConfirmState.leaveType?.isActive
            ? "Disable Leave Type?"
            : "Enable Leave Type?"
        }
        message={
          statusConfirmState.leaveType
            ? statusConfirmState.leaveType.isActive
              ? `Are you sure you want to disable "${statusConfirmState.leaveType.name}"? Employees will no longer be able to select this leave type for new leave requests.`
              : `Are you sure you want to enable "${statusConfirmState.leaveType.name}"? Employees will be able to select this leave type for leave requests.`
            : ""
        }
        confirmLabel={
          statusConfirmState.leaveType?.isActive ? "Yes, Disable" : "Yes, Enable"
        }
        cancelLabel="Go Back"
        variant={
          statusConfirmState.leaveType?.isActive ? "danger" : "success"
        }
        loading={statusConfirmState.loading}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() =>
          setStatusConfirmState({ open: false, leaveType: null, loading: false })
        }
      />
    </div>
  );
}

