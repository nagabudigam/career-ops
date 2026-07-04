"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export function InboxAlert() {
  const [data, setData] = useState<{ configured: boolean; count: number; companies: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/inbox?classify=false")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.configured) {
          setData({ configured: false, count: 0, companies: [] });
          return;
        }
        const companies = Array.from(new Set((d.emails ?? []).map((e: any) => e.company))).slice(0, 4) as string[];
        setData({ configured: true, count: d.emails?.length ?? 0, companies });
      })
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  if (!data.configured) {
    return (
      <Link href="/inbox" className="block">
        <div className="card p-5 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2 font-medium">
            <Mail size={18} className="text-[var(--color-text-faint)]" /> Connect your inbox
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Watch your job-search email and auto-surface replies from companies you applied to.
          </p>
        </div>
      </Link>
    );
  }

  if (data.count === 0) return null;

  return (
    <Link href="/inbox" className="block">
      <div className="card p-5 bg-gradient-to-br from-[var(--color-good)]/15 to-transparent border-[var(--color-good)]/30 hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Mail size={18} className="text-[var(--color-good)]" /> {data.count} new {data.count === 1 ? "response" : "responses"}
          </div>
          <ArrowRight size={15} className="text-[var(--color-text-faint)]" />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
          {data.companies.length ? `From ${data.companies.join(", ")}${data.count > data.companies.length ? "…" : ""}` : "Companies have replied to your applications."}
        </p>
      </div>
    </Link>
  );
}
