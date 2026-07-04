import {
  User,
  Mail,
  MapPin,
  Linkedin,
  Github,
  Target,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { loadProfile } from "@/lib/profile";
import { PageHeader, Card, SectionTitle, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const p = loadProfile();

  return (
    <div className="animate-in">
      <PageHeader
        title="Candidate profile"
        subtitle="Read from config/*.yml — the source of truth across all modes"
        icon={User}
      />

      {/* Identity */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="grid place-items-center size-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] text-white text-2xl font-semibold shrink-0">
            {(p.fullName ?? "?").slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{p.fullName ?? "Unknown"}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-[var(--color-text-muted)]">
              {p.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} /> {p.email}
                </span>
              )}
              {p.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {p.location}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {p.linkedin && <LinkPill icon={Linkedin} href={`https://${p.linkedin}`} label="LinkedIn" />}
              {p.github && <LinkPill icon={Github} href={`https://${p.github}`} label="GitHub" />}
            </div>
          </div>
        </div>
      </Card>

      {p.headline && (
        <Card className="mb-4">
          <SectionTitle>Headline</SectionTitle>
          <p className="text-[var(--color-text)] leading-relaxed">{p.headline}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {!!p.targetRoles?.length && (
          <Card>
            <SectionTitle>Target roles</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {p.targetRoles.map((r) => (
                <Pill key={r} tone="brand">
                  <Target size={12} /> {r}
                </Pill>
              ))}
            </div>
            {(p.compMin || p.compMax) && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp size={15} className="text-[var(--color-good)]" />
                <span className="text-[var(--color-text-muted)]">Target comp:</span>
                <span className="font-medium">
                  {p.compCurrency} {p.compMin}
                  {p.compMax ? ` – ${p.compMax}` : "+"}
                </span>
              </div>
            )}
          </Card>
        )}

        {!!p.superpowers?.length && (
          <Card>
            <SectionTitle>Superpowers</SectionTitle>
            <ul className="space-y-2">
              {p.superpowers.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles size={15} className="text-[var(--color-brand-soft)] shrink-0 mt-0.5" />
                  <span className="text-[var(--color-text-muted)]">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {p.exitStory && (
        <Card className="mb-4">
          <SectionTitle>Narrative</SectionTitle>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
            {p.exitStory}
          </p>
        </Card>
      )}

      {!!p.proofPoints?.length && (
        <Card>
          <SectionTitle>Proof points</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.proofPoints.map((pp, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-border)] p-4">
                <div className="font-medium text-sm">{pp.name}</div>
                {pp.heroMetric && (
                  <div className="text-[var(--color-good)] text-sm font-semibold mt-1">
                    {pp.heroMetric}
                  </div>
                )}
                {pp.detail && (
                  <p className="text-xs text-[var(--color-text-faint)] mt-1.5 leading-relaxed line-clamp-4">
                    {pp.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function LinkPill({
  icon: Icon,
  href,
  label,
}: {
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
    >
      <Icon size={13} /> {label} <ExternalLink size={11} className="opacity-60" />
    </a>
  );
}
