import { Briefcase } from "lucide-react";
import { loadApplications } from "@/lib/applications";
import { allStates } from "@/lib/states";
import { PageHeader } from "@/components/ui";
import { ApplicationsView } from "@/components/ApplicationsView";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ min?: string }>;
}) {
  const { min } = await searchParams;
  const apps = loadApplications();
  const states = allStates();
  const initialMin = min ? Number(min) : 0;

  return (
    <div className="animate-in">
      <PageHeader
        title="Applications"
        subtitle={`${apps.length} tracked roles from data/applications.md`}
        icon={Briefcase}
      />
      <ApplicationsView apps={apps} states={states} initialMin={initialMin} />
    </div>
  );
}
