import React, { useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";

/**
 * LeaveBalanceCard
 * Renders an individual leave balance card with:
 * - Title and short code badge (e.g. "Casual Leave", "CL")
 * - MUI X-Charts Donut ring with "X left"
 * - Used, Pending, Available counters with color-coded dot indicators
 */
export default function LeaveBalanceCard({ balance }) {
  if (!balance) return null;

  const used = balance.usedDays || 0;
  const pending = balance.pendingDays || 0;
  const available = balance.availableDays || 0;

  // Chart data for MUI X-Charts
  const chartData = useMemo(() => {
    const items = [];
    if (available > 0) {
      items.push({
        id: "available",
        value: available,
        color: "#2563eb",
        label: "Available",
      });
    }
    if (used > 0) {
      items.push({
        id: "used",
        value: used,
        color: "#93c5fd",
        label: "Used",
      });
    }
    if (pending > 0) {
      items.push({
        id: "pending",
        value: pending,
        color: "#f59e0b",
        label: "Pending",
      });
    }
    if (items.length === 0) {
      items.push({
        id: "empty",
        value: 1,
        color: "#f1f5f9",
        label: "No allocation",
      });
    }
    return items;
  }, [available, used, pending]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="m-0 text-sm font-semibold text-slate-900 tracking-tight">
          {balance.leaveTypeName}
        </h3>
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase">
          {balance.leaveTypeCode || "LV"}
        </span>
      </div>

      {/* Center Donut Ring */}
      <div className="my-2 flex justify-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <PieChart
            series={[
              {
                data: chartData,
                innerRadius: 32,
                outerRadius: 44,
                paddingAngle: chartData.length > 1 ? 2 : 0,
                cornerRadius: 3,
                cx: 56,
                cy: 56,
              },
            ]}
            width={112}
            height={112}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            slotProps={{ legend: { hidden: true } }}
          />

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
              {available}
            </span>
            <span className="text-[10px] font-medium text-slate-500 mt-1">
              left
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Metrics Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-slate-100 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            <span>Used</span>
          </div>
          <span className="block mt-1 text-sm font-bold text-slate-800">
            {used}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Pending</span>
          </div>
          <span className="block mt-1 text-sm font-bold text-slate-800">
            {pending}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Available</span>
          </div>
          <span className="block mt-1 text-sm font-bold text-blue-600">
            {available}
          </span>
        </div>
      </div>
    </div>
  );
}

