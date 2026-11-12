/**
 * Single source of truth for canonical user-facing copy strings.
 */

/**
 * The four words the app uses for its core things, so a screen title, a tab, a
 * filter and an accessibility label all call the same thing by the same name.
 * Routes and stored data keep their technical names.
 */
export const NAMING = {
  visit: 'Visit',
  visits: 'Visits',
  report: 'Report',
  reports: 'Reports',
  scan: 'Scan',
  scans: 'Scans',
  plot: 'Plot',
  plots: 'Plots',
} as const;

export const DECISION_SUPPORT_DISCLAIMER =
  'This result is for decision support only. It does not confirm a disease.';

export const CASE_CLOSE_NOTICE =
  'Completing this visit saves your field findings. It does not verify or close the case.';

export const ACCOUNT_REQUEST_HINT =
  'Need an account? Ask your municipal agriculture office.';

export const LOCATION_ADDED = 'Location added';

export const LOCATION_CLOSER_READING_ACTION = 'Try for a closer reading';

function formatSavedAccuracy(accuracyMeters: number): string {
  return `about ±${Math.max(1, Math.round(accuracyMeters))} m`;
}

export function locationAddedWithAccuracy(accuracyMeters: number | null): string {
  return accuracyMeters === null
    ? LOCATION_ADDED
    : `${LOCATION_ADDED} · ${formatSavedAccuracy(accuracyMeters)}`;
}

export function locationKeptAfterRetry(accuracyMeters: number | null): string {
  return accuracyMeters === null
    ? 'Could not get a new reading. Your saved location is kept.'
    : `Could not get a new reading. Your saved location is kept · ${formatSavedAccuracy(accuracyMeters)}.`;
}

export const LOCATION_UNCONFIRMED = 'Location could not be confirmed';

export const PERSONAL_SCAN_LOCAL_STATUS = 'On this device · not sent';

/**
 * Unfinished report, visit and plot work saved on this phone: listed on Home and
 * Activity and resumed in one tap. A report or visit draft is never sent before
 * it is finished; an unsent plot boundary is listed even while it is queued.
 */
export const UNFINISHED_COPY = {
  label: 'Not finished',
  meta: 'Not finished · saved on this device',
  reportLead: 'Finish your field report',
  visitLead: (referenceCode: string) => `Finish your visit for ${referenceCode}`,
  plotLead: 'Finish your plot boundary',
} as const;

export const FIELD_VALIDATION_UNAVAILABLE =
  `${NAMING.visits} need an active inspector assignment to the pilot district. Ask your office to check your account.`;

export const FIELD_SURVEY_COPY = {
  linkTitle: 'Plot boundary',
  linkHelp: 'Attach a boundary you measured on this phone so the office sees the plot with this report. Optional.',
  linkNone: 'No boundary attached',
  linkEmpty: 'No saved boundaries yet. Measure a plot first, then attach it here.',
  linkAttached: 'Attached to this report',
  linkAttach: 'Attach',
  linkRemove: 'Remove boundary',
  linkOpen: 'View in Measure a plot',
  linkMeasure: 'Measure a plot',
  linkMissing: 'The attached boundary is no longer saved on this phone.',
  linkOption: (district: string, hectares: string, status: string) => `${district} · ${hectares} ha · ${status}`,
  unavailable: 'Boundary surveys need an active inspector assignment to the pilot district. Ask your office to check your account.',
  title: 'Measure a field boundary',
  quickActionTitle: 'Measure a plot',
  quickActionBody: 'Draw or walk a field boundary to attach to a report',
  newSurvey: 'Start a new boundary',
  startNewBoundaryAfterRejection: 'Start a new boundary with a fresh identity',
  surveyIdentityRejected: 'This boundary identity was rejected. Start a new boundary with a fresh identity before sending again.',
  resumedSurvey: 'Resumed your saved boundary draft on this device.',
  intro: 'Draw a plot boundary on the map or walk it with GPS. Your points and area stay on this device until you sync while signed in. Then attach it to a field report from the report\'s review step.',
  districtMissing: 'Your account has no district yet, so this boundary cannot be sent. Ask your office to check your account.',
  modeWalk: 'Walk',
  modeTap: 'Tap corners',
  more: 'More',
  moreOpen: 'Hide more',
  mapHeading: 'Boundary map',
  mapHelp: 'Choose a plot or affected-area boundary, then tap to add points. Drag a dot to move it, tap a dot to select it, and tap a + on an edge to add a point between two others. Map drawing also works without tiles.',
  plotBoundary: 'Plot boundary',
  affectedAreaBoundary: 'Affected-area boundary',
  finishAffectedArea: 'Finish affected area',
  affectedAreas: 'Affected areas',
  removeAffectedAreaNumber: (number: number) => `Remove affected area ${number}`,
  affectedAreaChip: (number: number, sqm: number) => `Area ${number} · ${Math.round(sqm).toLocaleString()} m²`,
  affectedOutsidePlot: 'The affected area must stay inside the plot boundary.',
  unfinishedAffectedArea: 'Finish or clear the affected-area boundary before syncing.',
  mapAccessibility: 'Tap to add or move a boundary vertex',
  pointHandle: (number: number, quality: string) => `Boundary point ${number}, ${quality}. Drag to move, tap to select.`,
  insertHandle: (number: number) => `Add a point after point ${number}`,
  myLocation: 'My location',
  myLocationBusy: 'Finding you…',
  mapTileError: 'Some map tiles could not be loaded. You can still draw and measure the boundary over the coordinate-only map.',
  mapAttribution: '© OpenStreetMap contributors',
  offlineMap: 'Offline map imagery is not available. Your boundary and measured area continue to work on this coordinate screen.',
  drawMode: 'Draw boundary',
  addGpsPoint: 'Capture GPS point',
  capturingGps: 'Getting GPS…',
  walkStart: 'Walk',
  walkStop: 'Stop walking',
  walkActive: 'Walking: a point is added about every 8 m once GPS is within ±10 m. Keep the phone out in the open and stop at the starting corner.',
  walkStopped: (count: number) => `Stopped walking. ${count} ${count === 1 ? 'point' : 'points'} added.`,
  walkLost: 'GPS stopped reporting, so walking stopped. Your points so far are kept.',
  undo: 'Undo',
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
  gpsCaptureCancelled: 'The boundary changed during the GPS reading. Your draft is unchanged.',
  boundaryQualityTitle: 'Boundary Quality',
  qualityPlotArea: 'Plot area',
  qualityPoints: 'Boundary points',
  qualityAffected: (sqm: number, percent: number) => `${Math.round(sqm).toLocaleString()} m² affected (${percent.toFixed(1)}%)`,
  qualityState: { good: 'GPS: Good', acceptable: 'GPS: Acceptable', low_accuracy: 'GPS: Low accuracy', drawn_on_map: 'Drawn on map' },
  pointQuality: { map: 'placed on the map', good: 'GPS good', acceptable: 'GPS acceptable', weak: 'GPS weak', unknown: 'GPS accuracy unknown' },
  toolState: {
    idle: 'Drawing is locked',
    'plot.add': 'Plot: tap the map to add a point',
    'plot.move': 'Plot: tap the map or drag the point to move it',
    'affected.add': 'Affected area: tap the map to add points',
    'affected.closable': 'Affected area: add more points or finish it',
    'affected.move': 'Affected area: tap the map or drag the point to move it',
  },
  validity: {
    too_few_points: 'Add at least three boundary points.',
    too_many_points: 'This boundary has too many points to validate.',
    invalid_point: 'A boundary point is outside valid coordinates.',
    crosses_itself: 'The boundary crosses itself. Move or remove a point at the red edge.',
    no_area: 'The boundary has no measurable area. Move or remove a point.',
    affected_outside: 'An affected area is outside the plot. Move it inside the plot or remove it.',
  },
  moveRefused: 'That move would break the affected area, so the point stayed where it was.',
  qualityWorst: (point: number, meters: number | null) => meters === null
    ? `Worst point: ${point} · accuracy unknown`
    : `Worst point: ${point} · ±${meters.toFixed(1)} m`,
  recapturePoint: (point: number) => `Recapture point ${point}`,
  tapToDraw: 'Tap the map to add points. Drag a dot to move it.',
  savingOffline: 'Saving boundary draft…',
  unsavedChanges: 'Changes not saved yet.',
  saveRetry: 'Try again',
  saveFailed: 'The boundary could not be saved. Your previous draft is unchanged.',
  close: 'Close',
  myBoundariesTitle: 'My boundaries',
  myBoundariesLink: 'My boundaries',
  myBoundariesSubtitle: 'Boundaries saved on this phone',
  myBoundariesEmptyTitle: 'No boundaries yet',
  myBoundariesEmptyBody: 'Boundaries you measure on this phone are listed here, newest first.',
  myBoundariesOpen: 'Open',
  myBoundariesView: 'View',
  myBoundariesDelete: 'Delete',
  myBoundariesNoPoints: 'No points yet',
  myBoundariesLoadFailed: 'Your boundaries could not be read from this phone.',
  myBoundariesDeleteTitle: 'Delete this boundary?',
  myBoundariesDeleteBody: 'It is removed from this phone and cannot be recovered. A report that links to it will say the boundary is no longer saved.',
  myBoundariesDeleteFailed: 'This boundary could not be deleted.',
  myBoundariesRowOpenLabel: (summary: string) => `Open boundary ${summary}`,
  myBoundariesRowDeleteLabel: (summary: string) => `Delete boundary ${summary}`,
} as const;

/** One label and one "what to do" line per stored boundary state (see boundaryState). */
export const BOUNDARY_STATE_COPY = {
  draft: { label: 'Draft', hint: 'Not sent yet. Open it to keep drawing, then save and sync.' },
  waiting_to_send: { label: 'Waiting to send', hint: 'Saved. It sends on its own when you are online.' },
  sending: { label: 'Sending', hint: 'Sending to the office now.' },
  sent: { label: 'Sent', hint: 'The office has this boundary.' },
  will_retry: { label: 'Will retry', hint: 'The office could not be reached. It tries again on its own.' },
  needs_fix: { label: 'Needs a fix', hint: 'The office needs a correction. Open it, fix the points, then sync again.' },
  identity_rejected: { label: 'Start again', hint: 'The office will not take this one. Measure the boundary again as a new boundary.' },
  damaged: { label: 'Start again', hint: 'This saved boundary is damaged on this phone. Measure it again as a new boundary.' },
  refused: { label: 'Not sent', hint: 'The office did not accept it. Open it and press Save and sync to try again, or ask the office to check your account.' },
} as const;

/** One line per boundary screen mode; the status strip shows exactly one of them. */
export const FIELD_SURVEY_MODE_COPY = {
  loading: 'Opening your boundary…',
  waiting_to_start: 'The boundary linked to this report is not on this phone. Start a new boundary to measure it again.',
  drawing_new: FIELD_SURVEY_COPY.tapToDraw,
  drawing_resumed: FIELD_SURVEY_COPY.resumedSurvey,
  fixing: 'The office needs a correction. Fix the points or the messages below, then sync again.',
  sending: BOUNDARY_STATE_COPY.sending.hint,
  waiting_to_send: 'Saved on this phone. Not sent yet: it sends when you are online, or press Save and sync to try again.',
  sent: BOUNDARY_STATE_COPY.sent.hint,
  identity_rejected: FIELD_SURVEY_COPY.surveyIdentityRejected,
} as const;

/** Offline readiness (D01) — before visits without a connection. */
export const OFFLINE_READINESS_COPY = {
  readyTitle: 'Ready for offline work',
  notReadyTitle: 'Not ready for offline work',
  explanation:
    'CaneGuard keeps the existing protected-session boundary: a password-only sign-in is not stored, so closing the app while offline returns you to the sign-in screen. Biometric unlock keeps the same unexpired account resumable offline; it never stores your password or ignores a rejected credential.',
  passwordOnlyRestartLimit:
    'Password-only sign-in: if CaneGuard closes while you are offline, you must sign in again when a connection returns. Turn on biometric unlock in Account security before visits to resume offline after a restart.',
} as const;

