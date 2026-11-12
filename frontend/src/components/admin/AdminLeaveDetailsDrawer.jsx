import LeaveDetailsDrawer from "../leave/LeaveDetailsDrawer";
import { formatLeaveDateRange as formatLeaveDates } from "../../utils/dateUtils";

export { formatLeaveDates };

/**
 * AdminLeaveDetailsDrawer
 * Re-exports the unified LeaveDetailsDrawer configured with mode="admin".
 */
export default function AdminLeaveDetailsDrawer(props) {
  return <LeaveDetailsDrawer {...props} mode="admin" />;
}
