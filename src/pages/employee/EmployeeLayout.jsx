import AppLayout from "../../components/common/AppLayout";
import { ROLES, ROLE_LABEL } from "../../utils/constants";

export default function EmployeeLayout() {
  return <AppLayout role={ROLE_LABEL[ROLES.Employee]} />;
}
