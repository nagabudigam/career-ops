# Career-Ops Command Center

A local-first **Next.js** dashboard over the [career-ops](../) job-search pipeline.
Browse your tracker and evaluation reports, manage the pending-URL pipeline, trigger
zero-token portal scans, view conversion analytics & follow-up cadence, and run
**fully private JD evaluations on your own machine via Ollama**.

> Dark-first SaaS UI · responsive across phone / tablet / desktop · reads your real
> `data/`, `reports/`, and `config/` files directly.

## Quick start

```bash
cd command-center
npm install          # already done if you used the setup
npm run dev          # http://localhost:4321
```

The app reads the parent career-ops repo automatically (it lives at `career-ops/command-center`).

### Local JD evaluation (Ollama)

The **Evaluate** page generates a full A–F report from a local model — no API keys,
nothing leaves your machine. Make sure Ollama is running:

```bash
ollama serve              # start the server
ollama list               # see installed models
```

The model picker auto-detects whatever you have pulled (e.g. `qwen3.6`, `gemma4`).

## Pages

| Route            | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| `/scan`          | Portal-scanner history + a dry-run/live trigger for `scan.mjs`                |
| `/evaluate`      | Paste a JD → streaming A–F report from Ollama → **Save to tracker** (1 click) |
| `/inbox`         | Watches your Gmail (IMAP) for replies, classifies them with Ollama, links to the tracker |
| `/`              | KPIs, status breakdown, score distribution, recent evaluations, new-response alert |
| `/applications`  | Tracker as a **table or Kanban board** (drag to update status) + reply indicators |
| `/reports`       | All evaluation reports; click through to the rendered A–G report             |
| `/pipeline`      | Pending-URL inbox + **liveness checks** (`check-liveness.mjs`)                |
| `/cv`            | Tailor `cv.md` to a JD via Ollama, then export an ATS-clean **PDF**           |
| `/interview-prep`| Generate company-specific prep from your CV + browse your STAR story bank     |
| `/analytics`     | Conversion funnel, blockers, archetype performance, recommendations           |
| `/followups`     | Follow-up cadence & overdue alerts (`followup-cadence.mjs`)                   |
| `/maintenance`   | Run verify / dedup / normalize / merge + reconcile missing report files       |
| `/profile`       | Candidate profile from `config/*.yml`                                         |

Press **⌘K** (or the Search button) anywhere for a global command palette across pages, applications, and reports.

## Writes & safety

The app can mutate your data, always through the existing career-ops contract:
- **Evaluate → Save** writes a `reports/NNN-*.md` file + a `batch/tracker-additions/*.tsv`, then runs `merge-tracker.mjs` (never edits `applications.md` directly to add rows).
- **Kanban / Inbox status changes** edit the Status/Notes of *existing* rows in `applications.md` (allowed).
- **Maintenance** actions default to `--dry-run`; you opt in to "Apply".

## Inbox setup (Gmail)

Add an App Password (requires 2-Step Verification) to `command-center/.env.local`:

```
IMAP_USER=you@gmail.com
IMAP_PASSWORD=your-16-char-app-password
```

Get the app password at https://myaccount.google.com/apppasswords. Read-only, fully local. The app matches senders/subjects against companies you've marked **Applied**, optionally classifies each reply with your local model, and shows a count badge on the Inbox nav.

## Desktop app (macOS & Windows)

The same app ships as a native desktop application via **Electron**. The Electron
main process boots the Next.js **standalone** server using Electron's own bundled
Node (so no separate Node install is required), then loads it in a window.

```bash
npm run desktop       # dev: launches Electron against `next dev`
npm run dist:mac      # build a signed-optional .dmg + .zip  → dist/
npm run dist:win      # build a Windows NSIS installer        → dist/  (run on Windows/CI)
npm run dist          # build for the current OS
```

- **First run** asks you to pick your career-ops repo folder (stored in the app's
  userData). It's remembered after that; change it any time via **File → Choose
  Career-Ops Folder…**.
- The desktop build reads `IMAP_*` / `OLLAMA_HOST` from `<repo>/command-center/.env.local`,
  so the Inbox works exactly as in the web app.
- The career-ops `.mjs` scripts (scan, analyze-patterns, generate-pdf via
  Playwright, merge-tracker, …) run from your repo using its own `node_modules`.
- **Code signing** is off by default (unsigned builds work locally). To sign +
  notarize macOS, remove `mac.identity: null` in `electron-builder.yml` and set
  `CSC_LINK` / `CSC_KEY_PASSWORD` (+ `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD`).
  Windows uses an Authenticode cert via `CSC_LINK`.
- macOS `.dmg` must be built on macOS; Windows `.exe` on Windows (or use a CI
  matrix).

### App icon

The icon (a North-Star / compass mark in the indigo→cyan brand gradient) lives in
`build/` and is auto-detected by electron-builder:

- `build/icon.svg` — editable source
- `build/icon.png` (1024²), `build/icon.icns` (macOS), `build/icon.ico` (Windows)

To regenerate after editing `icon.svg` (run from the repo root):

```bash
node command-center/electron/svg-to-png.mjs command-center/build/icon.svg command-center/build/icon.png 1024   # rasterize (Playwright)
# .icns  (macOS, via native iconutil):
cd command-center/build && for s in 16 32 128 256 512; do sips -z $s $s icon.png --out icon.iconset/icon_${s}x${s}.png; done && iconutil -c icns icon.iconset -o icon.icns
# .ico   (Windows, no deps):
node command-center/electron/make-ico.mjs command-center/build/icon.ico <16,32,48,64,128,256 pngs>
```

## Configuration

Copy `.env.example` to `.env.local` to override:

- `CAREER_OPS_ROOT` — path to the career-ops repo (for future remote deploys).
- `OLLAMA_HOST` — Ollama server URL (default `http://localhost:11434`).

## How it reads data

Read-only pages parse the markdown / TSV / YAML files at request time
(`force-dynamic`), so the dashboard always reflects the current state of your repo.
Action endpoints shell out to the existing `.mjs` scripts (`scan.mjs`,
`analyze-patterns.mjs`, `followup-cadence.mjs`) from the repo root — no logic is
duplicated. Evaluations are **never** auto-written to the tracker; you review and
export them yourself.

## Stack

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts ·
lucide-react · react-markdown.
