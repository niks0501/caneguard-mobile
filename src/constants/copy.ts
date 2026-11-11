/**
 * Single source of truth for canonical user-facing copy strings.
 */

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

/** Unfinished report, visit and plot drafts: found on Home, resumed in one tap, never sent until finished. */
export const UNFINISHED_COPY = {
  label: 'Not finished',
  meta: 'Not finished · saved on this device',
  reportLead: 'Finish your field report',
  visitLead: (referenceCode: string) => `Finish your visit for ${referenceCode}`,
  plotLead: 'Finish your plot boundary',
} as const;

export const FIELD_VALIDATION_UNAVAILABLE =
  'Field validation needs an active inspector assignment to the pilot district. Ask your office to check your account.';

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
  districtLabel: 'District code',
  districtPlaceholder: 'Enter your assigned district code',
  districtRequired: 'Enter a district code before syncing.',
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
  walkStart: 'Walk the edge',
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

/** Offline readiness (D01) — before field work without a connection. */
export const OFFLINE_READINESS_COPY = {
  readyTitle: 'Ready for offline work',
  notReadyTitle: 'Not ready for offline work',
  explanation:
    'CaneGuard keeps the existing protected-session boundary: a password-only sign-in is not stored, so closing the app while offline returns you to the sign-in screen. Biometric unlock keeps the same unexpired account resumable offline; it never stores your password or ignores a rejected credential.',
  passwordOnlyRestartLimit:
    'Password-only sign-in: if CaneGuard closes while you are offline, you must sign in again when a connection returns. Turn on biometric unlock in Account security before field work to resume offline after a restart.',
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

export const FIELD_GUIDE_ENTRY_DESCRIPTION = 'Read about sugarcane diseases and pests';

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
 * Home wording: the "Morning Note" sentences, plus the header band, glance strip
 * and signs strip labels. The sentences are proposals awaiting owner review; the
 * app has no i18n layer, so any Filipino or Tagalog wording is a separate
 * decision. Sync-derived sentences live in `syncStatusCopy.ts`.
 */
export const HOME_NOTE_COPY = {
  allClear: 'All clear.',
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
  glanceHeading: 'Today at a glance',
  glanceToday: 'Visits today',
  glanceOverdue: 'Overdue',
  glanceWaiting: 'Waiting to send',
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
 * Inspector screens, Field Guide entry text and model decision-support lines
 * stay English and do not live here. Words such as "Validated", "Confirmed",
 * "Resolved" and "Diagnosis" (and their Tagalog equivalents) never appear in
 * farmer copy; `farmerCopy.test.ts` enforces this for both languages.
 */
export type FarmerLanguage = 'en' | 'tl';

export type FarmerCopyBlock = {
  greeting: { morning: string; afternoon: string; evening: string };
  actions: {
    startScan: string;
    measurePlot: string;
    fieldGuide: string;
    openSettings: string;
  };
  settings: { languageLabel: string; languageDescription: string; english: string; tagalog: string };
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
    actions: {
      startScan: 'Start a scan',
      measurePlot: 'Measure a plot',
      fieldGuide: 'Field guide',
      openSettings: 'Settings',
    },
    settings: {
      languageLabel: 'Language / Wika',
      languageDescription: 'Choose the language for farmer screens',
      english: 'English',
      tagalog: 'Tagalog',
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
    actions: {
      startScan: 'Magsimula ng pag-scan',
      measurePlot: 'Sukatin ang bukid',
      fieldGuide: 'Gabay sa bukid',
      openSettings: 'Mga setting',
    },
    settings: {
      languageLabel: 'Language / Wika',
      languageDescription: 'Piliin ang wika para sa mga screen ng magsasaka',
      english: 'Ingles',
      tagalog: 'Tagalog',
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

/** Office-born case card on the field validation screen. */
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
