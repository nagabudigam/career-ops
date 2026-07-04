import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { EvaluateClient } from "@/components/EvaluateClient";

export const dynamic = "force-dynamic";

export default function EvaluatePage() {
  return (
    <div className="animate-in">
      <PageHeader
        title="Evaluate a job"
        subtitle="Paste a JD → full A–F report from your local Ollama model (private, on-device)"
        icon={Sparkles}
      />
      <EvaluateClient />
    </div>
  );
}
