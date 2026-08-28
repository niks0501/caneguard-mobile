# Graph Report - caneguard-mobile  (2026-08-28)

## Corpus Check
- 212 files · ~97,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1283 nodes · 3596 edges · 62 communities (60 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1cd9c46f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createFieldReportSyncRepository
- reportMultipartMapper.ts
- register.tsx
- fieldReportReviewRepository.ts
- global.d.ts
- errors.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- image-preview.tsx
- fieldReportTypes.ts
- preprocessImage.ts
- useAuth.ts
- recordValidation.ts
- useTheme
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- reportMultipartMapper.contract.test.ts
- saveCompletedScan.ts
- submissionImageStorage.ts
- SyncProvider.tsx
- RecordCard.tsx
- recordTypes.ts
- image-preview.test.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- scan.tsx
- online-map-picker.tsx
- home.tsx
- analysis-result.test.tsx
- syncFieldReport.ts
- Spacing
- mobileReportStatusesApi.ts
- captureGpsLocation.ts
- reportRepository.ts
- field-report.test.tsx
- analysis-result.tsx
- useCaneGuardModel.tsx
- toStorageError
- detection/types.ts
- useFieldReportDraft.test.tsx
- compareParityReference.ts
- scan.test.tsx
- runInference.ts
- CaneGuardDatabase
- assessImageQuality.ts
- ActivityScreen.tsx
- postprocessOutput.ts
- activity.test.tsx
- record-details.test.tsx
- getSubmissionImageUri
- useCaneGuardModel.web.tsx
- fieldReportValidation.test.ts
- submissionImageStorage.test.ts
- MockFile
- apiClient.ts
- syncPendingFieldReports.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 112 edges
2. `toStorageError()` - 59 edges
3. `CaneGuardDatabase` - 47 edges
4. `useAuth()` - 37 edges
5. `Typography` - 34 edges
6. `StorageError` - 32 edges
7. `Spacing` - 31 edges
8. `Radius` - 27 edges
9. `FieldReport` - 24 edges
10. `ComponentTokens` - 22 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `ReferenceCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (62 total, 2 thin omitted)

### Community 0 - "createFieldReportSyncRepository"
Cohesion: 0.53
Nodes (6): createFieldReportSyncRepository(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced(), markFieldReportSyncing(), updateSyncState()

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.16
Nodes (30): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+22 more)

### Community 2 - "register.tsx"
Cohesion: 0.32
Nodes (5): RegisterScreen(), styles, styles, TextField(), TextFieldProps

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.12
Nodes (25): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), openTestDatabase(), readMigration() (+17 more)

### Community 5 - "errors.ts"
Cohesion: 0.11
Nodes (24): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+16 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.10
Nodes (20): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles (+12 more)

### Community 8 - "image-preview.tsx"
Cohesion: 0.08
Nodes (32): MetadataRow(), styles, SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES (+24 more)

### Community 10 - "fieldReportTypes.ts"
Cohesion: 0.16
Nodes (15): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FinalizeFieldReportInput (+7 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.14
Nodes (17): DetectionError, DetectionErrorStage, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage() (+9 more)

### Community 12 - "useAuth.ts"
Cohesion: 0.08
Nodes (39): HomeScreen(), AppNavigator(), styles, fetchMock, mockSession, mockRouterPush, AuthRequestKind, CurrentUserResponse (+31 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.32
Nodes (14): getChecklistConsistency(), MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores() (+6 more)

### Community 14 - "useTheme"
Cohesion: 0.09
Nodes (39): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+31 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.24
Nodes (21): coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported(), normalizeOptionalAffectedArea() (+13 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.11
Nodes (16): ChecklistObservation, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SOMETHING_ELSE_OBSERVATION, UNABLE_TO_TELL_OBSERVATION (+8 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.17
Nodes (14): AUTO_RETRYABLE_SYNC_ERROR_CODES, getSyncErrorMessage(), isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError() (+6 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (33): assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+25 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+14 more)

### Community 23 - "saveCompletedScan.ts"
Cohesion: 0.29
Nodes (7): saveCompletedScan(), SaveCompletedScanOptions, compensateManagedImageCopy(), ManagedImage, MANAGED_IMAGE, NOW, save()

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.14
Nodes (29): toPersistenceInput(), getManagedScanImageDirectory(), readManagedImageMetadata(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource() (+21 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.20
Nodes (15): countUnsyncedFieldReports(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline() (+7 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.22
Nodes (11): DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), RecordCard(), RecordCardProps (+3 more)

### Community 27 - "recordTypes.ts"
Cohesion: 0.09
Nodes (33): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, fieldReports, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow (+25 more)

### Community 28 - "image-preview.test.tsx"
Cohesion: 0.14
Nodes (14): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+6 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "scan.tsx"
Cohesion: 0.09
Nodes (24): InputRow(), InputRowProps, LoginScreen(), styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource() (+16 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.12
Nodes (20): QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle(), styles (+12 more)

### Community 34 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 35 - "syncFieldReport.ts"
Cohesion: 0.14
Nodes (6): FieldReportSyncRepository, MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions

### Community 36 - "Spacing"
Cohesion: 0.14
Nodes (14): styles, SymptomChecklistScreen(), ProgressBar(), ProgressBarProps, styles, styles, SummaryTile(), SummaryTileProps (+6 more)

### Community 37 - "mobileReportStatusesApi.ts"
Cohesion: 0.10
Nodes (31): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses() (+23 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.12
Nodes (18): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, buildDateCondition(), buildPendingReportCondition() (+10 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.16
Nodes (15): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ScanSessionContext (+7 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.11
Nodes (18): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel (+10 more)

### Community 43 - "toStorageError"
Cohesion: 0.14
Nodes (37): FieldReportScreen(), formatClassLabel(), formatDuration(), formatSavedAt(), RecordDetailsScreen(), AuthenticatedHomeRoute(), useCaneGuardDatabase(), getStorageErrorMessage() (+29 more)

### Community 44 - "detection/types.ts"
Cohesion: 0.12
Nodes (19): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ChecklistObservationId, GUIDED_VALIDATION_QUESTIONS, ScanSessionContextValue (+11 more)

### Community 45 - "useFieldReportDraft.test.tsx"
Cohesion: 0.18
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "scan.test.tsx"
Cohesion: 0.18
Nodes (8): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, supportedImageFormats, unsupportedImageFormats

### Community 48 - "runInference.ts"
Cohesion: 0.21
Nodes (9): ImagePreviewScreen(), asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, InferenceRunner, runInference() (+1 more)

### Community 49 - "CaneGuardDatabase"
Cohesion: 0.13
Nodes (27): CaneGuardDatabase, useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics() (+19 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.50
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "ActivityScreen.tsx"
Cohesion: 0.11
Nodes (22): BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, BrandedScreenHeader(), BrandedScreenHeaderProps (+14 more)

### Community 52 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 53 - "activity.test.tsx"
Cohesion: 0.11
Nodes (13): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, REPORT, SCAN, mockLoadMore (+5 more)

### Community 54 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 55 - "getSubmissionImageUri"
Cohesion: 0.33
Nodes (4): getSubmissionImageUri(), REPORT, SCAN, TestFormData

### Community 56 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 59 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 61 - "apiClient.ts"
Cohesion: 0.16
Nodes (11): MOBILE_REPORT_STATUSES_V1_FIXTURE, request, ApiHttpError, apiRequest(), createAbortError(), DEFAULT_API_TIMEOUT_MS, normalizePath(), parseRetryAfter() (+3 more)

### Community 63 - "syncPendingFieldReports.ts"
Cohesion: 0.22
Nodes (10): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, SyncBatchResult, SyncHaltReason (+2 more)

## Knowledge Gaps
- **357 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockUsePaginatedScanRecords`, `mockRouterPush` (+352 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `home.tsx`, `register.tsx`, `Spacing`, `errors.ts`, `theme.ts`, `image-preview.tsx`, `analysis-result.tsx`, `toStorageError`, `useAuth.ts`, `runInference.ts`, `ActivityScreen.tsx`, `RecordCard.tsx`, `scan.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `StorageError` connect `errors.ts` to `fieldReportReviewRepository.ts`, `toStorageError`, `detection/types.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `CaneGuardDatabase`, `scanImageStorage.ts`, `saveCompletedScan.ts`, `submissionImageStorage.ts`, `fieldReportValidation.test.ts`, `submissionImageStorage.test.ts`, `recordTypes.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `createFieldReportSyncRepository`, `fieldReportReviewRepository.ts`, `errors.ts`, `reportRepository.ts`, `useTheme`, `CaneGuardDatabase`, `scanImageStorage.ts`, `saveCompletedScan.ts`, `SyncProvider.tsx`, `recordTypes.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _357 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `fieldReportReviewRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._
- **Should `errors.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10510510510510511 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._