import { FileText } from "lucide-react";
import { listReports } from "@/lib/reports";
import { PageHeader } from "@/components/ui";
import { ReportsBrowser } from "@/components/ReportsBrowser";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const reports = listReports();
  return (
    <div className="animate-in">
      <PageHeader
        title="Reports"
        subtitle={`${reports.length} evaluation reports (Blocks A–G)`}
        icon={FileText}
      />
      <ReportsBrowser reports={reports} />
    </div>
  );
}
