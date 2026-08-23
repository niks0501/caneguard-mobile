# Graph Report - caneguard-mobile  (2026-08-23)

## Corpus Check
- 200 files · ~87,728 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1139 nodes · 3242 edges · 52 communities (50 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f9de8e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- useTheme
- RecordCard.tsx
- global.d.ts
- useAuth
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- ComponentTokens
- apiClient.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- field-report.tsx
- fieldReportValidation.ts
- image-preview.tsx
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncPendingFieldReports.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- fieldReportSyncRepository.ts
- record-details.tsx
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- use-theme.ts
- online-map-picker.tsx
- home.tsx
- detection/types.ts
- syncFieldReport.ts
- analysis-result.tsx
- CaneGuardDatabase
- captureGpsLocation.ts
- recordTypes.ts
- analysis-result.test.tsx
- scan.test.tsx
- useCaneGuardModel.tsx
- Typography
- image-preview.test.tsx
- syncErrors.ts
- compareParityReference.ts
- records.test.tsx
- postprocessOutput.ts
- mobileReportStatusesApi.test.ts
- assessImageQuality.ts
- records.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 57 edges
3. `CaneGuardDatabase` - 45 edges
4. `Typography` - 35 edges
5. `Spacing` - 32 edges
6. `useAuth()` - 32 edges
7. `StorageError` - 29 edges
8. `Radius` - 28 edges
9. `ComponentTokens` - 23 edges
10. `FieldReport` - 23 edges

## Surprising Connections (you probably didn't know these)
- `renderPreview()` --calls--> `scanSessionReducer()`  [EXTRACTED]
  src/app/__tests__/image-preview.test.tsx → src/features/detection/context/scanSessionReducer.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `ReporterMismatchSection()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (52 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.10
Nodes (27): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+19 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.21
Nodes (13): appendMismatchReported(), appendNumber(), appendOptionalText(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateMismatchFields() (+5 more)

### Community 2 - "useTheme"
Cohesion: 0.12
Nodes (24): ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles, DisabledRow(), DisabledRowProps (+16 more)

### Community 3 - "RecordCard.tsx"
Cohesion: 0.19
Nodes (12): InheritedScanEvidence(), DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), getResultLabel() (+4 more)

### Community 5 - "useAuth"
Cohesion: 0.12
Nodes (27): FieldReportScreen(), RecordsScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), mockDatabase, mockListScanRecords, QueryState (+19 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (16): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+8 more)

### Community 8 - "ComponentTokens"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 10 - "apiClient.ts"
Cohesion: 0.21
Nodes (11): apiBaseUrl, parseApiBaseUrl(), ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+3 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingStage() (+6 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (29): AppNavigator(), styles, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+21 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.40
Nodes (12): createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite() (+4 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.14
Nodes (18): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizeFieldReportFormValues, formatTimestamp() (+10 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.05
Nodes (62): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+54 more)

### Community 16 - "image-preview.tsx"
Cohesion: 0.20
Nodes (11): ImagePreviewScreen(), MetadataRow(), styles, getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, asInferenceError(), getInferenceErrorMessage() (+3 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncPendingFieldReports.ts"
Cohesion: 0.14
Nodes (16): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch() (+8 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.17
Nodes (7): migration0, migration1, migration2, migration3, migration4, migration5, migration6

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage() (+24 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.14
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "toStorageError"
Cohesion: 0.14
Nodes (27): toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture() (+19 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.12
Nodes (28): fieldReports, scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition() (+20 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.15
Nodes (24): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+16 more)

### Community 26 - "record-details.tsx"
Cohesion: 0.13
Nodes (20): FinalizedReportSummary(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+12 more)

### Community 27 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.14
Nodes (9): DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode, CaneGuardModelContext, CaneGuardModelController, ModelRun (+1 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "use-theme.ts"
Cohesion: 0.08
Nodes (30): SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, DevelopmentModelSmokeTestScreen() (+22 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 34 - "detection/types.ts"
Cohesion: 0.10
Nodes (21): SymptomChecklistScreen(), completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, initialScanSessionState (+13 more)

### Community 35 - "syncFieldReport.ts"
Cohesion: 0.13
Nodes (4): FieldReportSyncRepository, RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 36 - "analysis-result.tsx"
Cohesion: 0.18
Nodes (14): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ChecklistObservationId (+6 more)

### Community 37 - "CaneGuardDatabase"
Cohesion: 0.17
Nodes (18): CaneGuardDatabase, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), openTestDatabase() (+10 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "recordTypes.ts"
Cohesion: 0.11
Nodes (25): mockRefresh, mockRouterPush, SUMMARY, SyncStatus, ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity (+17 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "scan.test.tsx"
Cohesion: 0.14
Nodes (15): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), supportedImageFormats (+7 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.10
Nodes (21): formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel (+13 more)

### Community 43 - "Typography"
Cohesion: 0.16
Nodes (13): SEVERITIES, styles, styles, SummaryTileProps, styles, SymptomChecklistItem(), SymptomChecklistItemProps, Spacing (+5 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (11): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+3 more)

### Community 45 - "syncErrors.ts"
Cohesion: 0.33
Nodes (7): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError()

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.40
Nodes (4): ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "records.tsx"
Cohesion: 0.10
Nodes (22): FilterKey, FILTERS, StateCard(), styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource() (+14 more)

## Knowledge Gaps
- **320 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `detection/types.ts`, `RecordCard.tsx`, `analysis-result.tsx`, `useAuth`, `online-map-picker.tsx`, `theme.ts`, `ComponentTokens`, `useCaneGuardModel.tsx`, `Typography`, `field-report.tsx`, `image-preview.tsx`, `records.tsx`, `record-details.tsx`, `use-theme.ts`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `home.tsx`, `useTheme`, `theme.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `fieldReportValidation.ts`, `toStorageError`, `fieldReportSyncRepository.ts`, `record-details.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useAuth`, `CaneGuardDatabase`, `field-report.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `fieldReportSyncRepository.ts`, `record-details.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0951219512195122 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.11861861861861862 - nodes in this community are weakly interconnected._