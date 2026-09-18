# Graph Report - caneguard-mobile  (2026-09-18)

## Corpus Check
- 299 files · ~151,585 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1960 nodes · 5794 edges · 80 communities (75 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a2843a99`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- model-debug.tsx
- mobileReportStatusesApi.ts
- global.d.ts
- errors.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- fieldValidationPhotoStorage.ts
- notificationCacheRepository.ts
- recordTypes.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- activityTypes.ts
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- SyncProvider.tsx
- migrations.test.ts
- scanImageStorage.ts
- apiClient.ts
- mobileNotificationsApi.ts
- fieldValidationCompletionValidation.ts
- submissionImageStorage.ts
- model-debug.test.tsx
- ActivityScreen.tsx
- schema.ts
- _layout.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- useSaveCompletedScan.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- possibleMatchRepository.test.ts
- mobileFieldValidationAssignmentsApi.test.ts
- useTheme
- syncErrors.ts
- fieldReportSyncRepository.ts
- field-report.test.tsx
- home.tsx
- useCaneGuardModel.tsx
- ActivityScreen
- activity.test.tsx
- mobileReportStatusesV1.ts
- needsAttention.ts
- biometricAuth.ts
- deviceIdentity.ts
- assignmentCacheRepository.ts
- detection/types.ts
- image-preview.test.tsx
- theme.ts
- analysis-result.test.tsx
- Typography
- symptom-checklist.test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- syncFieldValidationCompletion.ts
- MockFile
- useFieldValidationAssignment.ts
- useFieldValidationAssignments.ts
- modelContract.ts
- fieldValidationPhotoStorage.test.ts
- toStorageError
- scan.test.tsx
- record-details.tsx
- useAuth
- FieldReportSyncRepository
- useCaneGuardDatabase
- FieldValidationCompletionSyncRepository
- useCaneGuardModel.web.tsx
- fieldReportReviewRepository.ts
- assignmentTypes.ts
- phase1LifecycleAcceptance.test.ts
- env.ts
- confidenceCaution.ts
- auth-bootstrap.test.tsx
- submissionImageStorage.test.ts
- mobileNotificationsApi.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 130 edges
2. `toStorageError()` - 97 edges
3. `StorageError` - 83 edges
4. `useAuth()` - 68 edges
5. `Typography` - 47 edges
6. `Spacing` - 45 edges
7. `requireOwnerIdentity()` - 40 edges
8. `CaneGuardDatabase` - 38 edges
9. `Radius` - 36 edges
10. `useCaneGuardDatabase()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `InputRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts
- `DebugRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-debug.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-smoke-test.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (80 total, 5 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.09
Nodes (45): RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric(), enrollMobileDevice() (+37 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (58): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+50 more)

### Community 2 - "model-debug.tsx"
Cohesion: 0.10
Nodes (22): DebugRow(), DebugRun, Fixture, FIXTURES, styles, HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow() (+14 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.06
Nodes (48): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, MOBILE_REPORT_STATUSES_V2_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses() (+40 more)

### Community 5 - "errors.ts"
Cohesion: 0.12
Nodes (22): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+14 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.12
Nodes (17): createStatementAdapter(), insertCompletion(), insertScan(), MIGRATIONS, openTestDatabase(), readMigration(), deleteFieldValidationPhoto(), FieldValidationPhotoArtifact (+9 more)

### Community 8 - "notificationCacheRepository.ts"
Cohesion: 0.08
Nodes (41): mobileNotifications, MobileAttentionLifecycle(), applyConfirmedRead(), ConfirmedReadMap, confirmedReads, listCachedMobileNotifications(), markAllCachedMobileNotificationsRead(), markCachedMobileNotificationRead() (+33 more)

### Community 10 - "recordTypes.ts"
Cohesion: 0.06
Nodes (47): FieldReportRow, ScanClassScoreRow, ScanQualityWarningRow, ScanRecordRow, ScanSymptomRow, SyncStatus, ChecklistConsistency, ReportedSeverity (+39 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.12
Nodes (25): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), letterboxRgbPixels(), roundTiesToEven() (+17 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.27
Nodes (15): getChecklistConsistency(), LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+7 more)

### Community 14 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.10
Nodes (43): FieldReportFormValues, FieldReportAuthoringState, GpsCaptureOutcome, MeasurementProvenance, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS (+35 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.14
Nodes (13): ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SMUT_OBSERVATION (+5 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "SyncProvider.tsx"
Cohesion: 0.19
Nodes (16): syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline() (+8 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (15): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration2 (+7 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (40): isSafeOwnerIdentity(), SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult (+32 more)

### Community 21 - "apiClient.ts"
Cohesion: 0.20
Nodes (17): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+9 more)

### Community 22 - "mobileNotificationsApi.ts"
Cohesion: 0.17
Nodes (29): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+21 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.33
Nodes (10): FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationGpsOutcome, SaveFieldValidationCompletionInput, invalid(), isGpsOutcome(), isUuid(), validateFieldValidationCompletionInput(), validateRequiredText() (+2 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.14
Nodes (28): toPersistenceInput(), getManagedScanImageDirectory(), ManagedImage, copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource() (+20 more)

### Community 25 - "model-debug.test.tsx"
Cohesion: 0.12
Nodes (14): formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel (+6 more)

### Community 26 - "ActivityScreen.tsx"
Cohesion: 0.09
Nodes (26): DiseasePill(), DiseasePillProps, DiseasePillVariant, VARIANT_MAP, EmptyState(), EmptyStateProps, styles, formatSavedAt() (+18 more)

### Community 27 - "schema.ts"
Cohesion: 0.07
Nodes (33): useDatabaseState(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, readCleanupTargets(), LEGACY_UNASSIGNED_OWNER_IDENTITY, FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES (+25 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "useSaveCompletedScan.ts"
Cohesion: 0.13
Nodes (15): initialScanSessionState, completedResult, ScanSessionState, NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE (+7 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (34): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+26 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.15
Nodes (22): AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock() (+14 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.27
Nodes (15): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending(), markFieldValidationCompletionSynced() (+7 more)

### Community 35 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 36 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 37 - "useTheme"
Cohesion: 0.05
Nodes (65): DetailRow(), SectionCard(), ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), concernValueForChoice(), FieldReportScreen() (+57 more)

### Community 38 - "syncErrors.ts"
Cohesion: 0.08
Nodes (35): invalid(), validateCompletion(), FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState (+27 more)

### Community 39 - "fieldReportSyncRepository.ts"
Cohesion: 0.21
Nodes (16): findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+8 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (45): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh (+37 more)

### Community 41 - "home.tsx"
Cohesion: 0.12
Nodes (15): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceClass, ReferenceTone, SectionTitle(), styles (+7 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (17): ModelSmokeTestScreen(), mockPreprocessImage, mockRun, mockRunInference, mockUseCaneGuardModel, MODEL_OUTPUT, CaneGuardModelContext, CaneGuardModelController (+9 more)

### Community 43 - "ActivityScreen"
Cohesion: 0.19
Nodes (11): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), describeRefreshAllResult(), REFRESH_ALL_TARGET_LABELS, RefreshAllResult (+3 more)

### Community 44 - "activity.test.tsx"
Cohesion: 0.11
Nodes (16): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+8 more)

### Community 46 - "needsAttention.ts"
Cohesion: 0.20
Nodes (12): ACTIVE_ASSIGNMENT_STATES, assignmentItems(), assignmentMeta(), buildNeedsAttention(), compareNullableDates(), NEEDS_ATTENTION_ROW_LIMIT, NeedsAttentionKind, NeedsAttentionSummary (+4 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.46
Nodes (6): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability()

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "assignmentCacheRepository.ts"
Cohesion: 0.25
Nodes (12): findCachedFieldValidationAssignment(), markCachedFieldValidationAssignmentCompleted(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment(), toRow(), updateCachedAssignmentState(), notificationDestinationRoute() (+4 more)

### Community 50 - "detection/types.ts"
Cohesion: 0.23
Nodes (9): ModelLabel, ClassScore, DetectionResult, InferenceTimings, ScanSessionStatus, ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES (+1 more)

### Community 51 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (13): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+5 more)

### Community 52 - "theme.ts"
Cohesion: 0.09
Nodes (40): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), formatThreshold(), ScoreRow(), styles, ImagePreviewScreen(), styles (+32 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "Typography"
Cohesion: 0.08
Nodes (24): DiseaseReferenceScreen(), REFERENCE_ITEMS, ReferenceItem, styles, ConfirmDialog(), ConfirmDialogProps, styles, Pill() (+16 more)

### Community 55 - "symptom-checklist.test.tsx"
Cohesion: 0.14
Nodes (13): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_OBSERVATIONS, GUIDED_VALIDATION_QUESTIONS (+5 more)

### Community 56 - "runInference.ts"
Cohesion: 0.12
Nodes (15): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceStage(), InferenceError (+7 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.19
Nodes (27): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+19 more)

### Community 58 - "syncFieldValidationCompletion.ts"
Cohesion: 0.16
Nodes (15): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, mapFieldValidationCompletionToMultipart(), validateImage(), completion (+7 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useFieldValidationAssignment.ts"
Cohesion: 0.13
Nodes (17): complete, state, markCachedFieldValidationAssignmentInProgress(), findFieldValidationCompletion(), saveFieldValidationCompletion(), toCompletion(), normalizeFieldValidationText(), CompleteFieldValidationInput (+9 more)

### Community 61 - "useFieldValidationAssignments.ts"
Cohesion: 0.27
Nodes (11): FieldValidationAssignmentState, listCachedFieldValidationAssignments(), FieldValidationAssignment, AssignmentState, useFieldValidationAssignments(), ActiveRefresh, activeRefreshes, executeRefresh() (+3 more)

### Community 62 - "modelContract.ts"
Cohesion: 0.15
Nodes (21): DevelopmentModelSmokeTestScreen(), MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_SHA256, MODEL_VERSION, compareV1QaOutput(), expectedOutputByFixture (+13 more)

### Community 63 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 64 - "toStorageError"
Cohesion: 0.12
Nodes (45): StorageError, toStorageError(), cleanupImages(), clearLocalDataForOwner(), purgeExpiredLocalData(), requireOwnerIdentity(), LocationUnavailableReason, createScanRecordRepository() (+37 more)

### Community 65 - "scan.test.tsx"
Cohesion: 0.17
Nodes (10): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanHarness() (+2 more)

### Community 66 - "record-details.tsx"
Cohesion: 0.10
Nodes (27): firstParam(), getInitialCenter(), ManualMapScreen(), styles, CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration() (+19 more)

### Community 67 - "useAuth"
Cohesion: 0.07
Nodes (41): ForgotPasswordScreen(), styles, SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles (+33 more)

### Community 69 - "useCaneGuardDatabase"
Cohesion: 0.09
Nodes (30): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, mockLoadMore (+22 more)

### Community 70 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.18
Nodes (3): FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 72 - "fieldReportReviewRepository.ts"
Cohesion: 0.26
Nodes (9): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+1 more)

### Community 73 - "assignmentTypes.ts"
Cohesion: 0.32
Nodes (5): ASSIGNMENT, createStatementAdapter(), openTestDatabase(), readMigration(), FieldValidationAssignmentUpdate

### Community 74 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.33
Nodes (3): createStatementAdapter(), prepareSync(), request

### Community 75 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 79 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

## Knowledge Gaps
- **501 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+496 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `record-details.tsx`, `useAuth`, `model-debug.tsx`, `errors.ts`, `home.tsx`, `ActivityScreen`, `theme.ts`, `Typography`, `model-debug.test.tsx`, `ActivityScreen.tsx`, `modelContract.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `toStorageError`, `record-details.tsx`, `mobileReportStatusesApi.ts`, `useTheme`, `useCaneGuardDatabase`, `notificationCacheRepository.ts`, `home.tsx`, `recordTypes.ts`, `field-report.test.tsx`, `AuthProvider.test.tsx`, `auth-bootstrap.test.tsx`, `useFieldValidationAssignment.ts`, `SyncProvider.tsx`, `theme.ts`, `schema.ts`, `_layout.tsx`, `useFieldValidationAssignments.ts`, `useSaveCompletedScan.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `StorageError` connect `toStorageError` to `fieldValidationCompletionRepository.ts`, `useCaneGuardDatabase`, `errors.ts`, `fieldValidationPhotoStorage.ts`, `notificationCacheRepository.ts`, `fieldReportSyncRepository.ts`, `recordTypes.ts`, `fieldReportReviewRepository.ts`, `recordValidation.ts`, `submissionImageStorage.test.ts`, `fieldReportValidation.ts`, `assignmentCacheRepository.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `schema.ts`, `useFieldValidationAssignment.ts`, `useSaveCompletedScan.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _501 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09490196078431372 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06656426011264721 - nodes in this community are weakly interconnected._