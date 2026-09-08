/**
 * Shared constants for the EMS application.
 * Single source of truth for role/status enums and validation patterns.
 */

// ── Role enum (numeric values sent to the backend) ──────────────────
export const ROLES = {
  Admin: 1,
  Manager: 3,
  Employee: 2,
};

/** Reverse lookup: numeric role → display label */
export const ROLE_LABEL = {
  [ROLES.Admin]: "Admin",
  [ROLES.Manager]: "Manager",
  [ROLES.Employee]: "Employee",
};

// ── Employee status enum ────────────────────────────────────────────
export const EMPLOYEE_STATUS = {
  Active: 1,
  Inactive: 2,
  Deleted: 9,
};

export const STATUS_LABEL = {
  [EMPLOYEE_STATUS.Active]: "Active",
  [EMPLOYEE_STATUS.Inactive]: "Inactive",
  [EMPLOYEE_STATUS.Deleted]: "Deleted",
};

/** Maps numeric status → Tailwind color classes for badge styling */
export const STATUS_CLASS = {
  [EMPLOYEE_STATUS.Active]: "bg-green-100 text-green-800",
  [EMPLOYEE_STATUS.Inactive]: "bg-amber-100 text-amber-800",
  [EMPLOYEE_STATUS.Deleted]: "bg-red-100 text-red-800",
};

// ── Validation patterns ─────────────────────────────────────────────
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Indian 10-digit mobile: starts with 6-9 */
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMPLOYEE_CODE_REGEX: /^EMP\d{8}$/,
};