import dayjs from "dayjs";

/**
 * Formats a leave date range cleanly:
 * - Same day: "05 Nov 2026"
 * - Same month & year: "02–04 Nov 2026"
 * - Same year, different month: "28 Oct – 04 Nov 2026"
 * - Different years: "28 Dec 2025 – 03 Jan 2026"
 */
export function formatLeaveDateRange(fromDate, toDate) {
  if (!fromDate) return "—";
  const start = dayjs(fromDate);
  const end = toDate ? dayjs(toDate) : start;

  if (start.isSame(end, "day")) {
    return start.format("DD MMM YYYY");
  }
  if (start.isSame(end, "month") && start.isSame(end, "year")) {
    return `${start.format("DD")}–${end.format("DD MMM YYYY")}`;
  }
  if (start.isSame(end, "year")) {
    return `${start.format("DD MMM")} – ${end.format("DD MMM YYYY")}`;
  }
  return `${start.format("DD MMM YYYY")} – ${end.format("DD MMM YYYY")}`;
}

/**
 * Formats a date & time string: "16 Oct 2026, 09:45"
 */
export function formatDateTime(dt) {
  if (!dt) return "—";
  return dayjs(dt).format("DD MMM YYYY, HH:mm");
}

/**
 * Formats a simple date string: "16 Oct 2026"
 */
export function formatDate(dt) {
  if (!dt) return "—";
  return dayjs(dt).format("DD MMM YYYY");
}

export default {
  formatLeaveDateRange,
  formatDateTime,
  formatDate,
};

