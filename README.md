# Clinical Workflow & Telemetry Dashboard (VR Research Prototype)
## 🎯 Project Objective
The primary objective of this project is to develop a high-fidelity, web-based dashboard that simulates Clinical Decision Support (CDS) and Electronic Health Record (EHR) workflows. It serves as a technical precursor to Virtual Reality (VR) simulation modules, focusing on:

**Workflow Validation**: Replicating real-world informatics scenarios to identify bottlenecks in clinical data entry.

**User Telemetry**: Implementing structured data collection (interaction logs) to evaluate user performance under varying cognitive loads.

**Stress-Response Modeling**: Testing UI/UX effectiveness during simulated "High-Stress" clinical alarms.

## 🛠️ Technical Stack
Frontend: React 18, TypeScript, Vite.

Styling: Tailwind CSS (Medical-grade, high-contrast UI).

Data Visualization: Recharts (Analytical performance tracking).

Backend Simulation: Python-generated synthetic clinical datasets (JSON/CSV).

State Management: React Hooks with LocalStorage persistence for session continuity.

## 🚀 Key Features
1. **Patient Status & Vitals Monitoring**
Real-time visualization of patient vitals (Heart Rate, BP, SpO₂, Temp).

Informatics Logic: Automated risk-stratification badges (High/Medium/Low) based on clinical thresholds.

2. **Interaction Telemetry (Research Tool)**
Granular Logging: Every clinical action is timestamped and attributed to a unique User ID.

**Data Portability**: Features a robust CSV Export engine, enabling direct integration with statistical analysis tools like R or pandas.

3. **Simulation Stress Mode**
Toggles a high-intensity UI state to simulate emergency room conditions.

Visual indicators and animations designed to test user accuracy and "Human Factors" during clinical alarms.