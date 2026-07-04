import { FileBadge } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { CvClient } from "@/components/CvClient";

export const dynamic = "force-dynamic";

export default function CvPage() {
  return (
    <div className="animate-in">
      <PageHeader
        title="CV / PDF"
        subtitle="Tailor your CV to a job with your local model, then export an ATS-clean PDF"
        icon={FileBadge}
      />
      <CvClient />
    </div>
  );
}
