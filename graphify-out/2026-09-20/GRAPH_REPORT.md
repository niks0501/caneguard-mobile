# Graph Report - caneguard-mobile  (2026-09-20)

## Corpus Check
- 313 files · ~160,372 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2040 nodes · 6116 edges · 76 communities (73 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `035a5a07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- today.tsx
- global.d.ts
- scanRecordRepository.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- mobileNotificationsApi.ts
- schema.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- activity.test.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- fieldValidationCompletionValidation.ts
- useFieldReportDraft.test.tsx
- localDataLifecycle.test.ts
- submissionImageStorage.ts
- StorageError
- localDataLifecycle.ts
- todayVisits.ts
- _layout.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- activityTypes.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- analysis-result.tsx
- resolveNotificationDestination.ts
- field-report.tsx
- syncErrors.ts
- ScanRecordListItem
- field-report.test.tsx
- auth-bootstrap.test.tsx
- ActivityScreen
- needsAttention.ts
- mobileReportStatusesV1.ts
- useCaneGuardModel.tsx
- biometricAuth.ts
- deviceIdentity.ts
- reportReviewTypes.ts
- detection/types.ts
- ActivityScreen.tsx
- analysis-result.test.tsx
- Radius
- model-debug.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- mobileFieldValidationCompletionMapper.ts
- scanImageStorage.test.ts
- useHomeAttention.test.ts
- modelContract.ts
- fieldValidationPhotoStorage.test.ts
- toStorageError
- record-details.tsx
- manual-map.tsx
- syncFieldReport.ts
- useAuth
- mobileReportStatusesApi.ts
- reportRepository.ts
- recordTypes.ts
- AssignmentCard.tsx
- submissionImageStorage.test.ts
- useFieldValidationAssignment.ts
- assignmentCacheRepository.ts
- records.test.tsx
- useCaneGuardModel.web.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 142 edges
2. `toStorageError()` - 100 edges
3. `StorageError` - 83 edges
4. `useAuth()` - 70 edges
5. `Typography` - 52 edges
6. `Spacing` - 50 edges
7. `requireOwnerIdentity()` - 41 edges
8. `Radius` - 40 edges
9. `CaneGuardDatabase` - 38 edges
10. `useCaneGuardDatabase()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `MeasurementChoice()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `ReadyToSubmitChecklist()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (76 total, 3 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.09
Nodes (43): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail() (+35 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (57): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+49 more)

### Community 2 - "useTheme"
Cohesion: 0.11
Nodes (27): CompletionActions(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), styles, SubmittedCaseEvidence(), VisitContext() (+19 more)

### Community 3 - "today.tsx"
Cohesion: 0.12
Nodes (19): SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, BUCKET_LABELS, styles, TodayScreen() (+11 more)

### Community 5 - "scanRecordRepository.ts"
Cohesion: 0.12
Nodes (23): useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), buildConditions() (+15 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.09
Nodes (36): styles, SplashScreen(), styles, styles, ResetParams, styles, DevelopmentStorageDebugScreen(), DiagnosticRow() (+28 more)

### Community 8 - "mobileNotificationsApi.ts"
Cohesion: 0.05
Nodes (76): MOBILE_NOTIFICATIONS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed() (+68 more)

### Community 10 - "schema.ts"
Cohesion: 0.10
Nodes (23): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, GPS_CAPTURE_OUTCOMES, LOCATION_UNAVAILABLE_REASONS, MEASUREMENT_PROVENANCES (+15 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.10
Nodes (30): ImagePreviewScreen(), MODEL_INPUT, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry() (+22 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.13
Nodes (27): AuthProvider(), AuthenticatedHomeRoute(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession() (+19 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.27
Nodes (15): getChecklistConsistency(), LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+7 more)

### Community 14 - "activity.test.tsx"
Cohesion: 0.11
Nodes (16): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+8 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.06
Nodes (59): FieldReportFormValues, DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams (+51 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.14
Nodes (14): ChecklistConsistency, ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION (+6 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.10
Nodes (37): syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+29 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.09
Nodes (17): LEGACY_UNASSIGNED_OWNER_IDENTITY, migration0, migration1, migration10, migration11, migration12, migration13, migration14 (+9 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (32): isSafeOwnerIdentity(), SaveCompletedScanOptions, collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.17
Nodes (22): FIELD_VALIDATION_GPS_OUTCOMES, invalid(), isFollowUpOutcome(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+14 more)

### Community 22 - "useFieldReportDraft.test.tsx"
Cohesion: 0.14
Nodes (11): DATABASE, mockCaptureGpsLocation, mockClearLocationUnavailable, mockCreateOrGetFieldReportDraft, mockDeleteFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID (+3 more)

### Community 23 - "localDataLifecycle.test.ts"
Cohesion: 0.15
Nodes (11): createStatementAdapter(), insertCompletion(), insertScan(), MIGRATIONS, openTestDatabase(), readMigration(), getManagedScanImageDirectory(), copyLegacySourceToCanonical() (+3 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.16
Nodes (22): toPersistenceInput(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES, persistCandidate(), PreparedSubmissionImage (+14 more)

### Community 25 - "StorageError"
Cohesion: 0.11
Nodes (26): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+18 more)

### Community 26 - "localDataLifecycle.ts"
Cohesion: 0.19
Nodes (13): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), fieldValidationAssignments (+5 more)

### Community 27 - "todayVisits.ts"
Cohesion: 0.25
Nodes (11): ACTIVE_ASSIGNMENT_STATES, bucketForVisit(), compareNullableDates(), compareVisits(), daysBetweenDateKeys(), formatDate(), formatTodayDueLine(), getLocalDateKey() (+3 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.11
Nodes (36): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+28 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.12
Nodes (26): LOCAL_SESSION_MAX_AGE_MS, AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError() (+18 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.16
Nodes (22): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), listFieldValidationCompletions(), markFieldValidationCompletionFailed() (+14 more)

### Community 35 - "analysis-result.tsx"
Cohesion: 0.08
Nodes (33): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), formatThreshold(), ScoreRow(), SectionCard(), styles (+25 more)

### Community 36 - "resolveNotificationDestination.ts"
Cohesion: 0.39
Nodes (6): findCachedFieldValidationAssignment(), notificationDestinationRoute(), resolveNotificationDestination(), database, findAssignment, findLocal

### Community 37 - "field-report.tsx"
Cohesion: 0.07
Nodes (35): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), FieldReportScreenProps, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatLocationSummary() (+27 more)

### Community 38 - "syncErrors.ts"
Cohesion: 0.15
Nodes (16): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+8 more)

### Community 39 - "ScanRecordListItem"
Cohesion: 0.15
Nodes (13): SyncStatus, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, ScanRecordListItem (+5 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.07
Nodes (46): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockDiscardDraft, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh (+38 more)

### Community 43 - "ActivityScreen"
Cohesion: 0.19
Nodes (11): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), describeRefreshAllResult(), REFRESH_ALL_TARGET_LABELS, RefreshAllResult (+3 more)

### Community 44 - "needsAttention.ts"
Cohesion: 0.14
Nodes (14): mockAttentionItems, mockMarkRead, mockRouterPush, ACTIVE_ASSIGNMENT_STATES, assignmentItems(), buildNeedsAttention(), HOME_ATTENTION_ROW_LIMIT, NEEDS_ATTENTION_ROW_LIMIT (+6 more)

### Community 46 - "useCaneGuardModel.tsx"
Cohesion: 0.10
Nodes (23): ModelSmokeTestScreen(), mockPreprocessImage, mockRun, mockRunInference, mockUseCaneGuardModel, MODEL_OUTPUT, mockAsset, mockAssetDownloadAsync (+15 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 51 - "detection/types.ts"
Cohesion: 0.05
Nodes (49): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+41 more)

### Community 52 - "ActivityScreen.tsx"
Cohesion: 0.13
Nodes (14): EmptyState(), EmptyStateProps, styles, contrastRatio(), relLuminance(), Typography, styles, TodayEntry() (+6 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "Radius"
Cohesion: 0.08
Nodes (28): DiseaseReferenceScreen(), styles, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, InputRow() (+20 more)

### Community 55 - "model-debug.tsx"
Cohesion: 0.13
Nodes (16): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+8 more)

### Community 56 - "runInference.ts"
Cohesion: 0.12
Nodes (17): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+9 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.06
Nodes (54): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath() (+46 more)

### Community 58 - "mobileFieldValidationCompletionMapper.ts"
Cohesion: 0.10
Nodes (17): FIELD_VALIDATION_FOLLOW_UP_OUTCOMES, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+9 more)

### Community 59 - "scanImageStorage.test.ts"
Cohesion: 0.12
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 61 - "useHomeAttention.test.ts"
Cohesion: 0.23
Nodes (12): NeedsAttentionItem, mockUseAssignments, mockUseDestinations, mockUseNotifications, HomeAttention, useHomeAttention(), EMPTY_DESTINATIONS, useNotificationDestinations() (+4 more)

### Community 62 - "modelContract.ts"
Cohesion: 0.11
Nodes (26): DevelopmentModelSmokeTestScreen(), HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), SmokeVerification, styles, IconSize, isBelowV1ConfidenceCautionThreshold() (+18 more)

### Community 63 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 64 - "toStorageError"
Cohesion: 0.11
Nodes (39): toStorageError(), requireOwnerIdentity(), LocationUnavailableReason, persistSubmissionImageMetadata(), getSubmissionImageUri(), cleanupPreparedImage(), clearLocationUnavailable(), createOrGetFieldReportDraft() (+31 more)

### Community 66 - "record-details.tsx"
Cohesion: 0.13
Nodes (22): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+14 more)

### Community 67 - "manual-map.tsx"
Cohesion: 0.19
Nodes (12): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), styles (+4 more)

### Community 68 - "syncFieldReport.ts"
Cohesion: 0.13
Nodes (4): FieldReportSyncRepository, RETRY_DELAYS_MS, syncFieldReport(), REPORT

### Community 69 - "useAuth"
Cohesion: 0.12
Nodes (27): concernValueForChoice(), FieldReportScreen(), getReporterConcernChoice(), isStepIncomplete(), mockReplace, mockUseAuth, mockUseAuth, EMPTY_DATABASE (+19 more)

### Community 70 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (46): fieldReports, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError() (+38 more)

### Community 71 - "reportRepository.ts"
Cohesion: 0.23
Nodes (10): buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), DATABASE, mockGetLocalReportSummary, mockUser (+2 more)

### Community 72 - "recordTypes.ts"
Cohesion: 0.20
Nodes (13): ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, QualityWarning, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS (+5 more)

### Community 77 - "AssignmentCard.tsx"
Cohesion: 0.10
Nodes (23): DiseasePill(), DiseasePillProps, DiseasePillVariant, VARIANT_MAP, Pill(), PillProps, styles, VARIANT_CONFIG (+15 more)

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 79 - "useFieldValidationAssignment.ts"
Cohesion: 0.14
Nodes (20): complete, state, FieldValidationAssignmentState, FieldValidationFollowUpOutcome, FieldValidationGpsOutcome, completion, Contract, TestFormData (+12 more)

### Community 80 - "assignmentCacheRepository.ts"
Cohesion: 0.14
Nodes (20): listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment(), toRow(), updateCachedAssignmentState() (+12 more)

### Community 82 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 84 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

## Knowledge Gaps
- **518 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+513 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `record-details.tsx`, `analysis-result.tsx`, `manual-map.tsx`, `useAuth`, `field-report.tsx`, `theme.ts`, `today.tsx`, `preprocessImage.ts`, `ActivityScreen`, `AssignmentCard.tsx`, `ActivityScreen.tsx`, `Radius`, `model-debug.tsx`, `StorageError`, `modelContract.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `today.tsx`, `scanRecordRepository.ts`, `theme.ts`, `mobileNotificationsApi.ts`, `AuthProvider.test.tsx`, `fieldReportValidation.ts`, `fieldReportSyncRepository.ts`, `useFieldReportDraft.test.tsx`, `_layout.tsx`, `field-report.tsx`, `field-report.test.tsx`, `auth-bootstrap.test.tsx`, `Radius`, `useHomeAttention.test.ts`, `toStorageError`, `record-details.tsx`, `manual-map.tsx`, `mobileReportStatusesApi.ts`, `reportRepository.ts`, `useFieldValidationAssignment.ts`, `assignmentCacheRepository.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `record-details.tsx`, `fieldValidationCompletionRepository.ts`, `resolveNotificationDestination.ts`, `useAuth`, `field-report.tsx`, `scanRecordRepository.ts`, `mobileNotificationsApi.ts`, `mobileReportStatusesApi.ts`, `field-report.test.tsx`, `reportRepository.ts`, `useFieldValidationAssignment.ts`, `assignmentCacheRepository.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `StorageError`, `localDataLifecycle.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _518 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09361393323657474 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06821787414066631 - nodes in this community are weakly interconnected._