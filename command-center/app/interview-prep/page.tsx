import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { loadStoryBank, listPrepReports } from "@/lib/interview";
import { InterviewPrepClient } from "@/components/InterviewPrepClient";

export const dynamic = "force-dynamic";

export default function InterviewPrepPage() {
  const storyBank = loadStoryBank();
  const prepFiles = listPrepReports();
  return (
    <div className="animate-in">
      <PageHeader
        title="Interview Prep"
        subtitle="Generate company-specific prep from your CV + browse your STAR story bank"
        icon={MessageSquareText}
      />
      <InterviewPrepClient storyBank={storyBank} prepFiles={prepFiles} />
    </div>
  );
}
