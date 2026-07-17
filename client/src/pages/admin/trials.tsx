import { TrialManagement } from "@/components/admin/trial-management";
import { AdminLayout } from "@/components/admin/admin-layout";

export default function AdminTrials() {
  return (
    <AdminLayout
      title="Trial Management"
      description="Configure trial rules, process expired trials, and control individual trial users."
    >
      <TrialManagement />
    </AdminLayout>
  );
}
