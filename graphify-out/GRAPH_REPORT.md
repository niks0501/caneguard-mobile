# Graph Report - caneguard-mobile  (2026-08-28)

## Corpus Check
- 207 files · ~97,709 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1273 nodes · 3612 edges · 60 communities (57 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `811b2bd5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CaneGuardDatabase
- reportMultipartMapper.ts
- Typography
- fieldReportReviewRepository.ts
- global.d.ts
- postprocessOutput.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- image-preview.tsx
- mobileReportStatusesApi.ts
- preprocessImage.ts
- AuthProvider.tsx
- recordValidation.ts
- useTheme
- fieldReportValidation.ts
- fieldReportTypes.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- errors.ts
- submissionImageStorage.ts
- reportReviewTypes.ts
- RecordCard.tsx
- schema.ts
- runInference.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- scan.tsx
- online-map-picker.tsx
- home.tsx
- model-debug.tsx
- FieldReportSyncRepository
- analysis-result.tsx
- record-details.tsx
- captureGpsLocation.ts
- field-report.test.tsx
- analysis-result.test.tsx
- syncFieldReport.ts
- useCaneGuardModel.tsx
- useFieldReportDraft.test.tsx
- image-preview.test.tsx
- settings.tsx
- compareParityReference.ts
- register.tsx
- useCaneGuardModel.web.tsx
- saveCompletedScan.ts
- assessImageQuality.ts
- reports.tsx
- checklistConsistency.ts
- submissionImageStorage.test.ts
- MockFile
- apiClient.ts
- SyncProvider.tsx
- mobileReportStatusesApi.test.ts
- recordTypes.ts
- env.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 59 edges
3. `CaneGuardDatabase` - 47 edges
4. `useAuth()` - 37 edges
5. `Typography` - 35 edges
6. `Spacing` - 32 edges
7. `StorageError` - 32 edges
8. `Radius` - 28 edges
9. `FieldReport` - 24 edges
10. `ComponentTokens` - 23 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedHomeRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/__tests__/auth-bootstrap.test.tsx → src/features/auth/hooks/useAuth.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (60 total, 3 thin omitted)

### Community 0 - "CaneGuardDatabase"
Cohesion: 0.22
Nodes (18): CaneGuardDatabase, findScanRecordById(), findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt() (+10 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (56): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+48 more)

### Community 2 - "Typography"
Cohesion: 0.13
Nodes (12): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+4 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.12
Nodes (20): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), openTestDatabase(), readMigration() (+12 more)

### Community 5 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "image-preview.tsx"
Cohesion: 0.11
Nodes (22): MetadataRow(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles (+14 more)

### Community 10 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (15): ImagePreviewScreen(), createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError() (+7 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.07
Nodes (41): HomeScreen(), AppNavigator(), styles, AuthenticatedHomeRoute(), fetchMock, mockSession, mockRouterPush, AuthRequestKind (+33 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.28
Nodes (13): createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite() (+5 more)

### Community 14 - "useTheme"
Cohesion: 0.12
Nodes (30): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+22 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.24
Nodes (21): coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported(), normalizeOptionalAffectedArea() (+13 more)

### Community 16 - "fieldReportTypes.ts"
Cohesion: 0.17
Nodes (13): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport (+5 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.33
Nodes (7): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError()

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (33): assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME, findOrphanedManagedImages() (+25 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.19
Nodes (12): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.25
Nodes (21): toStorageError(), persistSubmissionImageMetadata(), deleteManagedScanImage(), getSubmissionImageUri(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), FinalizeFieldReportDependencies (+13 more)

### Community 23 - "errors.ts"
Cohesion: 0.10
Nodes (27): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+19 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.15
Nodes (27): toPersistenceInput(), getManagedScanImageDirectory(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS (+19 more)

### Community 25 - "reportReviewTypes.ts"
Cohesion: 0.15
Nodes (14): FieldReportRow, ScanClassScoreRow, ScanQualityWarningRow, ScanRecordRow, ScanSymptomRow, StoredClassScore, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES (+6 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.22
Nodes (11): DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), RecordCard(), RecordCardProps (+3 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (33): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, fieldReports, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+25 more)

### Community 28 - "runInference.ts"
Cohesion: 0.18
Nodes (10): MODEL_INPUT, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode (+2 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "scan.tsx"
Cohesion: 0.17
Nodes (13): SplashScreen(), styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles (+5 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.12
Nodes (20): QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle(), styles (+12 more)

### Community 34 - "model-debug.tsx"
Cohesion: 0.15
Nodes (14): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+6 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.13
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, getChecklistConsistency() (+8 more)

### Community 37 - "record-details.tsx"
Cohesion: 0.05
Nodes (59): FieldReportScreen(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+51 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "syncFieldReport.ts"
Cohesion: 0.21
Nodes (7): ApiHttpError, MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe() (+8 more)

### Community 43 - "useFieldReportDraft.test.tsx"
Cohesion: 0.18
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.07
Nodes (36): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+28 more)

### Community 45 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "register.tsx"
Cohesion: 0.32
Nodes (5): RegisterScreen(), styles, styles, TextField(), TextFieldProps

### Community 48 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 49 - "saveCompletedScan.ts"
Cohesion: 0.20
Nodes (11): createScanRecordRepository(), listManagedImageUris(), insertScanRecord(), isDuplicateRecordError(), saveCompletedScan(), SaveCompletedScanOptions, compensateManagedImageCopy(), ManagedImage (+3 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.28
Nodes (5): assessImageQuality(), ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "reports.tsx"
Cohesion: 0.09
Nodes (30): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel() (+22 more)

### Community 52 - "checklistConsistency.ts"
Cohesion: 0.15
Nodes (12): ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SOMETHING_ELSE_OBSERVATION (+4 more)

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 59 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 61 - "apiClient.ts"
Cohesion: 0.36
Nodes (8): apiRequest(), createAbortError(), DEFAULT_API_TIMEOUT_MS, normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage(), fetchMock

### Community 63 - "SyncProvider.tsx"
Cohesion: 0.10
Nodes (27): SYNC_RETRY_COOLDOWN_MS, ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), SyncContext, SyncContextValue (+19 more)

### Community 65 - "recordTypes.ts"
Cohesion: 0.14
Nodes (20): SyncStatus, ChecklistConsistency, ModelLabel, ClassScore, InferenceTimings, ReportedSeverity, ScanSessionStatus, ScanSourceType (+12 more)

### Community 66 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

## Knowledge Gaps
- **351 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `home.tsx`, `model-debug.tsx`, `Typography`, `analysis-result.tsx`, `record-details.tsx`, `theme.ts`, `image-preview.tsx`, `preprocessImage.ts`, `AuthProvider.tsx`, `settings.tsx`, `register.tsx`, `reports.tsx`, `errors.ts`, `RecordCard.tsx`, `scan.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `record-details.tsx` to `home.tsx`, `theme.ts`, `useFieldReportDraft.test.tsx`, `AuthProvider.tsx`, `settings.tsx`, `useTheme`, `toStorageError`, `SyncProvider.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `CaneGuardDatabase`, `fieldReportReviewRepository.ts`, `record-details.tsx`, `useTheme`, `saveCompletedScan.ts`, `scanImageStorage.ts`, `errors.ts`, `schema.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06885245901639345 - nodes in this community are weakly interconnected._
- **Should `Typography` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `fieldReportReviewRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._