/**
 * Single source of truth for canonical user-facing copy strings.
 */

export const DECISION_SUPPORT_DISCLAIMER =
  'This result is for decision support only. It does not confirm a disease.';

export const CASE_CLOSE_NOTICE =
  'Completing this visit saves your field findings. It does not verify or close the case.';

export const LOCATION_ADDED = 'Location added';

export const LOCATION_UNCONFIRMED = 'Location could not be confirmed';

export const PERSONAL_SCAN_LOCAL_STATUS = 'On this device · not sent';

export const FIELD_SURVEY_COPY = {
  title: 'Measure a field boundary',
  quickActionTitle: 'Measure a plot',
  quickActionBody: 'Draw or walk a field boundary',
  newSurvey: 'Start a new boundary',
  startNewBoundaryAfterRejection: 'Start a new boundary with a fresh identity',
  surveyIdentityRejected: 'This boundary identity was rejected. Start a new boundary with a fresh identity before sending again.',
  resumedSurvey: 'Resumed your saved boundary draft on this device.',
  intro: 'Draw a plot boundary on the map or walk it with GPS. Your points and area stay on this device until you sync while signed in.',
  districtLabel: 'District code',
  districtPlaceholder: 'Enter your assigned district code',
  districtRequired: 'Enter a district code before syncing.',
  mapHeading: 'Boundary map',
  mapHelp: 'Tap to add a point. Select a point below, then tap the map to move it. Map drawing also works without tiles.',
  mapAccessibility: 'Tap to add or move a boundary vertex',
  mapTileError: 'Some map tiles could not be loaded. You can still draw and measure the boundary over the coordinate-only map.',
  mapAttribution: '© OpenStreetMap contributors',
  offlineMap: 'Offline map imagery is not available. Your boundary and measured area continue to work on this coordinate screen.',
  drawMode: 'Draw boundary',
  addGpsPoint: 'Capture GPS point',
  capturingGps: 'Getting GPS…',
  undo: 'Undo last point',
  removeSelected: 'Remove selected',
  pointsHeading: 'Boundary points',
  selectPoint: (number: number) => `Select boundary point ${number} to move or remove it`,
  gps: 'GPS',
  map: 'Map',
  accuracy: 'Accuracy',
  accuracyUnknown: 'Accuracy unknown',
  gpsAccuracyUnknown: 'GPS point saved; device accuracy was not reported.',
  gpsAccuracyWeak: (meters: number) => `GPS accuracy is about ±${meters.toFixed(1)} m. Review this point before syncing.`,
  gpsPermissionDenied: 'Location permission is off. You can continue by drawing on the map.',
  gpsDisabled: 'Turn on device location to capture a GPS point. Your draft is unchanged.',
  gpsUnavailable: 'Could not read a GPS point. Your draft is unchanged.',
  tapToDraw: 'Tap the map to add points. Select a point below to move it.',
  savingOffline: 'Saving boundary draft…',
  saveFailed: 'The boundary could not be saved. Your previous draft is unchanged.',
  close: 'Close',
} as const;

/** Floating office-updates pill on Home. */
export function officeUpdatesPillLabel(count: number): string {
  return `${count} office ${count === 1 ? 'update' : 'updates'}`;
}

export const OFFICE_UPDATES_OPEN_LABEL = 'Open office updates';

export const OFFICE_UPDATES_DISMISS_LABEL = 'Hide office updates for now';

/** Floating office-updates panel. */
export const OFFICE_UPDATES_PANEL_CLOSE_LABEL = 'Close office updates';

export const OFFICE_UPDATES_MARKED_READ = 'Updates marked as read';

/** Assignment card photo block when no case picture is stored on this device. */
export const ASSIGNMENT_PHOTO_PLACEHOLDER = 'No photo';

/** Activity tab, with the unread count when there is one. */
export function activityTabLabel(count: number): string {
  return count > 0 ? `Activity, ${officeUpdatesPillLabel(count)} unread` : 'Activity';
}

/** Field guide — the open reading surface for sugarcane diseases and pests. */
export const FIELD_GUIDE_TITLE = 'Field guide';

export const FIELD_GUIDE_INTRO =
  'Short reading pages for each sugarcane condition, written for recognition, monitoring, sanitation and reporting.';

export const FIELD_GUIDE_ENTRY_TITLE = 'Field guide — diseases and pests';

export const FIELD_GUIDE_ENTRY_DESCRIPTION = 'Read about sugarcane diseases and pests';

export const FIELD_GUIDE_SECTION_SIGNS = 'Signs';
export const FIELD_GUIDE_SECTION_WHERE_TO_LOOK = 'Where to look';
export const FIELD_GUIDE_SECTION_IMPACT = 'Why it matters';
export const FIELD_GUIDE_SECTION_MANAGEMENT = 'What you can do';
export const FIELD_GUIDE_SECTION_DETAIL = 'More detail';

/**
 * Per-entry app-capability line. RSSI is deliberately the honest "cannot"
 * wording, so nobody scans a leaf expecting a pest result the model can never
 * produce.
 */
export const FIELD_GUIDE_APP_CAN_CHECK = 'The app can check this one';
export const FIELD_GUIDE_APP_CANNOT_CHECK =
  'The app cannot check this one — record it as something you saw';

/** Static label for the app's own observational wording on a model-linked entry. */
export const FIELD_GUIDE_APP_OBSERVATION_LABEL = 'What the app looks for';

export const FIELD_GUIDE_NOT_FOUND_TITLE = 'Entry not found';
export const FIELD_GUIDE_NOT_FOUND_MESSAGE =
  'This field guide entry is not available on this device.';
export const FIELD_GUIDE_NOT_FOUND_ACTION = 'Back to field guide';
