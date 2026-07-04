import { Inbox, Building2, CheckCircle2, Clock } from "lucide-react";
import { loadPipeline, pipelineStats } from "@/lib/pipeline";
import { PageHeader, StatCard } from "@/components/ui";
import { PipelineList } from "@/components/PipelineList";

export const dynamic = "force-dynamic";

export default function PipelinePage() {
  const items = loadPipeline();
  const stats = pipelineStats(items);

  return (
    <div className="animate-in">
      <PageHeader
        title="Pipeline"
        subtitle="Pending job URLs waiting to be evaluated"
        icon={Inbox}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Pending" value={stats.pending} tone="warn" icon={Clock} />
        <StatCard label="Processed" value={stats.done} tone="good" icon={CheckCircle2} />
        <StatCard label="Companies" value={stats.companies} icon={Building2} />
        <StatCard label="Total" value={stats.total} />
      </div>
      <PipelineList items={items} />
    </div>
  );
}
