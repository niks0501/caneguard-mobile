# Graph Report - caneguard-mobile  (2026-08-10)

## Corpus Check
- 155 files · ~52,281 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 834 nodes · 1995 edges · 35 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4059e9ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- use-theme.ts
- useTheme
- model-debug.tsx
- symptom-checklist.tsx
- scanRecordWriteRepository.test.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- records.tsx
- schema.ts
- field-report.tsx
- preprocessImage.ts
- AuthProvider.tsx
- recordValidation.ts
- analysis-result.test.tsx
- fieldReportRepository.ts
- inferenceErrors.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- theme.ts
- migrations.test.ts
- scanImageStorage.ts
- runInference.ts
- storage-debug.tsx
- syncScanRecord.ts
- reports.tsx
- modelContract.ts
- useCaneGuardModel.tsx
- postprocessOutput.ts
- image-preview.test.tsx
- analysis-result.tsx
- reportRepository.ts
- scanRecordRepository.ts
- recordTypes.ts
- repositoryContracts.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 48 edges
2. `toStorageError()` - 24 edges
3. `Typography` - 23 edges
4. `Spacing` - 20 edges
5. `StorageError` - 18 edges
6. `Radius` - 18 edges
7. `ScanRecordDetails` - 17 edges
8. `ComponentTokens` - 17 edges
9. `validateCompletedScanDraft()` - 13 edges
10. `ScanSessionState` - 13 edges

## Surprising Connections (you probably didn't know these)
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `DebugRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-debug.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-smoke-test.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts
- `ProgressBar()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/ui/ProgressBar.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (35 total, 0 thin omitted)

### Community 0 - "use-theme.ts"
Cohesion: 0.14
Nodes (15): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+7 more)

### Community 1 - "useTheme"
Cohesion: 0.11
Nodes (17): ThemedText(), ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles, DiseasePill(), DiseasePillProps (+9 more)

### Community 2 - "model-debug.tsx"
Cohesion: 0.11
Nodes (21): styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen() (+13 more)

### Community 3 - "symptom-checklist.tsx"
Cohesion: 0.21
Nodes (10): SEVERITIES, styles, styles, SummaryTile(), SummaryTileProps, styles, SymptomChecklistItem(), SymptomChecklistItemProps (+2 more)

### Community 4 - "scanRecordWriteRepository.test.ts"
Cohesion: 0.05
Nodes (70): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, CaneGuardDatabase, CaneGuardDatabaseResources (+62 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.07
Nodes (28): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), styles, DETAILS (+20 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "records.tsx"
Cohesion: 0.12
Nodes (13): FilterKey, FILTERS, styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab (+5 more)

### Community 8 - "schema.ts"
Cohesion: 0.11
Nodes (18): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+10 more)

### Community 10 - "field-report.tsx"
Cohesion: 0.13
Nodes (17): DraftFields(), formatTimestamp(), getGpsPresentation(), LocationCapture(), styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS (+9 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.09
Nodes (28): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, createInputTensor(), InputTensor (+20 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.08
Nodes (32): SelectRowProps, SettingsScreen(), styles, ToggleRowProps, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile() (+24 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.25
Nodes (17): insertScanRecord(), isDuplicateRecordError(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores() (+9 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.13
Nodes (17): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+9 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.08
Nodes (41): FieldReportScreen(), mockCaptureLocation, mockRefresh, mockSave, mockScan, mockUseLocalSearchParams, FieldReportAuthoringState, FieldReportLocationSource (+33 more)

### Community 16 - "inferenceErrors.ts"
Cohesion: 0.18
Nodes (10): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+2 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "theme.ts"
Cohesion: 0.11
Nodes (13): DiseaseExample, DISEASES, QuickAction, styles, InputRowProps, styles, styles, ThemedTextProps (+5 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.20
Nodes (5): migration0, migration1, migration2, migration3, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "runInference.ts"
Cohesion: 0.21
Nodes (7): mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, InferenceRunner, runInference(), DetectionResult

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

### Community 23 - "syncScanRecord.ts"
Cohesion: 0.06
Nodes (28): apiBaseUrl, parseApiBaseUrl(), ScanRecordSyncRepository, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody() (+20 more)

### Community 25 - "reports.tsx"
Cohesion: 0.18
Nodes (7): ClassCount(), getClassPresentation(), styles, mockRefresh, mockRouterPush, SUMMARY, RecordsByLabel

### Community 26 - "modelContract.ts"
Cohesion: 0.22
Nodes (12): mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 27 - "useCaneGuardModel.tsx"
Cohesion: 0.18
Nodes (9): mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider(), CPU_DELEGATES, MODEL_ASSET (+1 more)

### Community 28 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 30 - "image-preview.test.tsx"
Cohesion: 0.05
Nodes (44): ImagePreviewScreen(), SymptomChecklistScreen(), mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference (+36 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.20
Nodes (9): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken (+1 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.24
Nodes (10): fieldReports, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), LocalReportOptions, PROTOTYPE_LOW_SCORE_THRESHOLD (+2 more)

### Community 40 - "scanRecordRepository.ts"
Cohesion: 0.29
Nodes (8): buildConditions(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), mockDatabase, mockListScanRecords

### Community 45 - "recordTypes.ts"
Cohesion: 0.32
Nodes (10): ClassScore, ReportedSeverity, ScanSourceType, mapScanRecordDetails(), mapScanRecordListItem(), CompletedScanDraft, ScanRecordDetails, ScanRecordListItem (+2 more)

### Community 46 - "repositoryContracts.ts"
Cohesion: 0.20
Nodes (7): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, ScanRecordQuery

## Knowledge Gaps
- **251 isolated node(s):** `mockSave`, `mockCaptureLocation`, `mockRefresh`, `mockScan`, `mockUseLocalSearchParams` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `use-theme.ts`, `model-debug.tsx`, `symptom-checklist.tsx`, `record-details.tsx`, `records.tsx`, `field-report.tsx`, `theme.ts`, `analysis-result.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `scanRecordWriteRepository.test.ts` to `record-details.tsx`, `reportRepository.ts`, `schema.ts`, `recordValidation.ts`, `fieldReportRepository.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `AuthProvider.tsx` to `field-report.tsx`, `theme.ts`, `scanRecordWriteRepository.test.ts`, `fieldReportRepository.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `mockSave`, `mockCaptureLocation`, `mockRefresh` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `use-theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Should `model-debug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10591133004926108 - nodes in this community are weakly interconnected._