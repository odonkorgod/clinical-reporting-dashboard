# Clinical Workflow & Telemetry Dashboard (VR Research Prototype)
## 🎯 Project Objective
The primary objective of this project is to develop a high-fidelity, web-based dashboard that simulates Clinical Decision Support (CDS) and Electronic Health Record (EHR) workflows. It serves as a technical precursor to Virtual Reality (VR) simulation modules, focusing on:

**Workflow Validation**: Replicating real-world informatics scenarios to identify bottlenecks in clinical data entry.

**User Telemetry**: Implementing structured data collection (interaction logs) to evaluate user performance under varying cognitive loads.

**Stress-Response Modeling**: Testing UI/UX effectiveness during simulated "High-Stress" clinical alarms.

## 🛠️ Technical Stack
Frontend: React 19, TypeScript, Vite.

Styling: Tailwind CSS (Medical-grade, high-contrast UI).

Data Visualization: Recharts (Analytical performance tracking).

Synthetic Data: Seeded TypeScript generator (`scripts/generate-synthetic-data.ts`) that shares its risk-scoring code with the app.

State Management: React Hooks, plus an app-wide interaction log persisted to LocalStorage.

## 🚀 Key Features
1. **Patient Status & Vitals Monitoring**
Real-time visualization of patient vitals (Heart Rate, BP, SpO₂, Temp).

Informatics Logic: Risk badges (High/Medium/Low) are computed in the app from a simplified NEWS2 early-warning score over HR, systolic BP, SpO₂ and temperature (`src/lib/clinical.ts`). Simulation only; not a validated clinical tool.

2. **Interaction Telemetry (Research Tool)**
Granular Logging: Reviewing or acknowledging patients and diagnostic results, navigating, and toggling stress mode are logged automatically; other actions can be logged by hand. Each event records the user, patient, section, stress-mode state, and response timings.

**Data Portability**: Features a robust CSV Export engine, enabling direct integration with statistical analysis tools like R or pandas.

3. **Simulation Stress Mode**
Toggles a high-intensity UI state to simulate emergency room conditions.

Visual indicators and animations designed to test user accuracy and "Human Factors" during clinical alarms.

## 🧪 Running Locally
```sh
pnpm install
pnpm dev             # start the dashboard
pnpm build           # type-check and production build
pnpm generate:data   # regenerate src/data/syntheticData.ts (pass a seed: pnpm generate:data -- 1234)
```

## 📊 Interaction Log Export
**Export** on the Interaction Logs screen downloads `vr_interaction_logs.csv`, oldest event first:

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