/** One-time "Ready for the field" sheet after a password sign-in, and the quiet Home line. */
export const READY_FOR_FIELD_COPY = {
  sheetTitle: 'Ready for the field?',
  sheetBody:
    'Without a signal, closing CaneGuard signs you out. Turn on biometric unlock so you can keep working offline.',
  sheetNote: 'Your password is never stored on this phone.',
  sheetSetUp: 'Set up biometric unlock',
  sheetNotNow: 'Not now',
  homeLineBiometric: 'Not ready for offline work. Turn on biometric unlock.',
  homeLineOther: 'Not ready for offline work. Check your visits and sign-in.',
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
export const OFFICE_UPDATE_STILL_OPENING = 'Still getting this update ready. Try again in a moment.';
/** Notification whose case is not stored on this phone: say why, point to the web. */
export const OFFICE_UPDATE_NOT_ON_PHONE = 'Not on this phone: open on the web';

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

export const FIELD_GUIDE_SECTION_SIGNS = 'Signs';
export const FIELD_GUIDE_SECTION_WHERE_TO_LOOK = 'Where to look';
export const FIELD_GUIDE_SECTION_IMPACT = 'Why it matters';
export const FIELD_GUIDE_SECTION_PREVENTION = 'Prevention';
export const FIELD_GUIDE_SECTION_MANAGEMENT = 'What you can do';
export const FIELD_GUIDE_SECTION_DETAIL = 'More detail';
export const FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS = 'Sources and photo credits';
export const FIELD_GUIDE_SECTION_SOURCES_AND_CREDITS_SUMMARY =
  'Where this page comes from and who took the photos';

/** The long-form, offline reading page behind every entry. */
export const FIELD_GUIDE_READ_FULL_GUIDE = 'Read the full guide';
export const FIELD_GUIDE_GUIDE_TITLE = 'Full guide';
export const FIELD_GUIDE_GUIDE_SOURCES_TITLE = 'Sources for this guide';
export const FIELD_GUIDE_SCIENTIFIC_NAME_LABEL = 'Scientific name';

/**
 * Gallery disclaimer. Distinct from `DECISION_SUPPORT_DISCLAIMER`, which is
 * phrased for a scan result; the gallery is education, never a diagnosis.
 */
export const FIELD_GUIDE_EDUCATION_DISCLAIMER =
  'This guide is for education. It does not confirm a diagnosis — ask your agriculture officer to confirm what you see.';

/** Source rows. A missing document says so instead of showing a dead link. */
export const FIELD_GUIDE_SOURCE_OPEN_LABEL = 'Read the original source';
export const FIELD_GUIDE_SOURCE_INTERNET_REQUIRED =
  'Opens in your browser. Internet is required.';
export const FIELD_GUIDE_SOURCE_OPEN_FAILED =
  'Could not open the link. The guide still works offline.';
export const FIELD_GUIDE_SOURCE_AWAITING_SUPPLY = 'Not supplied yet';
export const FIELD_GUIDE_SOURCE_AWAITING_SUPPLY_NOTE =
  'The office has requested this document. This page will cite the exact pages once it arrives.';

/** Photo credits. A blank record is labelled, never filled in by guesswork. */
export const FIELD_GUIDE_CREDIT_MISSING =
  'Creator and licence are not recorded for this photo yet.';
export const FIELD_GUIDE_CREDIT_CREATOR_LABEL = 'Photo by';
export const FIELD_GUIDE_CREDIT_LICENSE_LABEL = 'Licence';
export const FIELD_GUIDE_CREDIT_SOURCE_LABEL = 'Original page';

/** Full-screen photo viewer. */
export const FIELD_GUIDE_PHOTO_VIEWER_HINT = 'Pinch to zoom, then drag to move around the photo.';
export const FIELD_GUIDE_PHOTO_VIEWER_RESET = 'Reset zoom';
export const FIELD_GUIDE_PHOTO_VIEWER_CLOSE = 'Close photo';
export const FIELD_GUIDE_PHOTO_VIEWER_MISSING_TITLE = 'Photo not available';
export const FIELD_GUIDE_PHOTO_VIEWER_MISSING_MESSAGE =
  'This photo is not bundled on this device.';
export const FIELD_GUIDE_PHOTO_VIEWER_MISSING_ACTION = 'Back to the entry';

/** Accessible label for a tappable photo thumbnail. */
export function fieldGuidePhotoOpenLabel(caption: string): string {
  return `Open the photo: ${caption}`;
}

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

/**
 * Home wording: the "Morning Note" sentences, plus the header band and signs
 * strip labels. The sentences are proposals awaiting owner review; the
 * app has no i18n layer, so any Filipino or Tagalog wording is a separate
 * decision. Sync-derived sentences live in `syncStatusCopy.ts`.
 */
export const HOME_NOTE_COPY = {
  allClear: 'All clear.',
  visitsCheckFailed: "Couldn't check your visits.",
  visitsCheckFailedDetail: 'Nothing is lost — they will appear when the check succeeds.',
  visitsCheckPending: 'Checking your visits…',
  nothingDueToday: 'Nothing due today.',
  openNextVisit: 'Open next visit',
  resumeDraft: 'Resume',
  readOfficeUpdate: 'Read office update',
  startScan: 'Start a scan',
  upNext: 'Up next',
  measurePlotLink: FIELD_SURVEY_COPY.quickActionTitle,
  fieldGuideLink: 'Field guide',
  fieldGuideLabel: 'Open the field guide for sugarcane diseases and pests',
  visitsToday: (count: string) => `${count} ${count === 'One' ? 'visit' : 'visits'} today.`,
  visitsOverdue: (count: string) =>
    `${count} ${count === 'One' ? 'visit is' : 'visits are'} overdue.`,
  alsoOverdue: (count: string) => `${count} ${count === 'One' ? 'is' : 'are'} overdue.`,
  officeUpdates: (count: string) =>
    `${count} office ${count === 'One' ? 'update' : 'updates'} to read.`,
  greeting: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  },
  offlineChip: 'Offline',
  signsHeading: 'Know the signs',
  referencePhoto: 'Reference photo',
  signPhrases: {
    healthy: 'Even green leaves',
    mosaic: 'Pale green mottling',
    rust: 'Orange pustules beneath',
    smut: 'Dark whip on the shoot',
  },
} as const;

/**
 * Farmer-facing copy in both supported languages. `FarmerCopyBlock` is the one
 * shared shape for these per-screen blocks, so a string missing from either
 * language fails the type check. Sync status wording is the exception: it is
 * bilingual but single-sourced in
 * `src/features/sync/utils/syncStatusCopy.ts`.
 * Inspector screens and Field Guide entry text stay English. Farmer model
 * decision-support wording lives here. Words such as "Validated", "Confirmed",
 * "Resolved" and "Diagnosis" (and their Tagalog equivalents) never appear in
 * farmer copy; `farmerCopy.test.ts` enforces this for both languages.
 */
export type FarmerLanguage = 'en' | 'tl';

export type FarmerResultName = 'healthy' | 'mosaic' | 'rust' | 'smut' | 'unknown';

