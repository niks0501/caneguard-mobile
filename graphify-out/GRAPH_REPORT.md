# Graph Report - caneguard-mobile  (2026-09-01)

## Corpus Check
- 273 files · ~127,606 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1758 nodes · 5104 edges · 72 communities (69 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `353c80da`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- mobileReportStatusesApi.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- inferenceErrors.ts
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.tsx
- recordValidation.ts
- ActivityScreen.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- FieldValidationCompletionSyncRepository
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- fieldReportSyncRepository.ts
- fieldValidationPhotoStorage.ts
- submissionImageStorage.ts
- symptom-checklist.test.tsx
- Typography
- schema.ts
- scan.test.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncErrors.ts
- online-map-picker.tsx
- fieldValidationCompletionValidation.ts
- toStorageError
- mobileNotificationsApi.ts
- recordTypes.ts
- fieldReportRepository.ts
- phase1LifecycleAcceptance.test.ts
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- mobileFieldValidationAssignmentsApi.ts
- notificationCacheRepository.ts
- assessImageQuality.ts
- syncPendingFieldReports.ts
- env.ts
- useFieldValidationAssignment.ts
- useCaneGuardDatabase
- model-debug.tsx
- captureGpsLocation.ts
- analysis-result.test.tsx
- image-preview.test.tsx
- _layout.tsx
- runInference.ts
- AppButton.tsx
- MockFile
- MockFile
- useRecords.ts
- assignmentCacheRepository.ts
- compareParityReference.ts
- activity.test.tsx
- useFieldReportDraft.ts
- useMobileNotifications.test.tsx
- home.tsx
- useAuth
- repositoryContracts.ts
- activityTypes.ts
- notificationCacheRepository.test.ts
- useCaneGuardModel.web.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 57 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `Radius` - 35 edges
8. `CaneGuardDatabase` - 35 edges
9. `useCaneGuardDatabase()` - 32 edges
10. `getStorageErrorMessage()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedHomeRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/__tests__/auth-bootstrap.test.tsx → src/features/auth/hooks/useAuth.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `EvidenceForm()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-validation.tsx → src/hooks/use-theme.ts
- `Row()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-validation.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (72 total, 3 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.12
Nodes (38): RegisterScreen(), styles, AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric() (+30 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.08
Nodes (53): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+45 more)

### Community 2 - "useTheme"
Cohesion: 0.06
Nodes (52): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatTimestamp() (+44 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.06
Nodes (57): contract, LifecycleContract, MOBILE_REPORT_STATUSES_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError() (+49 more)

### Community 5 - "StorageError"
Cohesion: 0.11
Nodes (27): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+19 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.09
Nodes (26): AppNavigator(), InputRow(), InputRowProps, styles, DisabledRow(), DisabledRowProps, SettingsScreen(), styles (+18 more)

### Community 8 - "inferenceErrors.ts"
Cohesion: 0.18
Nodes (10): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage() (+2 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.15
Nodes (21): scanClassScores, scanQualityWarnings, scanSymptoms, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById() (+13 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.21
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+6 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.06
Nodes (67): AuthenticatedHomeRoute(), fetchMock, mockSession, logoutMobile(), AuthContext, AuthContextValue, AuthProvider(), getAuthErrorMessage() (+59 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.33
Nodes (13): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "ActivityScreen.tsx"
Cohesion: 0.09
Nodes (27): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, BottomNav() (+19 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.20
Nodes (22): FieldReportSubmissionEvidence, coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported() (+14 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.15
Nodes (12): ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SOMETHING_ELSE_OBSERVATION (+4 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (38): SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+30 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.15
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "fieldReportSyncRepository.ts"
Cohesion: 0.15
Nodes (27): syncPendingFieldValidationCompletions(), findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions (+19 more)

### Community 23 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.31
Nodes (10): deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput, getFieldValidationPhotoDirectory(), isManagedFieldValidationPhotoUri(), MIME_TO_EXTENSION, persistFieldValidationPhoto(), removePhoto() (+2 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.10
Nodes (34): persistSubmissionImageMetadata(), toPersistenceInput(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS (+26 more)

### Community 25 - "symptom-checklist.test.tsx"
Cohesion: 0.13
Nodes (16): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, GUIDED_VALIDATION_QUESTIONS, ScanSessionContext (+8 more)

### Community 26 - "Typography"
Cohesion: 0.11
Nodes (20): DiseaseBadge(), DiseaseBadgeProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP (+12 more)

### Community 27 - "schema.ts"
Cohesion: 0.11
Nodes (18): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+10 more)

### Community 28 - "scan.test.tsx"
Cohesion: 0.15
Nodes (14): mockDispatch, renderPreview(), PreviewHarness(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission (+6 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncErrors.ts"
Cohesion: 0.12
Nodes (21): readRemoteId(), uploadMobileFieldValidationCompletion(), FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, RETRY_DELAYS_MS, syncFieldValidationCompletion(), SyncFieldValidationCompletionOptions, ActiveRun (+13 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.20
Nodes (18): appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion(), validateImage(), FieldValidationCompletionUploadRecord (+10 more)

### Community 34 - "toStorageError"
Cohesion: 0.26
Nodes (19): toStorageError(), countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed() (+11 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 36 - "recordTypes.ts"
Cohesion: 0.16
Nodes (19): FieldReportRow, ScanClassScoreRow, ScanQualityWarningRow, ScanRecordRow, ScanSymptomRow, ChecklistConsistency, ModelLabel, ClassScore (+11 more)

### Community 37 - "fieldReportRepository.ts"
Cohesion: 0.10
Nodes (25): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, FieldReportAuthoringState (+17 more)

### Community 38 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.29
Nodes (4): FIELD_VALIDATION_ASSIGNMENT_STATES, createStatementAdapter(), prepareSync(), request

### Community 39 - "reportRepository.ts"
Cohesion: 0.16
Nodes (16): fieldReports, ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT (+8 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (50): DraftFields(), FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport (+42 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.12
Nodes (21): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+13 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.16
Nodes (13): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+5 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.13
Nodes (23): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+15 more)

### Community 44 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.05
Nodes (53): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed() (+45 more)

### Community 45 - "notificationCacheRepository.ts"
Cohesion: 0.17
Nodes (19): mobileNotifications, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification, MobileNotificationsState (+11 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.28
Nodes (5): assessImageQuality(), ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 47 - "syncPendingFieldReports.ts"
Cohesion: 0.15
Nodes (15): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch() (+7 more)

### Community 48 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 49 - "useFieldValidationAssignment.ts"
Cohesion: 0.18
Nodes (11): complete, state, FieldValidationGpsOutcome, SyncStatus, completion, Contract, TestFormData, FieldValidationCompletion (+3 more)

### Community 50 - "useCaneGuardDatabase"
Cohesion: 0.11
Nodes (22): FieldReportScreen(), DatabaseInitializationView(), useCaneGuardDatabase(), getStorageErrorMessage(), mockDatabase, mockRandomUUID, mockSaveCompletedScan, usePaginatedScanRecords() (+14 more)

### Community 51 - "model-debug.tsx"
Cohesion: 0.16
Nodes (13): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+5 more)

### Community 52 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "image-preview.test.tsx"
Cohesion: 0.20
Nodes (9): mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState, successfulInferenceResult (+1 more)

### Community 55 - "_layout.tsx"
Cohesion: 0.20
Nodes (7): styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 56 - "runInference.ts"
Cohesion: 0.20
Nodes (8): InferenceError, normalizeScores(), PostprocessedOutput, postprocessOutput(), InferenceRunner, runInference(), softmax(), DetectionResult

### Community 57 - "AppButton.tsx"
Cohesion: 0.14
Nodes (14): SplashScreen(), styles, hasVerificationParams(), readParam(), styles, VerifyEmailScreen(), VerifyParams, AppButton() (+6 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useRecords.ts"
Cohesion: 0.14
Nodes (12): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, MAX_RECORD_PAGE_SIZE, ScanRecordListItem (+4 more)

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.14
Nodes (25): FieldValidationAssignmentState, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment() (+17 more)

### Community 62 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 63 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 64 - "useFieldReportDraft.ts"
Cohesion: 0.11
Nodes (25): createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation(), toFieldReport() (+17 more)

### Community 65 - "useMobileNotifications.test.tsx"
Cohesion: 0.22
Nodes (8): MobileAttentionLifecycle(), CACHED, database, listCache, markSessionExpired, Probe(), refreshService, useMobileNotifications()

### Community 66 - "home.tsx"
Cohesion: 0.11
Nodes (18): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+10 more)

### Community 67 - "useAuth"
Cohesion: 0.09
Nodes (24): ForgotPasswordScreen(), styles, LoginScreen(), readParam(), ResetParams, ResetPasswordScreen(), styles, mockUseAuth (+16 more)

### Community 68 - "repositoryContracts.ts"
Cohesion: 0.31
Nodes (4): ScanRecordRepository, ScanRecordWriteRepository, SaveCompletedScanInput, ScanRecordQuery

### Community 69 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 70 - "notificationCacheRepository.test.ts"
Cohesion: 0.29
Nodes (6): MobileNotificationsResult, createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration(), MobileNotificationUpdate

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

## Knowledge Gaps
- **448 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+443 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `home.tsx`, `useAuth`, `StorageError`, `theme.ts`, `possibleMatch.ts`, `analysis-result.tsx`, `inferenceErrors.ts`, `record-details.tsx`, `ActivityScreen.tsx`, `useCaneGuardDatabase`, `model-debug.tsx`, `AppButton.tsx`, `Typography`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `useFieldReportDraft.ts`, `useMobileNotifications.test.tsx`, `useTheme`, `home.tsx`, `mobileReportStatusesApi.ts`, `fieldReportRepository.ts`, `theme.ts`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `AuthProvider.tsx`, `notificationCacheRepository.ts`, `useFieldValidationAssignment.ts`, `useCaneGuardDatabase`, `fieldReportSyncRepository.ts`, `_layout.tsx`, `useRecords.ts`, `assignmentCacheRepository.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `useFieldReportDraft.ts`, `fieldValidationCompletionValidation.ts`, `toStorageError`, `mobileReportStatusesApi.ts`, `fieldReportRepository.ts`, `scanRecordRepository.ts`, `notificationCacheRepository.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `useCaneGuardDatabase`, `scanImageStorage.ts`, `fieldReportSyncRepository.ts`, `fieldValidationPhotoStorage.ts`, `submissionImageStorage.ts`, `symptom-checklist.test.tsx`, `assignmentCacheRepository.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `login.test.tsx` and `usePossibleRecentMatch.test.tsx`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _448 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12427409988385599 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07727272727272727 - nodes in this community are weakly interconnected._