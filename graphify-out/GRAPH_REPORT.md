# Graph Report - 01KZNRWQK5WNC1GTNSM8H7N251  (2026-08-10)

## Corpus Check
- 163 files · ~62,436 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 913 nodes · 2662 edges · 51 communities (50 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc0dbb6e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- theme.ts
- model-debug.tsx
- useTheme
- toStorageError
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- apiClient.ts
- image-preview.tsx
- recordValidation.ts
- preprocessImage.ts
- mobileAuthApi.ts
- symptom-checklist.test.tsx
- field-report.tsx
- fieldReportTypes.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- records.test.tsx
- scanRecordRepository.ts
- captureGpsLocation.ts
- fieldReportSyncRepository.ts
- syncFieldReport.ts
- modelContract.ts
- recordTypes.ts
- repositoryContracts.ts
- saveCompletedScan.ts
- analysis-result.tsx
- online-map-picker.tsx
- manual-map.tsx
- model-debug.test.tsx
- useRecords.ts
- assessImageQuality.ts
- compareParityReference.ts
- detection/types.ts
- reportRepository.ts
- Typography
- reports.tsx
- reportMultipartMapper.ts
- analysis-result.test.tsx
- image-preview.test.tsx
- scan.test.tsx
- sessionErrors.ts
- FieldReportSyncRepository
- postprocessOutput.ts
- syncPendingFieldReports.ts
- diseaseCatalog.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `toStorageError()` - 52 edges
3. `CaneGuardDatabase` - 38 edges
4. `Typography` - 31 edges
5. `Spacing` - 28 edges
6. `StorageError` - 27 edges
7. `useAuth()` - 27 edges
8. `Radius` - 23 edges
9. `ComponentTokens` - 21 edges
10. `FieldReport` - 20 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (51 total, 1 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.11
Nodes (22): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+14 more)

### Community 1 - "theme.ts"
Cohesion: 0.15
Nodes (14): InputRow(), InputRowProps, styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps (+6 more)

### Community 2 - "model-debug.tsx"
Cohesion: 0.11
Nodes (20): SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+12 more)

### Community 3 - "useTheme"
Cohesion: 0.10
Nodes (30): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+22 more)

### Community 4 - "toStorageError"
Cohesion: 0.17
Nodes (25): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+17 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.11
Nodes (27): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+19 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "apiClient.ts"
Cohesion: 0.21
Nodes (11): apiBaseUrl, parseApiBaseUrl(), ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+3 more)

### Community 8 - "image-preview.tsx"
Cohesion: 0.13
Nodes (16): MetadataRow(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles (+8 more)

### Community 10 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.11
Nodes (28): AppNavigator(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError() (+20 more)

### Community 13 - "symptom-checklist.test.tsx"
Cohesion: 0.18
Nodes (10): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext, ScanSessionContextValue, ScanSessionProvider() (+2 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.27
Nodes (10): canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence(), LocationCapture() (+2 more)

### Community 15 - "fieldReportTypes.ts"
Cohesion: 0.07
Nodes (43): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+35 more)

### Community 16 - "runInference.ts"
Cohesion: 0.21
Nodes (9): ImagePreviewScreen(), asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, InferenceRunner, runInference() (+1 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.22
Nodes (4): migration0, migration1, migration2, migration3

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (33): PickerOutcome, readPickerOutcome(), ScanSourceType, assertManagedScanImageUri(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult (+25 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (13): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController (+5 more)

### Community 22 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.12
Nodes (25): useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), buildConditions() (+17 more)

### Community 24 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.25
Nodes (17): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced(), markFieldReportSyncing() (+9 more)

### Community 26 - "syncFieldReport.ts"
Cohesion: 0.14
Nodes (13): isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS, syncFieldReport(), SyncFieldReportOptions (+5 more)

### Community 27 - "modelContract.ts"
Cohesion: 0.29
Nodes (9): MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION, ModelMetadata, tensorMatches(), TensorMetadata (+1 more)

### Community 28 - "recordTypes.ts"
Cohesion: 0.25
Nodes (13): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity (+5 more)

### Community 29 - "repositoryContracts.ts"
Cohesion: 0.12
Nodes (13): mockRefresh, mockRouterPush, SUMMARY, SyncStatus, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, LocalReportSummary (+5 more)

### Community 30 - "saveCompletedScan.ts"
Cohesion: 0.18
Nodes (12): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+4 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (26): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+18 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "manual-map.tsx"
Cohesion: 0.31
Nodes (8): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), useSync()

### Community 34 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 35 - "useRecords.ts"
Cohesion: 0.25
Nodes (14): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+6 more)

### Community 36 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 38 - "detection/types.ts"
Cohesion: 0.22
Nodes (9): initialScanSessionState, completedResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW, MANAGED_IMAGE (+1 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.18
Nodes (13): fieldReports, DateRange, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), LocalReportOptions (+5 more)

### Community 40 - "Typography"
Cohesion: 0.15
Nodes (12): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+4 more)

### Community 41 - "reports.tsx"
Cohesion: 0.17
Nodes (13): ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps (+5 more)

### Community 42 - "reportMultipartMapper.ts"
Cohesion: 0.21
Nodes (11): FieldReportUploadRecord, appendNumber(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateReport(), map() (+3 more)

### Community 43 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 45 - "scan.test.tsx"
Cohesion: 0.20
Nodes (9): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+1 more)

### Community 46 - "sessionErrors.ts"
Cohesion: 0.29
Nodes (5): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 49 - "syncPendingFieldReports.ts"
Cohesion: 0.32
Nodes (7): SyncContextValue, SyncResult, activeRuns, DatabaseRunState, SyncBatchResult, SyncPendingFieldReportsOptions, SyncTriggerSource

### Community 50 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

## Knowledge Gaps
- **256 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `theme.ts`, `model-debug.tsx`, `useRecords.ts`, `manual-map.tsx`, `record-details.tsx`, `online-map-picker.tsx`, `image-preview.tsx`, `reports.tsx`, `Typography`, `field-report.tsx`, `runInference.ts`, `analysis-result.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useRecords.ts`, `record-details.tsx`, `reportRepository.ts`, `field-report.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `fieldReportSyncRepository.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `StorageError` connect `DatabaseProvider.tsx` to `toStorageError`, `detection/types.ts`, `recordValidation.ts`, `fieldReportTypes.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `fieldReportSyncRepository.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1140819964349376 - nodes in this community are weakly interconnected._
- **Should `model-debug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11333333333333333 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._