export type FarmerCopyBlock = {
  greeting: { morning: string; afternoon: string; evening: string };
  home: {
    headline: string;
    offline: string;
    knowSigns: string;
    referencePhoto: string;
    fieldGuideLabel: string;
    signPhrases: { healthy: string; mosaic: string; rust: string; smut: string };
  };
  tabs: { home: string; scan: string; myScans: string; activityWithUpdates: (count: number) => string };
  officeUpdates: {
    pill: (count: number) => string;
    open: string;
    dismiss: string;
    close: string;
    title: string;
    unread: (count: number) => string;
    allRead: string;
    markAllRead: string;
    markAllReadLabel: string;
    loadError: string;
    readError: string;
    partial: string;
    empty: string;
    unreadLabel: string;
    notOnPhone: string;
    markedRead: string;
    caseActivity: string;
    recently: string;
  };
  record: {
    title: string;
    loading: string;
    unavailable: string;
    unavailableMessage: string;
    tryAgain: string;
    imageUnavailable: string;
    backLabel: string;
    deleteAction: string;
    deleting: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    deleteConfirm: string;
    cancel: string;
    deleteHint: string;
    deleted: string;
    deleteFailed: string;
    imageCleanupFailed: string;
  };
  result: {
    saveFailed: string;
    saved: string;
    discardFailed: string;
    discarded: string;
    recoveryTitle: string;
    recoveryMessage: string;
    recoveryAction: string;
    imageLabel: string;
    closeLabel: string;
    decisionSupport: Record<FarmerResultName, string>;
    aboutTitle: string;
    explanations: Record<FarmerResultName, { message: string; description: string }>;
    consistency: Record<'consistent' | 'inconsistent' | 'not-applicable' | 'not-enough-information', { title: string; message: string }>;
    qualityTitle: string;
    qualityIndependence: string;
    qualityWarnings: Record<'low-resolution' | 'too-dark' | 'too-bright' | 'low-contrast', string>;
    headerTitle: string;
    pill: string;
    cautionTitle: string;
    lowConfidence: string;
    cautionNote: string;
    mismatch: string;
    outcomeSaved: string;
    outcomeChoose: string;
    outcomeFailed: string;
    outcomeSavedMessage: string;
    outcomeChooseMessage: string;
    scanAgain: string;
    whyTitle: string;
    moreActions: string;
    fieldGuide: string;
    cancelScan: string;
    openSaved: string;
    cancelTitle: string;
    cancelMessage: string;
    keepDraft: string;
    discardDraft: string;
  };
  actions: {
    startScan: string;
    fieldGuide: string;
    openSettings: string;
  };
  settings: { languageLabel: string; languageDescription: string; english: string; tagalog: string };
  settingsScreen: {
    title: string; displaySection: string; darkMode: string; darkModeDescription: string;
    fieldGuideSection: string; fieldGuideTitle: string; fieldGuideDescription: string;
    accountSection: string; fallbackName: string; fallbackAccount: string;
    accountSecurity: string; accountSecurityDescription: string; logout: string;
    logoutAccessibility: string; clearCached: string; clearingCached: string;
    clearCachedAccessibility: string; removeLocal: string; removingLocal: string;
    removeLocalAccessibility: string; aboutSection: string; appName: string; version: string;
    logoutDialogTitle: string; logoutDialogMessage: string; logoutDialogConfirm: string;
    loggingOut: string; signingOutMessage: string; logoutIncomplete: string;
    logoutIncompleteMessage: string; signedOutLocally: string; remoteLogoutMessage: string;
    signedOut: string; clearCachedTitle: string; clearCachedMessage: string; cancel: string;
    clearCachedConfirm: string; cachedCleared: string; cachedClearFailed: string;
    removeLocalTitle: string; removeLocalMessage: string; removeLocalConfirm: string;
    continueLocalRemoval: string; localItemsTitle: string; keepWork: string; deleteLocalItems: string;
    removeLocalBusy: string; removeLocalFailed: string; removeLocalWarning: string;
    removedWithWarnings: string; removed: string;
    localItemsNote: (count: number) => string;
    cachedClearedMessage: (count: number) => string;
    removalCounts: (counts: { reports: number; visits: number; boundaries: number; scans: number; drafts: number; assignments: number; notifications: number }) => string;
    localItemsWarning: (count: number) => string;
    localItemsDeletionMessage: (count: number) => string;
  };
  accountSecurityScreen: {
    title: string; subtitle: string; fallbackName: string; fallbackEmail: string; defaultInstallationName: string;
    expiresUnavailable: string; sessionExpiryUnavailable: string; sessionExpires: (date: string) => string;
    biometricTitle: string; biometricOn: string; biometricAvailable: string;
    biometricNotEnrolled: string; biometricUnsupported: string; biometricUnavailable: string;
    disableBiometric: string; enableBiometric: string; enablingBiometric: string;
    biometricEnableToast: string; biometricEnabledMessage: string;
    changePassword: string; changePasswordDescription: string; openChangePassword: string;
    changeEmail: string; changeEmailDescription: (email: string) => string; openChangeEmail: string;
    deviceEnrollment: string; deviceEnrollmentDescription: (name: string) => string;
    openDeviceEnrollment: string; enrollmentSuccess: string;
  };
  accountSecurityForms: {
    common: { close: string; cancel: string; discardTitle: string; discardMessage: string; keepEditing: string; discard: string };
    password: { title: string; currentPassword: string; newPassword: string; submit: string; updating: string; confirmTitle: string; confirmMessage: string; confirm: string; toast: string };
    email: { title: string; newEmail: string; currentPassword: string; confirmPassword: string; submit: string; updating: string; confirmTitle: string; confirmMessage: string; confirm: string; toast: string };
    enrollment: { title: string; name: string; nameHelp: string; namePlaceholder: string; currentPassword: string; confirmPassword: string; submit: string; submitting: string; confirmTitle: string; confirmMessage: string; confirm: string; toast: string };
    biometric: { title: string; currentPassword: string; confirmPassword: string; submit: string; submitting: string; toast: string };
  };
  notificationDetails: {
    headerTitle: string; headerSubtitle: string; advisoryLabel: string; officeMessageLabel: string;
    openRelated: string; openRelatedAccessibility: string; loading: string; unavailableTitle: string;
    unavailableMessage: string; retry: string; referenceFallback: string; recently: string;
  };
  authErrors: {
    generic: string; invalidCredentials: string; emailNotVerified: string; forbiddenRole: string;
    invalidResetLink: string; invalidVerificationLink: string; invalidResponse: string;
    rateLimited: string; registrationDisabled: string; serverUnavailable: string;
    sessionExpired: string; stepUpRequired: string; validationError: string; signInAgain: string;
    signInForBiometric: string; biometricUnavailable: string; biometricNotEnrolled: string;
    biometricCancelled: string; biometricVerificationFailed: string; biometricEnableFailed: string;
    biometricRevokeWarning: string; secureStorageUnavailable: string;
  };
  imagePreview: {
    title: string; noImageTitle: string; noImageMessage: string; chooseImage: string;
    camera: string; gallery: string; dimensionsUnavailable: string; pixels: string;
    imageAccessibility: (source: string) => string; loadingImage: string; loading: string;
    imageUnavailable: string; imageLoadFailed: string; source: string; size: string;
    checkingNotice: string; replaceSection: string; replaceSummary: string;
    replacementHelp: string; replaceShow: string; replaceHide: string; expandedSummary: string;
    replaceCameraAccessibility: string; replaceCamera: string;
    replaceGalleryAccessibility: string; replaceGallery: string;
    replacementSelected: string; imageReplaced: string;
    permissionCanAsk: string; permissionBlocked: string; pickerFailedCamera: string;
    pickerFailedGallery: string; invalidImage: string; unsupportedImage: string;
    preparingResult: string; checkingImage: string; preparingImage: string;
    modelLoading: string; modelError: string; analysisComplete: string;
    imageReady: string; analysisWaiting: string; analysisFailed: string;
    statusIdle: string; statusImageSelected: string; statusPreprocessing: string;
    statusAnalyzing: string; statusPreparingResult: string; statusCompleted: string; statusError: string;
    imagePreparationFailed: string; cancelAccessibility: string;
    cancel: string; startNew: string; viewResultAccessibility: string; viewResult: string;
    analyzeAccessibility: string; analyzing: string; prepareImage: string; analyze: string;
    retrySetupAccessibility: string; retrySetup: string; cancelTitle: string;
    cancelMessage: string; keepDraft: string; discardDraft: string;
  };
  scanScreen: {
    title: string;
    intro: string;
    errorTitle: string;
    recoveryUnverified: string;
    recoveryFailed: string;
    deviceSettingsFailed: string;
    permissionCanAsk: string;
    permissionBlocked: string;
    cameraFailed: string;
    galleryFailed: string;
    invalidImage: string;
    unsupportedImage: string;
    savingDraft: string;
    savedDraftTimed: (time: string) => string;
    savedDraft: string;
    failedDraft: string;
    idleDraft: string;
    cameraBusy: string;
    takePhoto: string;
    galleryBusy: string;
    chooseFromDevice: string;
    cancelTitle: string;
    cancelMessage: string;
    keepDraft: string;
    discardDraft: string;
    selectedImage: string;
    imageSelected: string;
    selectedImageHelp: string;
    checkingImage: string;
    checkingRecovery: string;
    noImage: string;
    photoTip: string;
    cameraSettings: string;
    tryCamera: string;
    takeAnother: string;
    replaceImage: string;
    chooseAnother: string;
    clearAndStart: string;
    startNew: string;
    photoGuide: string;
    guideFocus: string;
    guideLighting: string;
    guideSubject: string;
    returnPreview: string;
    resumeSaved: string;
    viewSelected: string;
    captureAccessibility: string;
    galleryAccessibility: string;
    draftNotSaved: string;
    draftKept: string;
    draftDiscarded: string;
  };
  resultUncertain: {
    title: string;
    intro: string;
    stepCloser: string;
    stepLight: string;
    stepLeafInView: string;
    stepCompare: string;
    retakePhoto: string;
    reviewSigns: string;
    closestMatchLabel: string;
  };
  checkAgain: {
    action: string;
    actionHint: string;
    historyHeading: string;
    firstCheck: string;
    thisCheck: string;
    compareHeading: string;
    firstPhoto: string;
    newPhoto: string;
    firstPhotoUnavailable: string;
    possibleCondition: string;
    compareNotice: string;
    noteLabel: string;
    notePlaceholder: string;
    saveFollowUp: string;
    savingFollowUp: string;
    retrySaveFollowUp: string;
    followUpSaved: string;
  };
  whatNow: {
    title: string;
    checkSigns: string;
    comparePhotos: string;
    saveScan: string;
    saving: string;
    saved: string;
    checkAgain: string;
  };
  scanCard: {
    title: string;
    photoLabel: string;
    dateLabel: string;
    possibleConditionLabel: string;
    noteLabel: string;
    placeLabel: string;
    placeCardLabel: string;
    placePlaceholder: string;
    aiOnlyLine: string;
    footer: string;
    scanIdLabel: string;
    loading: string;
    loadError: string;
    retryLoad: string;
  };
  myScans: {
    title: string;
    subtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    filterAll: string;
    stateNeedsChecking: string;
    stateFollowedUp: string;
    stateSaved: string;
    countOne: string;
    countMany: string;
    emptyTitle: string;
    emptyMessage: string;
    openScan: string;
    noMatchTitle: string;
    noMatchMessage: string;
    clearFilters: string;
    loading: string;
    loadError: string;
    retryLoad: string;
    loadMore: string;
    startScan: string;
  };
};

