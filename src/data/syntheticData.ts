// Synthetic patient data
export interface Patient {
  id: string;
  name: string;
  age: number;
  ward: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  spo2: number;
  temperature: number;
  diagnosis: string;
  riskLevel: 'high' | 'medium' | 'low';
  admittedAt: string;
}

export const patients: Patient[] = [
  {
    id: 'PT-001',
    name: 'James Kofi Asante',
    age: 67,
    ward: 'Cardiology',
    heartRate: 118,
    systolic: 165,
    diastolic: 98,
    spo2: 91,
    temperature: 38.9,
    diagnosis: 'Acute Myocardial Infarction',
    riskLevel: 'high',
    admittedAt: '2026-03-28T01:15:00Z',
  },
  {
    id: 'PT-002',
    name: 'Abena Mensah',
    age: 45,
    ward: 'Neurology',
    heartRate: 88,
    systolic: 148,
    diastolic: 90,
    spo2: 96,
    temperature: 37.6,
    diagnosis: 'Transient Ischemic Attack',
    riskLevel: 'medium',
    admittedAt: '2026-03-27T22:40:00Z',
  },
  {
    id: 'PT-003',
    name: 'Kwame Darko',
    age: 31,
    ward: 'General',
    heartRate: 74,
    systolic: 122,
    diastolic: 80,
    spo2: 99,
    temperature: 37.1,
    diagnosis: 'Appendicitis (Post-op)',
    riskLevel: 'low',
    admittedAt: '2026-03-27T18:00:00Z',
  },
  {
    id: 'PT-004',
    name: 'Efua Boateng',
    age: 72,
    ward: 'ICU',
    heartRate: 132,
    systolic: 80,
    diastolic: 50,
    spo2: 87,
    temperature: 39.4,
    diagnosis: 'Septic Shock',
    riskLevel: 'high',
    admittedAt: '2026-03-28T00:05:00Z',
  },
  {
    id: 'PT-005',
    name: 'Yaw Ofori',
    age: 55,
    ward: 'Pulmonology',
    heartRate: 95,
    systolic: 140,
    diastolic: 88,
    spo2: 93,
    temperature: 38.2,
    diagnosis: 'COPD Exacerbation',
    riskLevel: 'medium',
    admittedAt: '2026-03-28T02:30:00Z',
  },
  {
    id: 'PT-006',
    name: 'Akosua Frimpong',
    age: 28,
    ward: 'Obstetrics',
    heartRate: 82,
    systolic: 118,
    diastolic: 76,
    spo2: 98,
    temperature: 36.8,
    diagnosis: 'Preterm Labour (32w)',
    riskLevel: 'medium',
    admittedAt: '2026-03-28T03:10:00Z',
  },
  {
    id: 'PT-007',
    name: 'Nana Agyei',
    age: 60,
    ward: 'Oncology',
    heartRate: 70,
    systolic: 115,
    diastolic: 72,
    spo2: 97,
    temperature: 37.0,
    diagnosis: 'Stage II Colorectal CA (Chemo Cycle 3)',
    riskLevel: 'low',
    admittedAt: '2026-03-27T10:00:00Z',
  },
  {
    id: 'PT-008',
    name: 'Serwaa Kusi',
    age: 19,
    ward: 'Emergency',
    heartRate: 145,
    systolic: 90,
    diastolic: 58,
    spo2: 89,
    temperature: 40.1,
    diagnosis: 'Severe Anaphylaxis',
    riskLevel: 'high',
    admittedAt: '2026-03-28T04:01:00Z',
  },
];

// Synthetic department waiting time data
export interface DeptWaitTime {
  department: string;
  avgWait: number;
  patientCount: number;
}

export const waitingTimes: DeptWaitTime[] = [
  { department: 'Emergency', avgWait: 12, patientCount: 34 },
  { department: 'Cardiology', avgWait: 28, patientCount: 18 },
  { department: 'Radiology', avgWait: 45, patientCount: 27 },
  { department: 'Neurology', avgWait: 35, patientCount: 12 },
  { department: 'General', avgWait: 52, patientCount: 41 },
  { department: 'ICU', avgWait: 8, patientCount: 9 },
  { department: 'Oncology', avgWait: 22, patientCount: 15 },
  { department: 'Obstetrics', avgWait: 18, patientCount: 11 },
];

// Available actions for the Interaction Logger
export const logActions = [
  'Reviewed patient chart',
  'Administered medication',
  'Updated vitals manually',
  'Ordered diagnostic test',
  'Called attending physician',
  'Transferred patient to ICU',
  'Discharged patient',
  'Responded to Code Blue',
  'Updated care plan',
  'Reviewed imaging results',
];
