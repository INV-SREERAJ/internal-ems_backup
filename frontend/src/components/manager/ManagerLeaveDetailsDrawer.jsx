import LeaveDetailsDrawer from "../leave/LeaveDetailsDrawer";

/**
 * ManagerLeaveDetailsDrawer
 * Re-exports the unified LeaveDetailsDrawer configured with mode="manager".
 */
export default function ManagerLeaveDetailsDrawer(props) {
  return <LeaveDetailsDrawer {...props} mode="manager" />;
}