export const FARMER_COPY: Record<FarmerLanguage, FarmerCopyBlock> = {
  en: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    home: {
      headline: 'Check your plants today.',
      offline: 'Offline',
      knowSigns: 'Know the signs',
      referencePhoto: 'Reference photo',
      fieldGuideLabel: 'Open the field guide for sugarcane diseases and pests',
      signPhrases: {
        healthy: 'Even green leaves',
        mosaic: 'Pale green mottling',
        rust: 'Orange pustules beneath',
        smut: 'Dark whip on the shoot',
      },
    },
    tabs: {
      home: 'Home', scan: 'Scan', myScans: 'My Scans',
      activityWithUpdates: (count) => `My Scans, ${count} unread office ${count === 1 ? 'update' : 'updates'}`,
    },
    officeUpdates: {
      pill: (count) => `${count} office ${count === 1 ? 'update' : 'updates'}`,
      open: 'Open office updates', dismiss: 'Hide office updates for now', close: 'Close office updates',
      title: 'Office updates', unread: (count) => `${count} unread item${count === 1 ? '' : 's'} from the office.`,
      allRead: 'Every office update has been read.', markAllRead: 'Mark all read', markAllReadLabel: 'Mark all office updates as read',
      loadError: 'Office updates could not be loaded.', readError: 'This update could not be marked as read.',
      partial: 'Some office updates could not be loaded.',
      empty: 'Office review results and visits appear here after a refresh.',
      unreadLabel: 'Unread', notOnPhone: 'Not on this phone: open on the web',
      markedRead: 'Updates marked as read', caseActivity: 'Case activity', recently: 'Recently',
    },
    record: {
      title: 'Saved scan',
      loading: 'Loading your scan',
      unavailable: 'Scan unavailable',
      unavailableMessage: 'This scan could not be found on this phone.',
      tryAgain: 'Try again',
      imageUnavailable: 'Saved photo unavailable',
      backLabel: 'Go back',
      deleteAction: 'Delete this scan',
      deleting: 'Deleting...',
      deleteConfirmTitle: 'Delete this scan?',
      deleteConfirmMessage:
        'This removes the scan and its photo from this phone. It cannot be undone.',
      deleteConfirm: 'Delete',
      cancel: 'Cancel',
      deleteHint: 'Delete this scan and its saved photo',
      deleted: 'Scan deleted',
      deleteFailed: 'Could not delete the scan — please try again',
      imageCleanupFailed: 'The scan was deleted, but its photo could not be removed from this phone.',
    },
    result: {
      saveFailed: 'The scan could not be saved on this phone. Try again.',
      saved: 'Scan saved',
      discardFailed: 'Could not discard the saved scan — try again',
      discarded: 'Scan discarded',
      recoveryTitle: 'No completed scan result',
      recoveryMessage: 'The scan result is unavailable. Return to Scan and try again.',
      recoveryAction: 'Return to Scan',
      imageLabel: 'Selected sugarcane image used for analysis',
      closeLabel: 'Cancel and return home',
      decisionSupport: {
        healthy: 'Possible Condition only. The model did not assign its highest score to Mosaic, Rust, or Smut. This output does not decide what is wrong with your crop.',
        mosaic: 'Possible Condition only. Mosaic may appear as irregular light and dark discoloration or mottling. This output does not decide what is wrong with your crop.',
        rust: 'Possible Condition only. Rust may appear as orange-brown or rust-colored spots or pustules. This output does not decide what is wrong with your crop.',
        smut: 'Possible Condition only. Look for a dark, whip-like growth emerging from the central shoot or stalk, but do not treat this observation or the model output as proof.',
        unknown: 'This result is for decision support only. It does not decide what is wrong with your crop.',
      },
      aboutTitle: 'About this result',
      explanations: {
        healthy: { message: 'The model assigned its highest score to Healthy based on the submitted image.', description: 'The model did not assign its highest score to Mosaic, Rust, or Smut.' },
        mosaic: { message: 'The model assigned its highest score to Mosaic based on the submitted image.', description: 'Mosaic can appear as irregular light and dark discoloration or mottling on the leaf.' },
        rust: { message: 'The model assigned its highest score to Rust based on the submitted image.', description: 'Rust can appear as orange-brown or rust-colored spots and pustules on the leaf.' },
        smut: { message: 'The model assigned its highest score to Smut based on the submitted image.', description: 'Smut may be associated with a dark, whip-like growth emerging from the central shoot or stalk. This visible pattern is observational and does not tell you what is wrong with your crop.' },
        unknown: { message: 'The app could not identify this result.', description: 'This result is not recognized by this app version.' },
      },
      consistency: {
        consistent: { title: 'Checklist consistent', message: 'The selected observations are consistent with the Possible Condition.' },
        inconsistent: { title: 'Checklist inconsistent', message: 'Your observations do not match the Possible Condition. Both are kept separately.' },
        'not-applicable': { title: 'Checklist cannot be compared', message: 'The selected observations point to more than one supported class, so they cannot be compared with one Possible Condition.' },
        'not-enough-information': { title: 'Not enough checklist information', message: 'No clear symptom observation was provided, so checklist consistency cannot be determined.' },
      },
      qualityTitle: 'Image quality notice',
      qualityIndependence: 'These warnings did not change the result.',
      qualityWarnings: {
        'low-resolution': 'The image resolution is low. Move closer and keep the affected area in focus.',
        'too-dark': 'The image may be too dark. Retake the photo in better lighting for a clearer image.',
        'too-bright': 'The image may be too bright. Avoid glare and direct overexposure when retaking it.',
        'low-contrast': 'The image has low contrast. Use even lighting and keep the affected area clearly visible.',
      },
      headerTitle: 'Scan result',
      pill: 'App check result',
      cautionTitle: 'Check before you save',
      lowConfidence:
        'This result is not conclusive. You can still keep it as a scan, or scan again for a clearer image.',
      cautionNote:
        'This caution does not change the result. You can scan again for a clearer image or keep this scan.',
      mismatch:
        'Your selected symptom observations do not match this Possible Condition. Both are kept separately.',
      outcomeSaved: 'Scan saved on this phone',
      outcomeChoose: 'Choose what happens next',
      outcomeFailed: 'Choose another action',
      outcomeSavedMessage: 'This scan is saved on this phone.',
      outcomeChooseMessage: 'Save Scan keeps this scan on this phone.',
      scanAgain: 'Scan again',
      whyTitle: 'Why this result?',
      moreActions: 'More actions',
      fieldGuide: 'Field guide',
      cancelScan: 'Cancel scan',
      openSaved: 'Open saved scan',
      cancelTitle: 'Cancel scan?',
      cancelMessage: 'Keep your unfinished scan to continue later, or discard it?',
      keepDraft: 'Keep it',
      discardDraft: 'Discard it',
    },
    actions: {
      startScan: 'Start a scan',
      fieldGuide: 'Field guide',
      openSettings: 'Settings',
    },
    settings: {
      languageLabel: 'Language / Wika',
      languageDescription: 'Choose the language for farmer screens',
      english: 'English',
      tagalog: 'Tagalog',
    },
    settingsScreen: {
      title: 'Settings', displaySection: 'DISPLAY & ACCESSIBILITY', darkMode: 'Dark Mode',
      darkModeDescription: 'Use a darker appearance throughout CaneGuard', fieldGuideSection: 'FIELD GUIDE',
      fieldGuideTitle: 'Field guide', fieldGuideDescription: 'Read about sugarcane diseases and pests',
      accountSection: 'ACCOUNT & SECURITY', fallbackName: 'Field Inspector', fallbackAccount: 'Authenticated mobile account',
      accountSecurity: 'Account security', accountSecurityDescription: 'Password, email, device, and biometric controls',
      logout: 'Logout', logoutAccessibility: 'Log out of your account', clearCached: 'Clear downloaded office data',
      clearingCached: 'Clearing downloaded data…', clearCachedAccessibility: 'Clear downloaded office data only',
      removeLocal: 'Remove all local records', removingLocal: 'Removing local records…',
      removeLocalAccessibility: 'Remove all local records for this account', aboutSection: 'ABOUT', appName: 'App Name', version: 'Version',
      logoutDialogTitle: 'Log out?', logoutDialogMessage: 'Logging out revokes the server session and removes the protected credential. Saved and unfinished scans remain on this phone; remove local records before handing it to someone else.',
      logoutDialogConfirm: 'Log out', loggingOut: 'Signing out…', signingOutMessage: 'Signing out. Please keep CaneGuard open.',
      logoutIncomplete: 'Logout incomplete', logoutIncompleteMessage: 'CaneGuard could not clear secure session storage. Restart the app and try again.',
      signedOutLocally: 'Signed out locally', remoteLogoutMessage: 'The server could not be reached, so the remote session may remain active until it expires or is revoked later.',
      signedOut: 'Signed out', clearCachedTitle: 'Clear downloaded office data?',
      clearCachedMessage: 'This removes visits and office updates that can be downloaded again. Saved scans, drafts, reports, boundaries and completed visits stay on this device.',
      cancel: 'Cancel', clearCachedConfirm: 'Clear downloaded data', cachedCleared: 'Downloaded office data cleared',
      cachedClearFailed: 'Could not clear downloaded data', removeLocalTitle: 'Remove all local records?',
      removeLocalMessage: 'This cannot be undone. Server data and other accounts are not changed.',
      removeLocalConfirm: 'Remove local records', continueLocalRemoval: 'Continue to delete local-only items',
      localItemsTitle: 'Delete items stored only on this phone?', keepWork: 'Keep my work', deleteLocalItems: 'Delete local-only items',
      removeLocalBusy: 'An upload is still running. Wait for it to finish, then review local records again.',
      removeLocalFailed: 'Could not remove local records', removeLocalWarning: 'Local records removed with cleanup warnings',
      removedWithWarnings: 'Your local records were removed, but one or more saved images could not be deleted yet.',
      removed: 'Saved scans, drafts, reports, boundaries, visits, and cached account data were removed from this device.',
      localItemsNote: (count) => `${count} saved item${count === 1 ? ' remains' : 's remain'} only on this phone.`,
      cachedClearedMessage: (count) => `${count} downloaded ${count === 1 ? 'item was' : 'items were'} removed. Saved scans and drafts were kept.`,
      removalCounts: (counts) => `${counts.reports} reports · ${counts.visits} visits · ${counts.boundaries} boundaries · ${counts.scans} scans · ${counts.drafts} drafts · ${counts.assignments} downloaded visits · ${counts.notifications} office updates.`,
      localItemsWarning: (count) => `Removing these ${count} local-only item${count === 1 ? '' : 's'} will permanently erase them from this phone.`,
      localItemsDeletionMessage: (count) => `This will permanently delete ${count} item${count === 1 ? '' : 's'} stored only on this phone.`,
    },
    accountSecurityScreen: {
      title: 'Account & security',
      subtitle: 'Protect your account without changing the offline reports and scans saved on this device.',
      fallbackName: 'Field Inspector', fallbackEmail: 'Authenticated mobile account', defaultInstallationName: 'CaneGuard mobile device',
      expiresUnavailable: 'Local session safety expiry unavailable; sign in again before continuing.',
      sessionExpiryUnavailable: 'Session expiry is unavailable. Sign in again to establish a server session.',
      sessionExpires: (date) => `Session expires ${date}. Biometric unlock does not extend it.`,
      biometricTitle: 'Biometric unlock', biometricOn: 'Biometric unlock is on for this installation.',
      biometricAvailable: 'A strong platform biometric is available for this installation.',
      biometricNotEnrolled: 'Enroll a strong biometric in device settings before enabling this option.',
      biometricUnsupported: 'This device does not expose a strong platform biometric. Use password sign-in.',
      biometricUnavailable: 'Biometric capability is unavailable until the native development build is ready. Use password sign-in.',
      disableBiometric: 'Disable biometric unlock', enableBiometric: 'Enable biometric unlock',
      enablingBiometric: 'Enabling…', biometricEnableToast: 'Biometrics enabled',
      biometricEnabledMessage: 'Biometric unlock is enabled on this installation. It unlocks the stored session after a cold start and never extends the server expiry.',
      changePassword: 'Change password',
      changePasswordDescription: 'Password protection is on. Changing your password signs out every active session.',
      openChangePassword: 'Open the change password form', changeEmail: 'Change email',
      changeEmailDescription: (email) => `Current email: ${email}. Changing it signs out every active session and requires verification of the new address.`,
      openChangeEmail: 'Open the change email form', deviceEnrollment: 'Device enrollment',
      deviceEnrollmentDescription: (name) => `Installation identity: ${name}.`,
      openDeviceEnrollment: 'Open the device enrollment form',
      enrollmentSuccess: 'This installation is enrolled with a fresh server session. Existing sessions on other device identities are unchanged.',
    },
    accountSecurityForms: {
      common: { close: 'Close', cancel: 'Cancel', discardTitle: 'Discard changes?', discardMessage: 'You have unsaved changes. Do you want to discard them?', keepEditing: 'Keep editing', discard: 'Discard' },
      password: { title: 'Change password', currentPassword: 'Current password', newPassword: 'New password', submit: 'Change password', updating: 'Updating…', confirmTitle: 'Change password?', confirmMessage: 'Changing your password signs out every active session. You will need to sign in again with your new password.', confirm: 'Yes, change it', toast: 'Password updated' },
      email: { title: 'Change email', newEmail: 'New email', currentPassword: 'Current password', confirmPassword: 'Enter your password to change email', submit: 'Change email', updating: 'Updating…', confirmTitle: 'Change email?', confirmMessage: 'Changing your email signs out every active session and requires verification of the new address.', confirm: 'Yes, change it', toast: 'Email updated' },
      enrollment: { title: 'Device enrollment', name: 'Installation name', nameHelp: 'A name for this installation on the office system. It is stored securely and is not a hardware identifier.', namePlaceholder: 'CaneGuard mobile device', currentPassword: 'Current password', confirmPassword: 'Enter your password to enroll this device', submit: 'Enroll this installation', submitting: 'Enrolling…', confirmTitle: 'Enroll this installation?', confirmMessage: 'This installation will be enrolled with a fresh server session. Existing sessions on other device identities are unchanged.', confirm: 'Enroll', toast: 'Device enrolled' },
      biometric: { title: 'Disable biometric unlock', currentPassword: 'Current password', confirmPassword: 'Enter your password to disable', submit: 'Disable biometric unlock', submitting: 'Disabling…', toast: 'Biometrics disabled' },
    },
    notificationDetails: {
      headerTitle: 'Office update', headerSubtitle: 'Advice from the CaneGuard office',
      advisoryLabel: 'Advisory', officeMessageLabel: 'Office message',
      openRelated: 'Open related activity', openRelatedAccessibility: 'Open related activity',
      loading: 'Loading office update', unavailableTitle: 'Office update unavailable',
      unavailableMessage: 'This office update is no longer available on this device.',
      retry: 'Try again', referenceFallback: 'Office update', recently: 'Recently',
    },
    authErrors: {
      generic: 'Authentication could not be completed. Please try again.',
      invalidCredentials: 'The email or password is incorrect.',
      emailNotVerified: 'Verify your email address before signing in to CaneGuard.',
      forbiddenRole: 'This account type cannot sign in to CaneGuard Mobile.',
      invalidResetLink: 'This recovery link is invalid, expired, or already used. Request a new link.',
      invalidVerificationLink: 'This email-verification link is invalid or expired. Request a new link.',
      invalidResponse: 'CaneGuard could not complete authentication.',
      rateLimited: 'Too many requests. Wait a moment and try again.',
      registrationDisabled: 'Public self-registration is disabled. Contact your CaneGuard administrator to request an authorized account.',
      serverUnavailable: 'CaneGuard could not reach the server. Please check your connection and try again.',
      sessionExpired: 'Your CaneGuard session is no longer valid.',
      stepUpRequired: 'Enter your current password to continue.',
      validationError: 'Check the highlighted fields and try again.',
      signInAgain: 'Sign in again before continuing this account action.',
      signInForBiometric: 'Sign in with your password before enabling biometric unlock.',
      biometricUnavailable: 'Biometric unlock is unavailable. Sign in with your password.',
      biometricNotEnrolled: 'Set up a strong biometric before enabling biometric unlock.',
      biometricCancelled: 'Biometric unlock was cancelled. Sign in with your password.',
      biometricVerificationFailed: 'CaneGuard could not verify you biometrically. Sign in with your password.',
      biometricEnableFailed: 'Biometric unlock could not be enabled. Your password session is still active.',
      biometricRevokeWarning: 'Biometric unlock was disabled on this device, but the server token could not be revoked.',
      secureStorageUnavailable: 'Secure session storage is unavailable. Device enrollment was cancelled.',
    },
    imagePreview: {
      title: 'Image preview', noImageTitle: 'No image selected',
      noImageMessage: 'Choose a gallery image or capture a photo before opening the preview.',
      chooseImage: 'Choose an image', camera: 'Camera', gallery: 'Gallery',
      dimensionsUnavailable: 'Dimensions unavailable', pixels: 'pixels',
      imageAccessibility: (source) => `Selected sugarcane image from ${source.toLowerCase()}`,
      loadingImage: 'Loading selected image', loading: 'Loading image…',
      imageUnavailable: 'Image preview unavailable',
      imageLoadFailed: 'The selected image could not be displayed. Please replace it.',
      source: 'Source', size: 'Size',
      checkingNotice: 'Your image will be checked on this device before analysis.',
      replaceSection: 'Retake / Replace image', replaceSummary: 'Camera or gallery',
      replacementHelp: 'The current image stays in place until you choose a replacement. A replacement clears the previous result and symptom answers.',
      replaceShow: 'Show image replacement options', replaceHide: 'Hide image replacement options', expandedSummary: 'Hide replacement options',
      replaceCameraAccessibility: 'Take another photo with the camera', replaceCamera: 'Take another photo',
      replaceGalleryAccessibility: 'Choose another image from the gallery', replaceGallery: 'Choose another image',
      replacementSelected: 'New image selected. The previous analysis result and symptom answers were cleared; the previous scan draft was replaced.',
      imageReplaced: 'Image replaced',
      permissionCanAsk: 'Camera access is needed to take a sugarcane photo. You can try the camera again.',
      permissionBlocked: 'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.',
      pickerFailedCamera: 'The camera could not be opened. Please try again.',
      pickerFailedGallery: 'The gallery could not be opened. Please try again.',
      invalidImage: 'That selection did not contain a usable local image. Please choose another photo.',
      unsupportedImage: 'Unsupported image format. Please choose a JPEG, PNG, or WebP image.',
      preparingResult: 'Preparing analysis result', checkingImage: 'Checking image',
      preparingImage: 'Preparing image', modelLoading: 'Getting ready before analysis…',
      modelError: 'The on-device model could not load. Restart the app and try again.',
      analysisComplete: 'Analysis complete. Open the result to review it and save this scan.',
      imageReady: 'The image is ready. Retry analysis to continue.',
      analysisWaiting: 'Analysis stays on this screen until the check succeeds.',
      analysisFailed: 'The on-device analysis could not finish. Please try again.',
      statusIdle: 'No image selected', statusImageSelected: 'Image selected',
      statusPreprocessing: 'Preparing image', statusAnalyzing: 'Analyzing image',
      statusPreparingResult: 'Preparing result', statusCompleted: 'Analysis complete', statusError: 'Analysis error',
      imagePreparationFailed: 'The selected image could not be prepared. Please replace it and try again.',
      cancelAccessibility: 'Cancel scan and return home',
      cancel: 'Cancel Scan', startNew: 'Start New Scan',
      viewResultAccessibility: 'View the analysis result', viewResult: 'View Analysis Result',
      analyzeAccessibility: 'Analyze selected image', analyzing: 'Analyzing…',
      prepareImage: 'Preparing Image…', analyze: 'Analyze',
      retrySetupAccessibility: 'Retry analysis setup', retrySetup: 'Retry analysis setup',
      cancelTitle: 'Cancel scan?',
      cancelMessage: 'Do you want to keep your in-progress scan draft or discard it before returning home?',
      keepDraft: 'Keep draft', discardDraft: 'Discard draft',
    },
    scanScreen: {
      title: 'Scan sugarcane', intro: 'Add a clear photo of the affected leaf, stalk, or central shoot.',
      errorTitle: 'Image not added', recoveryUnverified: 'An interrupted image selection was found, but its source could not be verified. Please choose the image again.',
      recoveryFailed: 'An interrupted image selection could not be recovered. Please try again.',
      deviceSettingsFailed: 'Device settings could not be opened. Open Settings and allow camera access.',
      permissionCanAsk: 'Camera access is needed to take a sugarcane photo. Try the camera again.',
      permissionBlocked: 'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.',
      cameraFailed: 'The camera could not be opened. Please try again.', galleryFailed: 'The gallery could not be opened. Please try again.',
      invalidImage: 'That selection did not contain a usable local image. Please choose another photo.',
      unsupportedImage: 'Unsupported image format. Please choose a JPEG, PNG, or WebP image.',
      savingDraft: 'Saving on this device…',
      savedDraftTimed: (time) => `Saved on this device · ${time}. You can close CaneGuard and resume this scan.`,
      savedDraft: 'Saved on this device. You can close CaneGuard and resume this scan.',
      failedDraft: 'Not saved on this device. Your photo is still open here — try replacing it or keep this screen open.',
      idleDraft: 'Not saved on this device yet.', cameraBusy: 'Opening camera…', takePhoto: 'Take photo',
      galleryBusy: 'Opening gallery…', chooseFromDevice: 'Choose from device',
      cancelTitle: 'Cancel scan?', cancelMessage: 'Do you want to keep your in-progress scan or discard it before returning home?',
      keepDraft: 'Keep draft', discardDraft: 'Discard draft', selectedImage: 'Currently selected sugarcane image',
      imageSelected: 'Image selected', selectedImageHelp: 'View the selected image or start a new scan.',
      checkingImage: 'Checking for a selected image', checkingRecovery: 'CaneGuard is checking whether Android interrupted the last picker.',
      noImage: 'No image added yet', photoTip: 'Use a well-lit, focused photo for a more helpful result.',
      cameraSettings: 'Open Settings', tryCamera: 'Try Camera Again', takeAnother: 'Take Another Photo',
      replaceImage: 'Take another photo to replace the selected image', chooseAnother: 'Choose Another Image',
      clearAndStart: 'Clear the current scan and start again', startNew: 'Start New Scan',
      photoGuide: 'Photo quality guide', guideFocus: 'Keep the symptom clear and focused',
      guideLighting: 'Avoid dark, blurry, or distant images', guideSubject: 'Capture the affected leaf, stalk, or shoot',
      returnPreview: 'Return to selected image preview', resumeSaved: 'Resume Saved Scan', viewSelected: 'View Selected Image',
      captureAccessibility: 'Capture a photo with the camera', galleryAccessibility: 'Choose one image from the gallery',
      draftNotSaved: 'Draft not saved on this device — try again', draftKept: 'Draft kept', draftDiscarded: 'Draft discarded',
    },
    resultUncertain: {
      title: 'Result uncertain',
      intro: 'Try these steps for a clearer photo. You can still save this scan.',
      stepCloser: 'Take a closer photo',
      stepLight: 'Use better light',
      stepLeafInView: 'Keep the leaf in view',
      stepCompare: 'Compare with the Field Guide',
      retakePhoto: 'Retake Photo',
      reviewSigns: 'Review Signs',
      closestMatchLabel: 'Closest match:',
    },
    checkAgain: {
      action: 'Check again',
      actionHint: 'Take a new photo of this plant and keep it with this scan.',
      historyHeading: 'Your checks',
      firstCheck: 'First check',
      thisCheck: 'Viewing now',
      compareHeading: 'Compare with your first photo',
      firstPhoto: 'First photo',
      newPhoto: 'New photo',
      firstPhotoUnavailable: 'The first photo is not on this device.',
      possibleCondition: 'Possible Condition',
      compareNotice:
        'The two photos are shown side by side for you to look at. CaneGuard does not compare the two results for you.',
      noteLabel: 'What do you see now?',
      notePlaceholder: 'Write it in your own words',
      saveFollowUp: 'Save Follow-Up',
      savingFollowUp: 'Saving follow-up...',
      retrySaveFollowUp: 'Retry and Save Follow-Up',
      followUpSaved: 'Follow-up saved on this device.',
    },
    whatNow: {
      title: 'What now?',
      checkSigns: 'Check the signs',
      comparePhotos: 'Compare photos',
      saveScan: 'Save Scan',
      saving: 'Saving scan...',
      saved: 'Saved',
      checkAgain: 'Check again in a few days',
    },
    scanCard: {
      title: 'Scan Card',
      photoLabel: 'Scan photo',
      dateLabel: 'Date',
      possibleConditionLabel: 'Possible Condition',
      noteLabel: 'Your note',
      placeLabel: 'Place (optional)',
      placeCardLabel: 'Place',
      placePlaceholder: 'Where you scanned, in your own words',
      aiOnlyLine: 'This result is for decision support only. It does not decide what is wrong with your crop.',
      footer:
        'This is your own scan. The inspector decides if a report is needed.',
      scanIdLabel: 'Scan ID',
      loading: 'Loading your Scan Card…',
      loadError: 'We could not load your Scan Card from this device.',
      retryLoad: 'Try again',
    },
    myScans: {
      title: 'My Scans',
      subtitle: 'Your saved scans on this phone.',
      searchLabel: 'Search my scans',
      searchPlaceholder: 'Search result or barangay',
      filterAll: 'All',
      stateNeedsChecking: 'Needs checking',
      stateFollowedUp: 'Followed up',
      stateSaved: 'Saved',
      countOne: '1 scan',
      countMany: '{count} scans',
      openScan: 'Open scan',
      emptyTitle: 'No scans yet',
      emptyMessage: 'Scan a leaf and it will be saved here.',
      noMatchTitle: 'No matching scans',
      noMatchMessage: 'Try a different search or show all scans.',
      clearFilters: 'Show all scans',
      loading: 'Getting your scans…',
      loadError: 'We could not read your scans on this phone.',
      retryLoad: 'Try again',
      loadMore: 'Show more',
      startScan: 'Start a scan',
    },
  },
  tl: {
    greeting: {
      morning: 'Magandang umaga',
      afternoon: 'Magandang hapon',
      evening: 'Magandang gabi',
    },
    home: {
      headline: 'Suriin ang iyong mga halaman ngayon.',
      offline: 'Walang internet',
      knowSigns: 'Kilalanin ang mga palatandaan',
      referencePhoto: 'Litrato bilang gabay',
      fieldGuideLabel: 'Buksan ang gabay sa bukid para sa mga sakit at peste ng tubo',
      signPhrases: {
        healthy: 'Pantay na luntiang dahon',
        mosaic: 'Mapusyaw na berdeng batik',
        rust: 'Kulay-kahel na butlig sa ilalim',
        smut: 'Maitim na latigo sa usbong',
      },
    },
    tabs: {
      home: 'Tahanan', scan: 'Mag-scan', myScans: 'Aking mga Scan',
      activityWithUpdates: (count) => `Aking mga Scan, ${count} hindi pa nababasang update sa opisina`,
    },
    officeUpdates: {
      pill: (count) => `${count} update sa opisina`,
      open: 'Buksan ang mga update sa opisina', dismiss: 'Itago muna ang mga update sa opisina', close: 'Isara ang mga update sa opisina',
      title: 'Mga update mula sa opisina', unread: (count) => `${count} hindi pa nababasang update mula sa opisina.`,
      allRead: 'Nabasa na ang lahat ng update sa opisina.', markAllRead: 'Markahang nabasa ang lahat', markAllReadLabel: 'Markahang nabasa ang lahat ng update sa opisina',
      loadError: 'Hindi makuha ang mga update sa opisina.', readError: 'Hindi mamarkahang nabasa ang update na ito.',
      partial: 'May ilang update sa opisina na hindi nakuha.',
      empty: 'Lalabas dito ang mga resulta ng pagsusuri ng opisina at mga pagbisita matapos mag-refresh.',
      unreadLabel: 'Hindi pa nababasa', notOnPhone: 'Wala sa teleponong ito: buksan sa web',
      markedRead: 'Namarkahang nabasa ang mga update', caseActivity: 'Aktibidad sa kaso', recently: 'Kamakailan',
    },

    record: {
      title: 'Na-save na scan',
      loading: 'Kinukuha ang iyong scan',
      unavailable: 'Hindi makita ang scan',
      unavailableMessage: 'Hindi makita ang scan na ito sa teleponong ito.',
      tryAgain: 'Subukan muli',
      imageUnavailable: 'Wala ang na-save na litrato',
      backLabel: 'Bumalik',
      deleteAction: 'Burahin ang scan na ito',
      deleting: 'Binubura...',
      deleteConfirmTitle: 'Burahin ang scan na ito?',
      deleteConfirmMessage:
        'Aalisin nito ang scan at ang litrato nito sa teleponong ito. Hindi na ito maibabalik.',
      deleteConfirm: 'Burahin',
      cancel: 'Kanselahin',
      deleteHint: 'Burahin ang scan na ito at ang na-save na litrato',
      deleted: 'Nabura ang scan',
      deleteFailed: 'Hindi nabura ang scan — subukan muli',
      imageCleanupFailed: 'Nabura ang scan, pero hindi naalis ang litrato nito sa teleponong ito.',
    },
    result: {
      saveFailed: 'Hindi na-save ang scan sa teleponong ito. Subukan muli.',
      saved: 'Na-save ang scan',
      discardFailed: 'Hindi maitapon ang na-save na scan — subukan muli',
      discarded: 'Itinapon ang scan',
      recoveryTitle: 'Walang kumpletong resulta ng scan',
      recoveryMessage: 'Hindi makita ang resulta ng scan. Bumalik sa Scan at subukan muli.',
      recoveryAction: 'Bumalik sa Scan',
      imageLabel: 'Larawan ng tubo na sinuri',
      closeLabel: 'Kanselahin at bumalik sa home',
      decisionSupport: {
        healthy: 'Posibleng Kondisyon lamang ito. Hindi pinakamataas ang marka ng modelo sa Mosaic, Rust, o Smut. Hindi nito sinasabi kung ano ang tiyak na sakit.',
        mosaic: 'Posibleng Kondisyon lamang ito. Maaaring makita ang Mosaic bilang hindi pantay na mapusyaw at maitim na kulay o batik sa dahon. Hindi nito sinasabi kung ano ang tiyak na sakit.',
        rust: 'Posibleng Kondisyon lamang ito. Maaaring makita ang Rust bilang mga batik o butlig na kahel-kayumanggi o kulay-kalawang. Hindi nito sinasabi kung ano ang tiyak na sakit.',
        smut: 'Posibleng Kondisyon lamang ito. Tingnan kung may maitim at parang latigong tubo mula sa gitnang usbong o tangkay, ngunit huwag ituring na tiyak ang nakikita o resulta ng modelo.',
        unknown: 'Pantulong lamang sa pagpapasya ang resultang ito. Hindi nito sinasabi kung ano ang tiyak na sakit.',
      },
      aboutTitle: 'Tungkol sa resultang ito',
      explanations: {
        healthy: { message: 'Pinakamataas ang markang ibinigay ng modelo sa Healthy batay sa isinumiteng larawan.', description: 'Hindi Mosaic, Rust, o Smut ang may pinakamataas na marka.' },
        mosaic: { message: 'Pinakamataas ang markang ibinigay ng modelo sa Mosaic batay sa isinumiteng larawan.', description: 'Maaaring magpakita ang Mosaic ng hindi pantay na mapusyaw at maitim na kulay o batik sa dahon.' },
        rust: { message: 'Pinakamataas ang markang ibinigay ng modelo sa Rust batay sa isinumiteng larawan.', description: 'Maaaring magpakita ang Rust ng kahel-kayumanggi o kulay-kalawang na batik at butlig sa dahon.' },
        smut: { message: 'Pinakamataas ang markang ibinigay ng modelo sa Smut batay sa isinumiteng larawan.', description: 'Maaaring may maitim at parang latigong tubo mula sa gitnang usbong o tangkay. Paglalarawan lamang ito ng nakikita at hindi pagpapatunay ng sakit.' },
        unknown: { message: 'Hindi matukoy ng app ang resultang ito.', description: 'Hindi kinikilala ng bersyong ito ng app ang resulta.' },
      },
      consistency: {
        consistent: { title: 'Tugma ang checklist', message: 'Tugma sa Posibleng Kondisyon ang mga napiling palatandaan.' },
        inconsistent: { title: 'Hindi tugma ang checklist', message: 'Hindi tugma sa Posibleng Kondisyon ang mga napili mong palatandaan. Magkahiwalay na itinatabi ang dalawa.' },
        'not-applicable': { title: 'Hindi maihahambing ang checklist', message: 'Tumutukoy sa higit sa isang suportadong klase ang mga napiling palatandaan kaya hindi maihahambing sa iisang Posibleng Kondisyon.' },
        'not-enough-information': { title: 'Kulang ang impormasyon sa checklist', message: 'Walang malinaw na palatandaan ng sintomas kaya hindi matukoy kung tugma ang checklist.' },
      },
      qualityTitle: 'Paunawa sa kalidad ng larawan',
      qualityIndependence: 'Hindi binago ng mga paunawang ito ang resulta.',
      qualityWarnings: {
        'low-resolution': 'Mababa ang linaw ng larawan. Lumapit at ituon ang apektadong bahagi.',
        'too-dark': 'Maaaring madilim ang larawan. Kunan muli sa mas maliwanag na lugar.',
        'too-bright': 'Maaaring masyadong maliwanag ang larawan. Iwasan ang silaw kapag kumukuha muli.',
        'low-contrast': 'Mahina ang pagkakaiba ng liwanag sa larawan. Gumamit ng pantay na ilaw at tiyaking kita ang apektadong bahagi.',
      },
      headerTitle: 'Resulta ng scan',
      pill: 'Resulta ng app',
      cautionTitle: 'Suriin bago i-save',
      lowConfidence:
        'Hindi tiyak ang resultang ito. Puwede mo pa ring itago ito bilang scan, o mag-scan ulit para sa mas malinaw na litrato.',
      cautionNote:
        'Hindi binabago ng babalang ito ang resulta. Puwede kang mag-scan ulit para sa mas malinaw na litrato o itago ang scan na ito.',
      mismatch:
        'Hindi tugma ang mga napili mong palatandaan sa Posibleng Kondisyon na ito. Magkahiwalay na itinatabi ang dalawa.',
      outcomeSaved: 'Na-save ang scan sa teleponong ito',
      outcomeChoose: 'Piliin ang susunod na gagawin',
      outcomeFailed: 'Pumili ng ibang gagawin',
      outcomeSavedMessage: 'Na-save ang scan na ito sa teleponong ito.',
      outcomeChooseMessage: 'Itinatago ng I-save ang Scan ang scan na ito sa teleponong ito.',
      scanAgain: 'Mag-scan ulit',
      whyTitle: 'Bakit ito ang resulta?',
      moreActions: 'Iba pang gagawin',
      fieldGuide: 'Gabay sa bukid',
      cancelScan: 'Kanselahin ang scan',
      openSaved: 'Buksan ang na-save na scan',
      cancelTitle: 'Kanselahin ang scan?',
      cancelMessage: 'Itago ang hindi pa tapos na scan para ituloy mamaya, o itapon ito?',
      keepDraft: 'Itago',
      discardDraft: 'Itapon',
    },
    actions: {
      startScan: 'Magsimula ng pag-scan',
      fieldGuide: 'Gabay sa bukid',
      openSettings: 'Mga setting',
    },
    settings: {
      languageLabel: 'Language / Wika',
      languageDescription: 'Piliin ang wika para sa mga screen ng magsasaka',
      english: 'Ingles',
      tagalog: 'Tagalog',
    },
    settingsScreen: {
      title: 'Mga setting', displaySection: 'ITSURA AT ACCESSIBILITY', darkMode: 'Madilim na itsura',
      darkModeDescription: 'Gumamit ng mas madilim na itsura sa buong CaneGuard', fieldGuideSection: 'GABAY SA BUKID',
      fieldGuideTitle: 'Gabay sa bukid', fieldGuideDescription: 'Alamin ang tungkol sa mga sakit at peste ng tubo',
      accountSection: 'ACCOUNT AT SEGURIDAD', fallbackName: 'Inspektor sa bukid', fallbackAccount: 'Authenticated na mobile account',
      accountSecurity: 'Seguridad ng account', accountSecurityDescription: 'Password, email, device, at biometric na mga kontrol',
      logout: 'Mag-log out', logoutAccessibility: 'Mag-log out sa iyong account', clearCached: 'Burahin ang na-download na datos ng opisina',
      clearingCached: 'Binubura ang na-download na datos…', clearCachedAccessibility: 'Burahin lamang ang na-download na datos ng opisina',
      removeLocal: 'Alisin ang lahat ng lokal na tala', removingLocal: 'Inaalis ang mga lokal na tala…',
      removeLocalAccessibility: 'Alisin ang lahat ng lokal na tala para sa account na ito', aboutSection: 'TUNGKOL SA APP', appName: 'Pangalan ng app', version: 'Bersyon',
      logoutDialogTitle: 'Mag-log out?', logoutDialogMessage: 'Isinasara ng pag-log out ang session sa server at inaalis ang protektadong kredensyal. Mananatili sa teleponong ito ang mga na-save at hindi pa tapos na scan; alisin ang mga lokal na tala bago ito ipagamit sa iba.',
      logoutDialogConfirm: 'Mag-log out', loggingOut: 'Nagla-log out…', signingOutMessage: 'Nagla-log out. Panatilihing bukas ang CaneGuard.',
      logoutIncomplete: 'Hindi kumpleto ang pag-log out', logoutIncompleteMessage: 'Hindi naalis ng CaneGuard ang ligtas na imbakan ng session. I-restart ang app at subukan muli.',
      signedOutLocally: 'Naka-log out sa device', remoteLogoutMessage: 'Hindi makontak ang server, kaya maaaring manatiling aktibo ang remote session hanggang mag-expire o mabawi ito.',
      signedOut: 'Naka-log out', clearCachedTitle: 'Burahin ang na-download na datos ng opisina?',
      clearCachedMessage: 'Aalisin nito ang mga pagbisita at update sa opisina na maaaring i-download muli. Mananatili sa teleponong ito ang mga na-save na scan, draft, ulat, hangganan at kumpletong pagbisita.',
      cancel: 'Kanselahin', clearCachedConfirm: 'Burahin ang na-download na datos', cachedCleared: 'Nabura ang na-download na datos ng opisina',
      cachedClearFailed: 'Hindi nabura ang na-download na datos', removeLocalTitle: 'Alisin ang lahat ng lokal na tala?',
      removeLocalMessage: 'Hindi na ito maibabalik. Hindi mababago ang datos sa server at ng ibang account.',
      removeLocalConfirm: 'Alisin ang mga lokal na tala', continueLocalRemoval: 'Magpatuloy sa pagbura ng mga item sa teleponong ito lamang',
      localItemsTitle: 'Burahin ang mga item na nasa teleponong ito lamang?', keepWork: 'Panatilihin ang aking gawain', deleteLocalItems: 'Burahin ang mga item sa teleponong ito lamang',
      removeLocalBusy: 'May ipinapadalang datos. Hintaying matapos ito, saka suriin muli ang mga lokal na tala.',
      removeLocalFailed: 'Hindi naalis ang mga lokal na tala', removeLocalWarning: 'Naalis ang mga lokal na tala ngunit may babala sa paglilinis',
      removedWithWarnings: 'Naalis ang mga lokal na tala, ngunit may isa o higit pang litrato na hindi pa mabura.',
      removed: 'Inalis sa teleponong ito ang mga na-save na scan, draft, ulat, hangganan, pagbisita at naka-cache na datos ng account.',
      localItemsNote: (count) => `Nasa teleponong ito lamang ang ${count} na-save na item.`,
      cachedClearedMessage: (count) => `Inalis ang ${count} na-download na item. Napanatili ang mga na-save na scan at draft.`,
      removalCounts: (counts) => `${counts.reports} ulat · ${counts.visits} pagbisita · ${counts.boundaries} hangganan · ${counts.scans} scan · ${counts.drafts} draft · ${counts.assignments} na-download na pagbisita · ${counts.notifications} update sa opisina.`,
      localItemsWarning: (count) => `Permanenteng mabubura sa teleponong ito ang ${count} item na dito lamang naka-save.`,
      localItemsDeletionMessage: (count) => `Permanenteng mabubura ang ${count} item na naka-save lamang sa teleponong ito.`
    },
    accountSecurityScreen: {
      title: 'Seguridad ng account',
      subtitle: 'Protektahan ang iyong account nang hindi binabago ang mga ulat at scan na naka-save sa device na ito.',
      fallbackName: 'Inspektor sa bukid', fallbackEmail: 'Naka-sign in na mobile account', defaultInstallationName: 'Mobile device ng CaneGuard',
      expiresUnavailable: 'Hindi makuha ang lokal na takdang oras ng session; mag-sign in muli bago magpatuloy.',
      sessionExpiryUnavailable: 'Hindi makuha ang takdang oras ng session. Mag-sign in muli para magkaroon ng server session.',
      sessionExpires: (date) => `Mag-e-expire ang session sa ${date}. Hindi ito pinahahaba ng pagbukas gamit ang biometrics.`,
      biometricTitle: 'Pagbukas gamit ang biometrics', biometricOn: 'Naka-on ang pagbukas gamit ang biometrics sa installation na ito.',
      biometricAvailable: 'May magagamit na malakas na biometric sa installation na ito.',
      biometricNotEnrolled: 'Mag-enroll muna ng malakas na biometric sa settings ng device.',
      biometricUnsupported: 'Walang malakas na biometric ang device na ito. Mag-sign in gamit ang password.',
      biometricUnavailable: 'Hindi pa magagamit ang biometric hangga’t hindi handa ang native development build. Mag-sign in gamit ang password.',
      disableBiometric: 'I-off ang pagbukas gamit ang biometrics', enableBiometric: 'I-on ang pagbukas gamit ang biometrics',
      enablingBiometric: 'Ino-on…', biometricEnableToast: 'Naka-on ang biometrics',
      biometricEnabledMessage: 'Naka-on ang pagbukas gamit ang biometrics sa installation na ito. Binubuksan nito ang nakaimbak na session matapos magsara at muling magbukas ang app, pero hindi nito pinahahaba ang bisa ng server session.',
      changePassword: 'Palitan ang password',
      changePasswordDescription: 'Protektado ang account ng password. Kapag pinalitan ito, mala-log out ang lahat ng aktibong session.',
      openChangePassword: 'Buksan ang form para palitan ang password', changeEmail: 'Palitan ang email',
      changeEmailDescription: (email) => `Kasalukuyang email: ${email}. Kapag pinalitan ito, mala-log out ang lahat ng aktibong session at kailangang beripikahin ang bagong address.`,
      openChangeEmail: 'Buksan ang form para palitan ang email', deviceEnrollment: 'Pag-enroll ng device',
      deviceEnrollmentDescription: (name) => `Pagkakakilanlan ng installation: ${name}.`,
      openDeviceEnrollment: 'Buksan ang form para mag-enroll ng device',
      enrollmentSuccess: 'Na-enroll ang installation na ito gamit ang bagong server session. Hindi nagbago ang ibang session sa iba pang device.',
    },
    accountSecurityForms: {
      common: { close: 'Isara', cancel: 'Kanselahin', discardTitle: 'Itapon ang mga pagbabago?', discardMessage: 'May mga pagbabagong hindi pa nase-save. Itapon ang mga ito?', keepEditing: 'Ipagpatuloy ang pag-edit', discard: 'Itapon' },
      password: { title: 'Palitan ang password', currentPassword: 'Kasalukuyang password', newPassword: 'Bagong password', submit: 'Palitan ang password', updating: 'Ina-update…', confirmTitle: 'Palitan ang password?', confirmMessage: 'Mala-log out ang lahat ng aktibong session kapag pinalitan ang password. Mag-sign in muli gamit ang bagong password.', confirm: 'Kumpirmahin ang pagpapalit', toast: 'Na-update ang password' },
      email: { title: 'Palitan ang email', newEmail: 'Bagong email', currentPassword: 'Kasalukuyang password', confirmPassword: 'Kumpirmahin para palitan ang email', submit: 'Palitan ang email', updating: 'Ina-update…', confirmTitle: 'Palitan ang email?', confirmMessage: 'Mala-log out ang lahat ng aktibong session kapag pinalitan ang email. Kailangang beripikahin ang bagong address.', confirm: 'Kumpirmahin ang pagpapalit', toast: 'Na-update ang email' },
      enrollment: { title: 'Pag-enroll ng device', name: 'Pangalan ng installation', nameHelp: 'Pangalan ng installation na ito sa system ng opisina. Ligtas itong itinatago at hindi ito pagkakakilanlan ng hardware.', namePlaceholder: 'Mobile device ng CaneGuard', currentPassword: 'Kasalukuyang password', confirmPassword: 'Kumpirmahin ang installation na ito', submit: 'I-enroll ang installation na ito', submitting: 'Nag-e-enroll…', confirmTitle: 'I-enroll ang installation na ito?', confirmMessage: 'Gagamit ang installation na ito ng bagong server session. Hindi mababago ang ibang session sa iba pang device.', confirm: 'I-enroll', toast: 'Na-enroll ang device' },
      biometric: { title: 'I-off ang pagbukas gamit ang biometrics', currentPassword: 'Kasalukuyang password', confirmPassword: 'Kumpirmahin para i-off', submit: 'I-off ang pagbukas gamit ang biometrics', submitting: 'Ino-off…', toast: 'Naka-off ang biometrics' },
    },
    notificationDetails: {
      headerTitle: 'Update mula sa opisina', headerSubtitle: 'Payo mula sa tanggapan ng CaneGuard',
      advisoryLabel: 'Payo', officeMessageLabel: 'Mensahe ng opisina',
      openRelated: 'Buksan ang kaugnay na aktibidad', openRelatedAccessibility: 'Buksan ang kaugnay na aktibidad',
      loading: 'Kinukuha ang update mula sa opisina', unavailableTitle: 'Hindi makita ang update mula sa opisina',
      unavailableMessage: 'Hindi na available sa device na ito ang update mula sa opisina.',
      retry: 'Subukan muli', referenceFallback: 'Update mula sa opisina', recently: 'Kamakailan',
    },
    authErrors: {
      generic: 'Hindi nakumpleto ang pagpapatotoo. Subukan muli.', 
      invalidCredentials: 'Hindi tama ang email o password.',
      emailNotVerified: 'Beripikahin ang iyong email bago mag-sign in sa CaneGuard.',
      forbiddenRole: 'Hindi maaaring mag-sign in sa CaneGuard Mobile ang ganitong uri ng account.',
      invalidResetLink: 'Hindi wasto, paso na, o nagamit na ang recovery link. Humiling ng bagong link.',
      invalidVerificationLink: 'Hindi wasto o paso na ang link ng beripikasyon sa email. Humiling ng bagong link.',
      invalidResponse: 'Hindi nakumpleto ng CaneGuard ang pagpapatotoo.',
      rateLimited: 'Masyadong maraming kahilingan. Maghintay sandali at subukan muli.',
      registrationDisabled: 'Hindi bukas ang pagpaparehistro sa publiko. Makipag-ugnayan sa tagapangasiwa ng CaneGuard para humiling ng awtorisadong account.',
      serverUnavailable: 'Hindi makakonekta ang CaneGuard sa server. Suriin ang koneksyon at subukan muli.',
      sessionExpired: 'Hindi na wasto ang iyong session sa CaneGuard.',
      stepUpRequired: 'Ilagay ang kasalukuyang password para magpatuloy.',
      validationError: 'Suriin ang mga naka-highlight na field at subukan muli.',
      signInAgain: 'Mag-sign in muli bago ipagpatuloy ang pagkilos na ito sa account.',
      signInForBiometric: 'Mag-sign in gamit ang password bago i-on ang pagbukas gamit ang biometrics.',
      biometricUnavailable: 'Hindi magagamit ang biometric. Mag-sign in gamit ang password.',
      biometricNotEnrolled: 'Mag-set up muna ng malakas na biometric bago ito gamitin.',
      biometricCancelled: 'Kinansela ang pagbukas gamit ang biometrics. Mag-sign in gamit ang password.',
      biometricVerificationFailed: 'Hindi ka makilala ng CaneGuard gamit ang biometrics. Mag-sign in gamit ang password.',
      biometricEnableFailed: 'Hindi na-on ang biometric. Nananatiling aktibo ang session gamit ang password.',
      biometricRevokeWarning: 'Na-off ang biometric sa device na ito, pero hindi nabawi ang token sa server.',
      secureStorageUnavailable: 'Hindi magagamit ang ligtas na imbakan ng session. Kinansela ang pag-enroll ng device.',
    },
    imagePreview: {
      title: 'Preview ng larawan', noImageTitle: 'Walang napiling larawan',
      noImageMessage: 'Pumili ng larawan mula sa gallery o kumuha ng litrato bago buksan ang preview.',
      chooseImage: 'Pumili ng larawan', camera: 'Camera', gallery: 'Gallery',
      dimensionsUnavailable: 'Hindi makuha ang sukat', pixels: 'pixel',
      imageAccessibility: (source) => `Napiling larawan ng tubo mula sa ${source.toLowerCase()}`,
      loadingImage: 'Kinukuha ang napiling larawan', loading: 'Kinukuha ang larawan…',
      imageUnavailable: 'Hindi makita ang preview ng larawan',
      imageLoadFailed: 'Hindi maipakita ang napiling larawan. Palitan ito at subukan muli.',
      source: 'Pinagmulan', size: 'Sukat',
      checkingNotice: 'Susuriin sa device na ito ang larawan bago ito suriin.',
      replaceSection: 'Kumuha muli / Palitan ang larawan', replaceSummary: 'Camera o gallery',
      replacementHelp: 'Mananatili ang kasalukuyang larawan hanggang pumili ka ng ipapalit. Buburahin ng pamalit ang dating resulta at mga sagot tungkol sa sintomas.',
      replaceShow: 'Ipakita ang mga opsyon sa pagpapalit ng larawan', replaceHide: 'Itago ang mga opsyon sa pagpapalit ng larawan', expandedSummary: 'Itago ang mga opsyon sa pagpapalit',
      replaceCameraAccessibility: 'Kumuha ng ibang litrato gamit ang camera', replaceCamera: 'Kumuha ng ibang litrato',
      replaceGalleryAccessibility: 'Pumili ng ibang larawan mula sa gallery', replaceGallery: 'Pumili ng ibang larawan',
      replacementSelected: 'Napili ang bagong larawan. Inalis ang dating resulta, mga sagot tungkol sa sintomas, at draft ng scan.',
      imageReplaced: 'Napaltan ang larawan',
      permissionCanAsk: 'Kailangan ng pahintulot sa camera para kumuha ng larawan ng tubo. Subukang muli.',
      permissionBlocked: 'Naka-off ang pahintulot sa camera. Buksan ang settings ng device para payagan ang CaneGuard.',
      pickerFailedCamera: 'Hindi mabuksan ang camera. Subukan muli.',
      pickerFailedGallery: 'Hindi mabuksan ang gallery. Subukan muli.',
      invalidImage: 'Walang magagamit na lokal na larawan sa pinili mo. Pumili ng ibang litrato.',
      unsupportedImage: 'Hindi suportado ang format ng larawan. Pumili ng JPEG, PNG o WebP na larawan.',
      preparingResult: 'Inihahanda ang resulta ng pagsusuri', checkingImage: 'Sinusuri ang larawan',
      preparingImage: 'Inihahanda ang larawan', modelLoading: 'Inihahanda bago suriin…',
      modelError: 'Hindi ma-load ang modelong nasa device. I-restart ang app at subukan muli.',
      analysisComplete: 'Tapos na ang pagsusuri. Buksan ang resulta para repasuhin at i-save ang scan.',
      imageReady: 'Handa na ang larawan. Subukang muli ang pagsusuri para magpatuloy.',
      analysisWaiting: 'Mananatili rito ang pagsusuri hanggang matapos ito.',
      analysisFailed: 'Hindi natapos ang pagsusuri sa device. Subukan muli.',
      statusIdle: 'Walang napiling larawan', statusImageSelected: 'Napili ang larawan',
      statusPreprocessing: 'Inihahanda ang larawan', statusAnalyzing: 'Sinusuri ang larawan',
      statusPreparingResult: 'Inihahanda ang resulta', statusCompleted: 'Tapos na ang pagsusuri', statusError: 'May error sa pagsusuri',
      imagePreparationFailed: 'Hindi naihanda ang napiling larawan. Palitan ito at subukan muli.',
      cancelAccessibility: 'Kanselahin ang scan at bumalik sa home',
      cancel: 'Kanselahin ang scan', startNew: 'Bagong scan',
      viewResultAccessibility: 'Tingnan ang resulta ng pagsusuri', viewResult: 'Tingnan ang resulta',
      analyzeAccessibility: 'Suriin ang napiling larawan', analyzing: 'Sinusuri…',
      prepareImage: 'Inihahanda ang larawan…', analyze: 'Suriin',
      retrySetupAccessibility: 'Subukang muli ang paghahanda ng pagsusuri', retrySetup: 'Subukang muli ang paghahanda',
      cancelTitle: 'Kanselahin ang scan?',
      cancelMessage: 'Itago ang kasalukuyang draft ng scan o itapon ito bago bumalik sa home?',
      keepDraft: 'Itago ang draft', discardDraft: 'Itapon ang draft',
    },
    scanScreen: {
      title: 'Mag-scan ng tubo', intro: 'Magdagdag ng malinaw na litrato ng apektadong dahon, tangkay o gitnang usbong.',
      errorTitle: 'Hindi naidagdag ang larawan', recoveryUnverified: 'May naantalang pagpili ng larawan pero hindi matiyak ang pinagmulan nito. Piliin muli ang larawan.',
      recoveryFailed: 'Hindi maibalik ang naantalang pagpili ng larawan. Subukan muli.',
      deviceSettingsFailed: 'Hindi mabuksan ang settings ng device. Buksan ang Settings at payagan ang paggamit ng camera.',
      permissionCanAsk: 'Kailangan ang pahintulot sa camera para kunan ng tubo. Subukang muli.',
      permissionBlocked: 'Naka-off ang pahintulot sa camera. Buksan ang settings ng device para payagan ang CaneGuard.',
      cameraFailed: 'Hindi mabuksan ang camera. Subukan muli.', galleryFailed: 'Hindi mabuksan ang gallery. Subukan muli.',
      invalidImage: 'Walang magagamit na lokal na larawan sa pinili mo. Pumili ng ibang litrato.',
      unsupportedImage: 'Hindi suportado ang format ng larawan. Pumili ng JPEG, PNG o WebP na larawan.',
      savingDraft: 'Sine-save sa device…',
      savedDraftTimed: (time) => `Na-save sa device · ${time}. Puwede mong isara ang CaneGuard at ituloy ang scan na ito.`,
      savedDraft: 'Na-save sa device. Puwede mong isara ang CaneGuard at ituloy ang scan na ito.',
      failedDraft: 'Hindi na-save sa device. Nananatiling bukas ang larawan — palitan ito o panatilihing bukas ang screen.',
      idleDraft: 'Hindi pa na-save sa device.', cameraBusy: 'Binubuksan ang camera…', takePhoto: 'Kumuha ng litrato',
      galleryBusy: 'Binubuksan ang gallery…', chooseFromDevice: 'Pumili mula sa device',
      cancelTitle: 'Kanselahin ang scan?', cancelMessage: 'Itago ang kasalukuyang scan o itapon ito bago bumalik sa home?',
      keepDraft: 'Itago ang draft', discardDraft: 'Itapon ang draft', selectedImage: 'Kasalukuyang piniling larawan ng tubo',
      imageSelected: 'Napili ang larawan', selectedImageHelp: 'Tingnan ang napiling larawan o magsimula ng bagong scan.',
      checkingImage: 'Sinusuri kung may napiling larawan', checkingRecovery: 'Sinusuri ng CaneGuard kung naputol ang huling pagpili ng larawan sa Android.',
      noImage: 'Wala pang naidagdag na larawan', photoTip: 'Gumamit ng maliwanag at malinaw na larawan para sa mas kapaki-pakinabang na resulta.',
      cameraSettings: 'Buksan ang Settings', tryCamera: 'Subukan muli ang camera', takeAnother: 'Kumuha ng ibang litrato',
      replaceImage: 'Kumuha ng ibang litrato para palitan ang napili', chooseAnother: 'Pumili ng ibang larawan',
      clearAndStart: 'Burahin ang kasalukuyang scan at magsimula muli', startNew: 'Bagong scan',
      photoGuide: 'Gabay sa kalidad ng larawan', guideFocus: 'Panatilihing malinaw at nakatutok ang sintomas',
      guideLighting: 'Iwasan ang madilim, malabo o malayong larawan', guideSubject: 'Kunan ang apektadong dahon, tangkay o usbong',
      returnPreview: 'Bumalik sa preview ng napiling larawan', resumeSaved: 'Ituloy ang na-save na scan', viewSelected: 'Tingnan ang napiling larawan',
      captureAccessibility: 'Kumuha ng larawan gamit ang camera', galleryAccessibility: 'Pumili ng isang larawan mula sa gallery',
      draftNotSaved: 'Hindi na-save ang draft sa device — subukan muli', draftKept: 'Itinago ang draft', draftDiscarded: 'Itinapon ang draft',
    },
    resultUncertain: {
      title: 'Hindi tiyak ang resulta',
      intro: 'Subukan ang mga hakbang na ito para sa mas malinaw na litrato. Puwede mo pa ring i-save ang scan na ito.',
      stepCloser: 'Kumuha ng mas malapit na litrato',
      stepLight: 'Gumamit ng mas maliwanag na ilaw',
      stepLeafInView: 'Panatilihing kita ang dahon',
      stepCompare: 'Ihambing sa Gabay sa bukid',
      retakePhoto: 'Kunin Muli ang Litrato',
      reviewSigns: 'Suriin ang mga Palatandaan',
      closestMatchLabel: 'Pinakamalapit na tugma:',
    },
    checkAgain: {
      action: 'Suriin muli',
      actionHint: 'Kumuha ng bagong litrato ng halamang ito at itabi ito sa scan na ito.',
      historyHeading: 'Mga pagsusuri mo',
      firstCheck: 'Unang pagsusuri',
      thisCheck: 'Tinitingnan ngayon',
      compareHeading: 'Ihambing sa unang litrato mo',
      firstPhoto: 'Unang litrato',
      newPhoto: 'Bagong litrato',
      firstPhotoUnavailable: 'Wala na sa device na ito ang unang litrato.',
      possibleCondition: 'Posibleng kondisyon',
      compareNotice:
        'Magkatabi ang dalawang litrato para tingnan mo. Hindi pinaghahambing ng CaneGuard ang dalawang resulta para sa iyo.',
      noteLabel: 'Ano ang nakikita mo ngayon?',
      notePlaceholder: 'Isulat sa sarili mong salita',
      saveFollowUp: 'I-save ang Follow-Up',
      savingFollowUp: 'Sine-save ang follow-up...',
      retrySaveFollowUp: 'Subukang muli at I-save ang Follow-Up',
      followUpSaved: 'Na-save ang follow-up sa device na ito.',
    },
    whatNow: {
      title: 'Ano ang susunod?',
      checkSigns: 'Suriin ang mga palatandaan',
      comparePhotos: 'Ihambing ang mga litrato',
      saveScan: 'I-save ang Scan',
      saving: 'Sine-save ang scan...',
      saved: 'Na-save',
      checkAgain: 'Suriin muli sa loob ng ilang araw',
    },
    scanCard: {
      title: 'Scan Card',
      photoLabel: 'Litrato ng scan',
      dateLabel: 'Petsa',
      possibleConditionLabel: 'Posibleng Kondisyon',
      noteLabel: 'Iyong tala',
      placeLabel: 'Lugar (opsyonal)',
      placeCardLabel: 'Lugar',
      placePlaceholder: 'Kung saan ka nag-scan, sa sarili mong salita',
      aiOnlyLine:
        'Pantulong lamang sa pasya ang resultang ito. Hindi nito sinasabi kung ano ang tiyak na sakit.',
      footer:
        'Ito ang sarili mong scan. Ang inspektor ang magpapasya kung kailangan ng ulat.',
      scanIdLabel: 'Scan ID',
      loading: 'Kinukuha ang iyong Scan Card…',
      loadError: 'Hindi namin makuha ang iyong Scan Card sa device na ito.',
      retryLoad: 'Subukan muli',
    },
    myScans: {
      title: 'Aking mga Scan',
      subtitle: 'Ang mga na-save mong scan sa teleponong ito.',
      searchLabel: 'Hanapin ang aking mga scan',
      searchPlaceholder: 'Hanapin ang resulta o barangay',
      filterAll: 'Lahat',
      stateNeedsChecking: 'Kailangang suriin',
      stateFollowedUp: 'Nasundan na',
      stateSaved: 'Na-save',
      countOne: '1 scan',
      countMany: '{count} scan',
      openScan: 'Buksan ang scan',
      emptyTitle: 'Wala pang scan',
      emptyMessage: 'Mag-scan ng dahon at mase-save ito dito.',
      noMatchTitle: 'Walang tugmang scan',
      noMatchMessage: 'Subukan ang ibang hanap o ipakita ang lahat ng scan.',
      clearFilters: 'Ipakita ang lahat ng scan',
      loading: 'Kinukuha ang iyong mga scan…',
      loadError: 'Hindi namin mabasa ang iyong mga scan sa teleponong ito.',
      retryLoad: 'Subukan muli',
      loadMore: 'Magpakita pa',
      startScan: 'Mag-scan',
    },
  },
};

