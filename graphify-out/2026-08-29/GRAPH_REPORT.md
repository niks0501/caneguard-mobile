# Graph Report - caneguard-mobile  (2026-08-29)

## Corpus Check
- 258 files · ~116,764 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1640 nodes · 4717 edges · 66 communities (65 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5cc4bb95`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileNotificationsApi.ts
- reportMultipartMapper.ts
- field-validation.tsx
- fieldReportReviewRepository.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- use-theme.ts
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.tsx
- recordValidation.ts
- useTheme
- fieldReportRepository.ts
- detection/types.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- syncFieldValidationCompletion.ts
- saveCompletedScan.ts
- submissionImageStorage.ts
- fieldReportSyncRepository.ts
- RecordCard.tsx
- schema.ts
- image-preview.test.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- reportMultipartMapper.contract.test.ts
- online-map-picker.tsx
- Radius
- analysis-result.test.tsx
- notificationCacheRepository.ts
- scan.tsx
- mobileReportStatusesApi.ts
- useFieldValidationAssignment.ts
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- assignmentCacheRepository.ts
- toStorageError
- assessImageQuality.ts
- SyncProvider.tsx
- runInference.ts
- fieldValidationCompletionRepository.ts
- recordTypes.ts
- ActivityScreen.tsx
- Typography
- activity.test.tsx
- _layout.tsx
- fieldValidationCompletionValidation.ts
- useCaneGuardModel.web.tsx
- records.test.tsx
- submissionImageStorage.test.ts
- MockFile
- mobileNotificationsApi.test.ts
- mobileFieldValidationAssignmentsApi.ts
- notificationCacheRepository.test.ts
- useMobileNotifications.test.tsx
- model-debug.test.tsx
- reportMultipartMapper.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 124 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 47 edges
5. `Typography` - 38 edges
6. `Spacing` - 35 edges
7. `CaneGuardDatabase` - 35 edges
8. `useCaneGuardDatabase()` - 32 edges
9. `Radius` - 31 edges
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

## Communities (66 total, 1 thin omitted)

### Community 0 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.16
Nodes (30): FieldReportUploadRecord, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+22 more)

### Community 2 - "field-validation.tsx"
Cohesion: 0.14
Nodes (14): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, RegisterScreen() (+6 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.23
Nodes (10): fieldReports, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter() (+2 more)

### Community 5 - "StorageError"
Cohesion: 0.10
Nodes (30): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+22 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.12
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "use-theme.ts"
Cohesion: 0.07
Nodes (40): SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+32 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.13
Nodes (22): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+14 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.12
Nodes (33): AuthenticatedHomeRoute(), fetchMock, mockSession, AuthRequestKind, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile() (+25 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.38
Nodes (11): invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite(), validateProbability() (+3 more)

### Community 14 - "useTheme"
Cohesion: 0.11
Nodes (32): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+24 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.09
Nodes (46): FIELD_VALIDATION_ASSIGNMENT_STATES, FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, contract, LifecycleContract, toSubmissionPreparationInput(), CreateFieldReportDraftInput (+38 more)

### Community 16 - "detection/types.ts"
Cohesion: 0.09
Nodes (22): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ChecklistObservation, ChecklistObservationId (+14 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.09
Nodes (32): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+24 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (33): assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, DeleteManagedImageResult, deleteManagedScanImage(), EXTENSION_TO_MIME, findOrphanedManagedImages() (+25 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.15
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (20): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+12 more)

### Community 23 - "saveCompletedScan.ts"
Cohesion: 0.11
Nodes (22): initialScanSessionState, completedResult, ScanSessionState, createCompletedScanDraft(), NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan (+14 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.14
Nodes (26): getManagedScanImageDirectory(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES (+18 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.20
Nodes (17): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+9 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.12
Nodes (19): DiseaseBadge(), DiseaseBadgeProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP (+11 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (23): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES, MobileNotificationRow (+15 more)

### Community 28 - "image-preview.test.tsx"
Cohesion: 0.08
Nodes (28): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+20 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+14 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "Radius"
Cohesion: 0.10
Nodes (23): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceClass, ReferenceTone, SectionTitle(), styles (+15 more)

### Community 34 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 35 - "notificationCacheRepository.ts"
Cohesion: 0.19
Nodes (18): listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification, MobileNotificationsState, ActiveRefresh (+10 more)

### Community 36 - "scan.tsx"
Cohesion: 0.13
Nodes (16): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), BottomNav() (+8 more)

### Community 37 - "mobileReportStatusesApi.ts"
Cohesion: 0.10
Nodes (36): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+28 more)

### Community 38 - "useFieldValidationAssignment.ts"
Cohesion: 0.12
Nodes (19): CompleteFieldValidationInput, deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput, getFieldValidationPhotoDirectory(), isManagedFieldValidationPhotoUri(), MIME_TO_EXTENSION, persistFieldValidationPhoto() (+11 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.17
Nodes (13): ReportRepository, DateRange, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), LocalReportOptions (+5 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (46): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+38 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.14
Nodes (18): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+10 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.10
Nodes (37): FieldReportScreen(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+29 more)

### Community 44 - "assignmentCacheRepository.ts"
Cohesion: 0.14
Nodes (22): fieldValidationAssignments, FieldValidationAssignmentState, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner() (+14 more)

### Community 45 - "toStorageError"
Cohesion: 0.17
Nodes (22): toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation() (+14 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.16
Nodes (11): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult, ImageQualityAssessment (+3 more)

### Community 47 - "SyncProvider.tsx"
Cohesion: 0.16
Nodes (17): syncPendingFieldValidationCompletions(), findLastSuccessfulFieldReportSyncAt(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), latestTimestamp() (+9 more)

### Community 48 - "runInference.ts"
Cohesion: 0.14
Nodes (14): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+6 more)

### Community 49 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.16
Nodes (22): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+14 more)

### Community 50 - "recordTypes.ts"
Cohesion: 0.15
Nodes (19): SyncStatus, ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, ScanRecordRepository (+11 more)

### Community 51 - "ActivityScreen.tsx"
Cohesion: 0.12
Nodes (21): AppButton(), AppButtonProps, AppButtonVariant, styles, ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle() (+13 more)

### Community 52 - "Typography"
Cohesion: 0.12
Nodes (15): styles, SymptomChecklistScreen(), CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles, styles (+7 more)

### Community 53 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 54 - "_layout.tsx"
Cohesion: 0.16
Nodes (10): AppNavigator(), styles, MobileAttentionLifecycle(), useMobileNotifications(), isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider() (+2 more)

### Community 55 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.36
Nodes (10): FIELD_VALIDATION_GPS_OUTCOMES, FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), normalizeFieldValidationText(), validateFieldValidationCompletionInput(), validateRequiredText() (+2 more)

### Community 56 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 57 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (9): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES (+1 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 61 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.05
Nodes (53): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath() (+45 more)

### Community 62 - "notificationCacheRepository.test.ts"
Cohesion: 0.29
Nodes (6): MobileNotificationsResult, createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration(), MobileNotificationUpdate

### Community 63 - "useMobileNotifications.test.tsx"
Cohesion: 0.25
Nodes (6): CACHED, database, listCache, markSessionExpired, Probe(), refreshService

### Community 64 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 65 - "reportMultipartMapper.test.ts"
Cohesion: 0.33
Nodes (4): map(), REPORT, SCAN, TestFormData

## Knowledge Gaps
- **426 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+421 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `Radius`, `field-validation.tsx`, `scan.tsx`, `StorageError`, `theme.ts`, `use-theme.ts`, `analysis-result.tsx`, `record-details.tsx`, `ActivityScreen.tsx`, `Typography`, `RecordCard.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `notificationCacheRepository.ts`, `fieldReportReviewRepository.ts`, `StorageError`, `useFieldValidationAssignment.ts`, `reportRepository.ts`, `possibleMatch.ts`, `scanRecordRepository.ts`, `record-details.tsx`, `assignmentCacheRepository.ts`, `useTheme`, `fieldReportRepository.ts`, `SyncProvider.tsx`, `fieldValidationCompletionRepository.ts`, `scanImageStorage.ts`, `_layout.tsx`, `saveCompletedScan.ts`, `fieldReportSyncRepository.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `notificationCacheRepository.ts`, `fieldReportReviewRepository.ts`, `useFieldValidationAssignment.ts`, `scanRecordRepository.ts`, `record-details.tsx`, `assignmentCacheRepository.ts`, `toStorageError`, `recordValidation.ts`, `fieldReportRepository.ts`, `fieldValidationCompletionRepository.ts`, `saveCompletedScan.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `fieldReportSyncRepository.ts`, `submissionImageStorage.test.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _426 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `field-validation.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `StorageError` be split into smaller, more focused modules?**
  _Cohesion score 0.10220673635307782 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._