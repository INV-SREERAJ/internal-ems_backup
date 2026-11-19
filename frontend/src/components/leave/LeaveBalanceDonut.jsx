import React, { useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";

/**
 * Donut progress preview component for leave balances using MUI X-Charts.
 * - Empty state: subtle dotted ring with helper text when no leave type is chosen.
 * - Active state: MUI X-Charts Donut with center "X days left" label
 *   and legend metrics: Used, Pending, This request, Left after.
 */
export default function LeaveBalanceDonut({
  balance,
  requestedDays = 0,
  variant = "default",
}) {
  if (!balance) {
    return (
      <div className="flex items-center gap-4 py-2">
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="9"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-500 leading-snug">
          Choose a leave type to see how this request changes your balance.
        </p>
      </div>
    );
  }

  const allocated = balance.allocatedDays || 0;
  const used = balance.usedDays || 0;
  const pending = balance.pendingDays || 0;
  const available = balance.availableDays || 0;
  const thisRequest = requestedDays || 0;
  const leftAfter = Math.max(0, available - thisRequest);

  // Compute segmented data for MUI X-Charts PieChart
  const chartData = useMemo(() => {
    const items = [];
    if (variant === "drawer" || variant === "horizontal") {
      if (available > 0) {
        items.push({
          id: "free",
          value: available,
          color: "#2563eb",
          label: "Free",
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
      if (used > 0) {
        items.push({
          id: "used",
          value: used,
          color: "#60a5fa",
          label: "Used",
        });
      }
    } else {
      if (leftAfter > 0) {
        items.push({
          id: "remaining",
          value: leftAfter,
          color: "#2563eb",
          label: "Left after",
        });
      }
      if (thisRequest > 0) {
        items.push({
          id: "thisRequest",
          value: thisRequest,
          color: "#0f172a",
          label: "This request",
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
      if (used > 0) {
        items.push({
          id: "used",
          value: used,
          color: "#60a5fa",
          label: "Used",
        });
      }
    }

    // Fallback if balance has 0 across all fields
    if (items.length === 0) {
      items.push({
        id: "empty",
        value: 1,
        color: "#f1f5f9",
        label: "No allocation",
      });
    }

    return items;
  }, [variant, available, leftAfter, thisRequest, pending, used]);

  if (variant === "drawer" || variant === "horizontal") {
    return (
      <div className="flex items-center gap-6">
        {/* MUI X-Charts Donut Ring */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <PieChart
            series={[
              {
                data: chartData,
                innerRadius: 26,
                outerRadius: 36,
                paddingAngle: chartData.length > 1 ? 2 : 0,
                cornerRadius: 3,
                cx: 40,
                cy: 40,
              },
            ]}
            width={80}
            height={80}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            slotProps={{ legend: { hidden: true } }}
          />

          {/* Centered label inside the donut hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              {available}
            </span>
            <span className="text-[9px] font-medium text-slate-500 mt-0.5">
              left
            </span>
          </div>
        </div>

        {/* Breakdown row as shown in Wireframe 3 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Used</span>
              </div>
              <span className="text-sm font-bold text-slate-800 ml-3.5 block mt-0.5">
                {used}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending</span>
              </div>
              <span className="text-sm font-bold text-slate-800 ml-3.5 block mt-0.5">
                {pending}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Free</span>
              </div>
              <span className="text-sm font-bold text-slate-800 ml-3.5 block mt-0.5">
                {available}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-medium">
            {allocated} days allocated
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-5">
        {/* MUI X-Charts Donut Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <PieChart
            series={[
              {
                data: chartData,
                innerRadius: 30,
                outerRadius: 40,
                paddingAngle: chartData.length > 1 ? 2 : 0,
                cornerRadius: 3,
                cx: 48,
                cy: 48,
              },
            ]}
            width={96}
            height={96}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            slotProps={{ legend: { hidden: true } }}
          />

          {/* Centered label inside the donut hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {leftAfter}
            </span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">
              days left
            </span>
          </div>
        </div>

        {/* Title & Allocation info */}
        <div>
          <h4 className="m-0 text-base font-semibold text-slate-900">
            {balance.leaveTypeName}
          </h4>
          <p className="mt-0.5 mb-0 text-xs text-slate-500">
            {allocated} days allocated in {balance.year}
          </p>
        </div>
      </div>

      {/* Breakdown Legend Metrics */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-5 pt-4 border-t border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Used</span>
          </div>
          <span className="text-base font-semibold text-slate-800 ml-3.5">
            {used}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pending</span>
          </div>
          <span className="text-base font-semibold text-slate-800 ml-3.5">
            {pending}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span>This request</span>
          </div>
          <span className="text-base font-semibold text-slate-800 ml-3.5">
            {thisRequest}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Left after</span>
          </div>
          <span className="text-base font-semibold text-blue-600 ml-3.5">
            {leftAfter}
          </span>
        </div>
      </div>
    </div>
  );
}