/** Field Report steps, in order: where, what you saw, then send. */
export const FIELD_REPORT_STEP_TITLES = ['Place', 'What you saw', 'Send'] as const;

export const FIELD_REPORT_COPY = {
  draftSaved: 'Saved on this device as you go. Drafts are not sent.',
  placeTitle: 'Where is this?',
  addressSuggestion: (barangay: string, municipality: string) =>
    `Your location looks like ${barangay}, ${municipality}.`,
  addressSuggestionUse: 'Use this address',
  addressSuggestionDismiss: 'Not this',
  referenceListFallback: 'Using the place list saved on this phone.',
  scanAnswerHint: 'Filled in from your scan answer. Change it if it is not right.',
  sendReadyTitle: 'Ready to send',
  sendReadyBody: 'Everything needed is filled in. You can finalize this report.',
  sendMissingTitle: 'Still needed',
  sendMissingHint: 'Tap an item to fill it in.',
  sendExtrasTitle: 'More you can add',
  sendExtrasSummary: 'Plot boundary and field details (optional)',
} as const;

/** Finalize confirmation: a refusal because other work is running is not a failure. */
export const FINALIZE_DIALOG_COPY = {
  busyLabel: 'Finalizing…',
  refusedBusy: 'Another save is still running on this report. Wait a moment, then finalize again.',
} as const;

