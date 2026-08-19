/**
 * Shared constants for the EMS application.
 * Single source of truth for role/status enums and validation patterns.
 */

// ── Role enum (numeric values sent to the backend) ──────────────────
export const ROLES = {
  Admin: 1,
  Manager: 2,
  Employee: 3,
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
  Deleted: 3,
};

export const STATUS_LABEL = {
  [EMPLOYEE_STATUS.Active]: "Active",
  [EMPLOYEE_STATUS.Inactive]: "Inactive",
  [EMPLOYEE_STATUS.Deleted]: "Deleted",
};

/** Maps numeric status → CSS class suffix for badge styling */
export const STATUS_CLASS = {
  [EMPLOYEE_STATUS.Active]: "employee-status-active",
  [EMPLOYEE_STATUS.Inactive]: "employee-status-inactive",
  [EMPLOYEE_STATUS.Deleted]: "employee-status-deleted",
};

// ── Validation patterns ─────────────────────────────────────────────
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Indian 10-digit mobile: starts with 6-9 */
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMPLOYEE_CODE_REGEX: /^EMP\d{8}$/,
};
