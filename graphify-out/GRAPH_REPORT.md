# Graph Report - 01KZNP9FXP3KPF3YBSCHEJGY57  (2026-08-10)

## Corpus Check
- 161 files · ~58,793 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 892 nodes · 2593 edges · 31 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fba8bd69`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- theme.ts
- model-debug.tsx
- DatabaseProvider.tsx
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- useTheme
- recordTypes.ts
- field-report.tsx
- preprocessImage.ts
- mobileAuthApi.ts
- analysis-result.test.tsx
- fieldReportRepository.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- modelContract.ts
- scanRecordRepository.ts
- detection/types.ts
- analysis-result.tsx
- online-map-picker.tsx
- toStorageError
- reportRepository.ts
- reports.tsx
- reportMultipartMapper.ts
- fieldReportSyncRepository.ts
- ComponentTokens
- records.tsx
- useRecords.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `toStorageError()` - 51 edges
3. `CaneGuardDatabase` - 37 edges
4. `Typography` - 31 edges
5. `Spacing` - 28 edges
6. `StorageError` - 27 edges
7. `Radius` - 23 edges
8. `ComponentTokens` - 21 edges
9. `useCaneGuardDatabase()` - 19 edges
10. `getStorageErrorMessage()` - 19 edges

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

## Communities (31 total, 0 thin omitted)

### Community 1 - "theme.ts"
Cohesion: 0.13
Nodes (17): RegisterScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, styles (+9 more)

### Community 2 - "model-debug.tsx"
Cohesion: 0.10
Nodes (27): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+19 more)

### Community 4 - "DatabaseProvider.tsx"
Cohesion: 0.12
Nodes (22): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+14 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.08
Nodes (26): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+18 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "useTheme"
Cohesion: 0.11
Nodes (29): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+21 more)

### Community 8 - "recordTypes.ts"
Cohesion: 0.05
Nodes (58): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES (+50 more)

### Community 10 - "field-report.tsx"
Cohesion: 0.13
Nodes (22): canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence(), LocationCapture() (+14 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.09
Nodes (27): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity() (+19 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.11
Nodes (29): AppNavigator(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError() (+21 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.07
Nodes (53): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+45 more)

### Community 16 - "runInference.ts"
Cohesion: 0.14
Nodes (13): ImagePreviewScreen(), asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores(), PostprocessedOutput (+5 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 19 - "migrations.test.ts"
Cohesion: 0.22
Nodes (4): migration0, migration1, migration2, migration3

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (30): useStorageDiagnostics(), assertManagedScanImageUri(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+22 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.12
Nodes (17): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe() (+9 more)

### Community 27 - "modelContract.ts"
Cohesion: 0.23
Nodes (10): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+2 more)

### Community 29 - "scanRecordRepository.ts"
Cohesion: 0.14
Nodes (18): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, ScanRecordWriteRepository, buildConditions(), createScanRecordRepository() (+10 more)

### Community 30 - "detection/types.ts"
Cohesion: 0.08
Nodes (35): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+27 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (24): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+16 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 37 - "toStorageError"
Cohesion: 0.14
Nodes (18): toStorageError(), insertScanRecord(), mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus (+10 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.17
Nodes (15): mockRefresh, mockRouterPush, SUMMARY, fieldReports, ReportRepository, DateRange, LocalReportSummary, buildDateCondition() (+7 more)

### Community 41 - "reports.tsx"
Cohesion: 0.16
Nodes (13): ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps (+5 more)

### Community 42 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (32): apiBaseUrl, parseApiBaseUrl(), FieldReportSyncRepository, FieldReportUploadRecord, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter() (+24 more)

### Community 44 - "fieldReportSyncRepository.ts"
Cohesion: 0.13
Nodes (33): CaneGuardDatabase, findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed() (+25 more)

### Community 47 - "ComponentTokens"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 51 - "records.tsx"
Cohesion: 0.12
Nodes (20): FieldReportScreen(), SplashScreen(), styles, firstParam(), getInitialCenter(), ManualMapScreen(), styles, FilterKey (+12 more)

### Community 54 - "useRecords.ts"
Cohesion: 0.19
Nodes (15): useCaneGuardDatabase(), getStorageErrorMessage(), listScanRecords(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords(), useScanRecordDetails() (+7 more)

## Knowledge Gaps
- **244 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `theme.ts`, `model-debug.tsx`, `DatabaseProvider.tsx`, `record-details.tsx`, `reports.tsx`, `field-report.tsx`, `ComponentTokens`, `runInference.ts`, `records.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `record-details.tsx`, `reportRepository.ts`, `field-report.tsx`, `fieldReportSyncRepository.ts`, `fieldReportRepository.ts`, `records.tsx`, `scanImageStorage.ts`, `useRecords.ts`, `scanRecordRepository.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `StorageError` connect `DatabaseProvider.tsx` to `toStorageError`, `recordTypes.ts`, `fieldReportSyncRepository.ts`, `fieldReportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `detection/types.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `model-debug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09915966386554621 - nodes in this community are weakly interconnected._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11586452762923351 - nodes in this community are weakly interconnected._