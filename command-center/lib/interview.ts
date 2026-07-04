import fs from "node:fs";
import path from "node:path";
import { repoRoot, safeRead } from "./paths";

const PREP_DIR = () => path.join(repoRoot(), "interview-prep");

export function loadStoryBank(): string | null {
  return safeRead(path.join(PREP_DIR(), "story-bank.md"));
}

export interface PrepFile {
  slug: string;
  title: string;
}

export function listPrepReports(): PrepFile[] {
  try {
    return fs
      .readdirSync(PREP_DIR())
      .filter((f) => f.endsWith(".md") && f !== "story-bank.md")
      .map((f) => ({
        slug: f.replace(/\.md$/, ""),
        title: f.replace(/\.md$/, "").replace(/-/g, " "),
      }));
  } catch {
    return [];
  }
}

export function loadPrepReport(slug: string): string | null {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  return safeRead(path.join(PREP_DIR(), `${slug}.md`));
}
