# Graph Report - 01KZNRWQK5WNC1GTNSM8H7N251  (2026-08-10)

## Corpus Check
- 162 files · ~61,553 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 906 nodes · 2648 edges · 42 communities (41 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a68ef36`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- theme.ts
- useTheme
- settings.tsx
- toStorageError
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- reportMultipartMapper.ts
- BrandedScreenHeader.tsx
- recordValidation.ts
- preprocessImage.ts
- mobileAuthApi.ts
- image-preview.test.tsx
- field-report.tsx
- fieldReportRepository.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- records.test.tsx
- scanRecordRepository.ts
- captureGpsLocation.ts
- errors.ts
- MockFile
- modelContract.ts
- recordTypes.ts
- repositoryContracts.ts
- saveCompletedScan.ts
- analysis-result.tsx
- online-map-picker.tsx
- manual-map.tsx
- model-debug.test.tsx
- scan.tsx
- assessImageQuality.ts
- compareParityReference.ts
- readPickerOutcome.ts
- reportRepository.ts
- reports.tsx
- records.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `toStorageError()` - 52 edges
3. `CaneGuardDatabase` - 38 edges
4. `Typography` - 31 edges
5. `Spacing` - 28 edges
6. `StorageError` - 27 edges
7. `useAuth()` - 26 edges
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
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (42 total, 1 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.14
Nodes (18): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+10 more)

### Community 1 - "theme.ts"
Cohesion: 0.12
Nodes (17): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, CHIP_CONFIG, StatusChip(), StatusChipProps (+9 more)

### Community 2 - "useTheme"
Cohesion: 0.12
Nodes (28): MetadataRow(), styles, SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES (+20 more)

### Community 3 - "settings.tsx"
Cohesion: 0.08
Nodes (26): DiseaseCard(), DiseaseExample, DISEASES, QuickAction, QuickActionCard(), SectionTitle(), styles, SelectRow() (+18 more)

### Community 4 - "toStorageError"
Cohesion: 0.06
Nodes (79): FieldReportScreen(), RecordDetailsScreen(), CaneGuardDatabase, useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError(), useAuth(), createScanRecordRepository() (+71 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.11
Nodes (22): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), ObservationList() (+14 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (32): apiBaseUrl, parseApiBaseUrl(), FieldReportSyncRepository, FieldReportUploadRecord, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter() (+24 more)

### Community 8 - "BrandedScreenHeader.tsx"
Cohesion: 0.13
Nodes (14): HomeScreen(), InputRow(), InputRowProps, LoginScreen(), styles, SettingsScreen(), BrandedScreenHeader(), BrandedScreenHeaderProps (+6 more)

### Community 10 - "recordValidation.ts"
Cohesion: 0.29
Nodes (14): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.14
Nodes (24): AppNavigator(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError() (+16 more)

### Community 13 - "image-preview.test.tsx"
Cohesion: 0.06
Nodes (45): getObservationLabel(), createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush (+37 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.18
Nodes (14): canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence(), LocationCapture() (+6 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.08
Nodes (44): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+36 more)

### Community 16 - "runInference.ts"
Cohesion: 0.12
Nodes (15): ImagePreviewScreen(), DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode (+7 more)

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
Cohesion: 0.14
Nodes (27): assertManagedScanImageUri(), compensateManagedImageCopy(), CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+19 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.14
Nodes (15): formatNumber(), formatScore(), ModelDebugScreen(), mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController (+7 more)

### Community 22 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.15
Nodes (12): scanClassScores, scanQualityWarnings, scanSymptoms, buildConditions(), buildFieldReportJoinCondition(), isDuplicateRecordError(), mapScanRecordDetails(), mapScanRecordListItem() (+4 more)

### Community 24 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 25 - "errors.ts"
Cohesion: 0.21
Nodes (8): DatabaseContextValue, STORAGE_ERROR_CODES, StorageError, USER_MESSAGES, mockOpenDatabaseSync, deleteScanRecord(), DeleteScanRecordResult, CompensationCleanupResult

### Community 26 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 27 - "modelContract.ts"
Cohesion: 0.23
Nodes (10): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+2 more)

### Community 28 - "recordTypes.ts"
Cohesion: 0.25
Nodes (14): ChecklistConsistency, ChecklistObservationId, MATRIX, MatrixCase, ModelLabel, ClassScore, InferenceTimings, ReportedSeverity (+6 more)

### Community 29 - "repositoryContracts.ts"
Cohesion: 0.22
Nodes (7): SyncStatus, ScanRecordRepository, ScanRecordWriteRepository, SaveCompletedScanInput, ScanRecordListItem, ScanRecordQuery, PaginatedQueryState

### Community 30 - "saveCompletedScan.ts"
Cohesion: 0.16
Nodes (14): ScanSessionState, mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, saveCompletedScan() (+6 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.14
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, getChecklistConsistency() (+8 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "manual-map.tsx"
Cohesion: 0.28
Nodes (7): firstParam(), getInitialCenter(), ManualMapScreen(), styles, ScreenContainerProps, styles, Layout

### Community 34 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 35 - "scan.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 36 - "assessImageQuality.ts"
Cohesion: 0.40
Nodes (4): ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 39 - "reportRepository.ts"
Cohesion: 0.14
Nodes (14): mockRefresh, mockRouterPush, SUMMARY, fieldReports, ReportRepository, DateRange, LocalReportSummary, buildDateCondition() (+6 more)

### Community 41 - "reports.tsx"
Cohesion: 0.16
Nodes (12): ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps (+4 more)

### Community 51 - "records.tsx"
Cohesion: 0.14
Nodes (16): FilterKey, FILTERS, RecordsScreen(), StateCard(), styles, SEVERITIES, styles, SymptomChecklistScreen() (+8 more)

## Knowledge Gaps
- **251 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `manual-map.tsx`, `theme.ts`, `settings.tsx`, `toStorageError`, `record-details.tsx`, `scan.tsx`, `online-map-picker.tsx`, `BrandedScreenHeader.tsx`, `reports.tsx`, `field-report.tsx`, `runInference.ts`, `records.tsx`, `useCaneGuardModel.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `record-details.tsx`, `reportRepository.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `errors.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `StorageError` connect `errors.ts` to `DatabaseProvider.tsx`, `toStorageError`, `recordValidation.ts`, `fieldReportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.12012012012012012 - nodes in this community are weakly interconnected._