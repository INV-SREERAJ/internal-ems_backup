import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlinePencilSquare,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { ROLES, ROLE_LABEL } from "../utils/constants";

/**
 * Role-based navigation and layout configurations.
 * Serves as the single source of truth for Navbar branding,
 * Sidebar navigation items, and profile menu options.
 */
export const ROLE_LAYOUT_CONFIG = {
  [ROLE_LABEL[ROLES.Admin]]: {
    brand: {
      to: "/admin",
      label: "Workforce",
      highlight: "OS",
      badge: "Admin",
    },
    sidebarNav: [
      {
        to: "/admin",
        label: "Dashboard",
        icon: HiOutlineSquares2X2,
        end: true,
      },
      {
        to: "/admin/employees",
        label: "Employees",
        icon: HiOutlineUsers,
        end: true,
      },
      {
        to: "/admin/employees/create-employee",
        label: "Add Employee",
        icon: HiOutlineUserPlus,
        end: true,
      },
      {
        label: "Leave Management",
        icon: HiOutlineCalendarDays,
        children: [
          {
            to: "/admin/leave-types",
            label: "Leave Types",
          },
          {
            to: "/admin/yearly-configuration",
            label: "Yearly Configuration",
          },
          {
            to: "/admin/leave-requests",
            label: "All Leave requests",
          },
        ],
      },
    ],
    profileMenu: (user) => [
      {
        to: `/admin/profile`,
        label: "My Profile",
        icon: HiOutlinePencilSquare,
      },
    ],
    getProfileButtonText: () => "Profile",
  },

  [ROLE_LABEL[ROLES.Manager]]: {
    brand: {
      to: "/manager",
      label: "Workforce",
      highlight: "OS",
      badge: "Manager",
    },
    sidebarNav: [
      {
        to: "/manager",
        label: "Dashboard",
        icon: HiOutlineSquares2X2,
        end: true,
      },
      {
        to: "/manager/team",
        label: "My Team",
        icon: HiOutlineUserGroup,
        end: true,
      },
      {
        label: "Team Leaves",
        icon: HiOutlineCalendarDays,
        children: [
          {
            to: "/manager/leaves/pending",
            label: "Pending Requests",
          },
          {
            to: "/manager/leaves/all",
            label: "All Team Leaves",
          },
          {
            to: "/manager/leaves/calendar",
            label: "Team Calendar",
          },
        ],
      },
      {
        to: "/manager/my-manager",
        label: "My Manager",
        icon: HiOutlineUsers,
        end: true,
      },
      {
        to: "/manager/profile",
        label: "My Profile",
        icon: HiOutlineUser,
        end: true,
      },
    ],
    profileMenu: () => [
      {
        to: "/manager/profile",
        label: "My Profile",
        icon: HiOutlineUser,
      },
    ],
    getProfileButtonText: () => "Profile",
  },

  [ROLE_LABEL[ROLES.Employee]]: {
    brand: {
      to: "/employee",
      label: "Workforce",
      highlight: "OS",
      badge: "Employee",
    },
    sidebarNav: [
      {
        to: "/employee",
        label: "Dashboard",
        icon: HiOutlineSquares2X2,
        end: true,
      },
      {
        label: "My Leaves",
        icon: HiOutlineCalendarDays,
        children: [
          {
            to: "/employee/leaves/apply",
            label: "Apply",
            end: true,
          },
          {
            to: "/employee/leaves",
            label: "Balances and Requests",
            end: true,
          },
          {
            to: "/employee/leaves/calendar",
            label: "Leave Calendar",
            end: true,
          },
        ],
      },
      {
        to: "/employee/profile",
        label: "My Profile",
        icon: HiOutlineUser,
        end: true,
      },
    ],
    profileMenu: () => [
      {
        to: "/employee/profile",
        label: "My Profile",
        icon: HiOutlineUser,
      },
    ],
    getProfileButtonText: () => "Profile",
  },
};

/**
 * Helper to retrieve layout config for a given role or fallback to Admin.
 */
export function getLayoutConfig(role) {
  return (
    ROLE_LAYOUT_CONFIG[role] || ROLE_LAYOUT_CONFIG[ROLE_LABEL[ROLES.Admin]]
  );
}
