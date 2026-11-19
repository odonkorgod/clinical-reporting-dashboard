# Clinical Workflow & Telemetry Dashboard (VR Research Prototype)
## 🎯 Project Objective
The primary objective of this project is to develop a high-fidelity, web-based dashboard that simulates Clinical Decision Support (CDS) and Electronic Health Record (EHR) workflows. It serves as a technical precursor to Virtual Reality (VR) simulation modules, focusing on:

**Workflow Validation**: Replicating real-world informatics scenarios to identify bottlenecks in clinical data entry.

**User Telemetry**: Implementing structured data collection (interaction logs) to evaluate user performance under varying cognitive loads.

**Stress-Response Modeling**: Testing UI/UX effectiveness during simulated "High-Stress" clinical alarms.

## 🛠️ Technical Stack
Frontend: React 19, TypeScript, Vite.

Backend: Node.js API (Hono) with Prisma ORM on Neon Postgres.

Styling: Tailwind CSS (Medical-grade, high-contrast UI).

Data Visualization: Recharts (Analytical performance tracking).

Synthetic Data: Seeded TypeScript generator (`backend/scripts/generate-seed-data.ts`) that shares its risk-scoring code with the app, loaded into Postgres by `pnpm db:seed`.

State Management: React Hooks, plus an app-wide interaction log that is cached in LocalStorage and uploaded to the database.

## 🚀 Key Features
1. **Patient Status & Vitals Monitoring**
Real-time visualization of patient vitals (Heart Rate, BP, SpO₂, Temp).

Informatics Logic: Risk badges (High/Medium/Low) are computed in the app from a simplified NEWS2 early-warning score over HR, systolic BP, SpO₂ and temperature (`shared/src/clinical.ts`). Simulation only; not a validated clinical tool.

2. **Interaction Telemetry (Research Tool)**
Granular Logging: Reviewing or acknowledging patients and diagnostic results, navigating, and toggling stress mode are logged automatically; other actions can be logged by hand. Each event records the user, patient, section, stress-mode state, and response timings.

**Central Storage**: Every event is uploaded to the `interaction_events` table. Events recorded offline wait in a local outbox and are retried automatically.

**Data Portability**: CSV export (per browser, or every session from the server), enabling direct integration with statistical analysis tools like R or pandas.

3. **Simulation Stress Mode**
Toggles a high-intensity UI state to simulate emergency room conditions.

Visual indicators and animations designed to test user accuracy and "Human Factors" during clinical alarms.

## 🗂️ Project Structure
```
frontend/   React dashboard (Vite). Loads data from the API.
backend/    Hono API + Prisma schema, migrations, seed and data generator.
shared/     Types and clinical risk scoring used by both.
neon.ts     Neon project configuration (Neon CLI).
```

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | API and database status |
| `GET /api/dataset` | Patients, diagnostics, wait times and dataset metadata |
| `POST /api/events` | Ingest a batch of interaction events (idempotent by event ID) |
| `GET /api/events/export.csv` | All stored events as CSV; filter with `?sessionId=` or `?userId=` |

## 🧪 Running Locally
Requires Node 24+, pnpm and the [Neon CLI](https://neon.com/docs/cli) (`npx neon@latest`).

```sh
pnpm install
npx neon@latest login     # once
npx neon@latest env pull  # writes DATABASE_URL / DATABASE_URL_UNPOOLED to .env.local
pnpm db:migrate           # apply Prisma migrations (uses the direct connection)
pnpm db:seed              # load the synthetic dataset (does not touch interaction_events)

pnpm dev                  # API on :3001 + dashboard on :5173 (proxies /api)
pnpm build && pnpm start  # production: the API serves the built dashboard on :3001
```

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm generate:data` (regenerate `backend/prisma/seed-data.json`; pass a seed with `pnpm generate:data -- 1234`, then re-run `pnpm db:seed`).

Schema changes: edit `backend/prisma/schema.prisma`, then `pnpm --filter @clinflow/backend db:migrate:dev --name <change>`. Test migrations on a Neon branch (`npx neon@latest checkout <name> --create`) before applying them to `production`.

## 📊 Interaction Log Export
**Export** on the Interaction Logs screen downloads this browser's events as `vr_interaction_logs.csv`. **Server CSV** (or `GET /api/events/export.csv`) downloads every stored event and adds a `ReceivedAt` column. Both are oldest event first:

| Column | Meaning |
|---|---|
| ID, SessionID | Unique event ID; one session per page load |
| Timestamp | ISO 8601, UTC |
| UserID | Simulated participant ID |
| Source | `manual`, `patients`, `diagnostics` or `system` |
| Section | Screen the user was on |
| Action, Detail | Fixed action name, plus context such as the test name |
| PatientID, TargetID | Patient and specific item (e.g. diagnostic result) acted on |
| StressMode | Whether high-stress mode was active |
| MsSinceSectionOpen | Milliseconds since the current screen was opened |
| MsSinceAlarmOnset | Milliseconds since stress mode was switched on (blank when off) |