/** Log out confirmation, including the busy state while the server session is revoked. */
export const LOGOUT_DIALOG_COPY = {
  title: 'Log out?',
  message:
    'Logging out revokes the server session and removes the protected credential. Pending scans remain owner-scoped on this device; use Remove all local records before handing the device to another user.',
  confirmLabel: 'Log out',
  busyLabel: 'Signing out…',
  busyMessage:
    'Signing out. This can take up to 20 seconds when the connection is slow. Please keep CaneGuard open.',
  pendingNote: (count: number) =>
    `${count} saved ${count === 1 ? 'item has' : 'items have'} not reached the office yet. ${count === 1 ? 'It stays' : 'They stay'} on this device.`,
} as const;

/** Banner shown when some assigned cases were left out because this app version cannot read them yet. */
export function assignmentsSkippedMessage(count: number): string {
  return `${count} assigned ${count === 1 ? 'case' : 'cases'} could not be shown because this app version does not recognize ${count === 1 ? 'its' : 'their'} status. Update the app to see ${count === 1 ? 'it' : 'them'}.`;
}

/** Shown wherever a predicted_label from the office is not one this app version knows. */
export const UNRECOGNIZED_LABEL_TEXT = 'Not recognized by this app version';

/** Office-born case card on the visit screen. */
export const OFFICE_CASE_COPY = {
  title: 'Office case',
  badge: 'Created at the office',
  concernLabel: 'Reporter concern',
  concernNone: 'No concern was recorded for this case.',
  statusLabel: 'Office status',
  reportPhotoLabel: 'Case photo',
  lastVisitPhotoLabel: 'Last visit photo',
  noReportPhoto: 'The office did not attach a photo to this case.',
  noLastVisitPhoto: 'No photo was taken on the last visit.',
  photoUnavailable:
    'This photo is not available right now. Connect to the internet and open the case again.',
  readyOffline: 'Ready offline',
  viewerClose: 'Close photo',
  viewerOpen: (label: string) => `Open ${label.toLowerCase()}`,
  version: (version: number) => `Version ${version}`,
} as const;

