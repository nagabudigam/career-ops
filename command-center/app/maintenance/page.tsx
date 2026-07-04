import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { MaintenanceClient } from "@/components/MaintenanceClient";

export const dynamic = "force-dynamic";

export default function MaintenancePage() {
  return (
    <div className="animate-in">
      <PageHeader
        title="Maintenance"
        subtitle="Run pipeline health checks and fix data integrity issues"
        icon={Wrench}
      />
      <MaintenanceClient />
    </div>
  );
}
