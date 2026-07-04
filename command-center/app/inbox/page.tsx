import { Mail } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { InboxClient } from "@/components/InboxClient";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  return (
    <div className="animate-in">
      <PageHeader
        title="Inbox"
        subtitle="Replies from companies you've applied to — matched, classified, and linked to your tracker"
        icon={Mail}
      />
      <InboxClient />
    </div>
  );
}
