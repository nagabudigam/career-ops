// Shared domain types for the Career-Ops Command Center.

export interface Application {
  num: number;
  date: string;
  company: string;
  role: string;
  score: number | null; // numeric 0-5, null when N/A
  scoreRaw: string; // original cell, e.g. "4.3/5" | "N/A" | "DUP"
  status: string; // canonical id, lowercased
  statusLabel: string;
  pdf: boolean;
  reportNum: string | null;
  reportSlug: string | null; // filename without extension, resolved from reports/
  notes: string;
}

export interface ReportMeta {
  id: string; // report number as string
  slug: string; // filename without .md
  file: string; // filename with .md
  company: string | null;
  role: string | null;
  date: string | null;
  score: number | null;
  legitimacy: string | null;
  archetype: string | null;
}

export interface ReportDetail extends ReportMeta {
  markdown: string;
  headings: { id: string; text: string; level: number }[];
}

export interface PipelineItem {
  url: string;
  company: string;
  role: string;
  done: boolean;
  section: string;
}

export interface ScanRow {
  url: string;
  date: string;
  provider: string;
  title: string;
  company: string;
  status: string;
  location: string;
}

export interface StateDef {
  id: string;
  label: string;
  aliases: string[];
  description: string;
  group: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  family?: string;
  parameterSize?: string;
  modified?: string;
}

export interface Profile {
  fullName?: string;
  email?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  huggingface?: string;
  headline?: string;
  exitStory?: string;
  superpowers?: string[];
  proofPoints?: { name: string; heroMetric?: string; detail?: string }[];
  targetRoles?: string[];
  archetypes?: string[];
  compMin?: string;
  compMax?: string;
  compCurrency?: string;
}