/**
 * Scan path words shown right after the photo. English only for now: Tagalog
 * labels for farmer screens ship after a reviewer approves them, so none are
 * guessed here. Nothing on this path mentions sync state.
 */
export const SCAN_CHECK_COPY = {
  title: 'Check your photo',
  question: 'Which picture looks most like what you see?',
  questionHint: 'Your choice is kept with this scan and never changes the result.',
  checking: 'Checking your photo…',
  checkingDetail: 'Looking at light and focus, then reading the photo.',
  checkedTitle: 'Photo checked',
  ready: 'Photo checked. Choose a picture, then continue.',
  continue: 'Continue',
  continueWaiting: 'Checking photo…',
  continueNeedsChoice: 'Choose a picture',
  noReferencePhoto: 'No photo yet',
  failedTitle: 'This photo may be hard to read',
  failedHint: 'A new photo usually gives a clearer result.',
  retakeCamera: 'Take another photo',
  retakeGallery: 'Choose another photo',
  tryAgain: 'Try again',
  cancel: 'Cancel Scan',
} as const;

/** Short names under the pictures; the full sentence stays as the screen-reader label. */
export const SCAN_PICTURE_NAMES = {
  mosaic: 'Mosaic',
  rust: 'Rust',
  smut: 'Smut',
  'yellow-midrib': 'Yellow midrib',
  none: 'Looks healthy',
  'something-else': 'Something else',
  'unable-to-tell': 'Not sure',
} as const;
