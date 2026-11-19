// Fixed action vocabulary, so exported logs can be grouped reliably in R/pandas.

/** Actions recorded automatically by the dashboard. */
export const AUTO_ACTIONS = {
  openedSection: 'Opened section',
  stressModeOn: 'Stress mode activated',
  stressModeOff: 'Stress mode deactivated',
  reviewedPatient: 'Reviewed patient chart',
  acknowledgedPatientAlert: 'Acknowledged high-risk alert',
  reviewedResult: 'Reviewed diagnostic result',
  acknowledgedCriticalResult: 'Acknowledged critical result',
} as const;

/** Actions the participant can record by hand in the Interaction Logger. */
export const MANUAL_ACTIONS = [
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
] as const;
