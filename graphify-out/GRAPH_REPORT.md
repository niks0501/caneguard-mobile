# Graph Report - caneguard-mobile  (2026-08-10)

## Corpus Check
- 145 files · ~46,482 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 758 nodes · 1725 edges · 50 communities (49 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `495d634f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- theme.ts
- image-preview.tsx
- symptom-checklist.tsx
- scanRecordSyncRepository.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- home.tsx
- recordValidation.ts
- scan.tsx
- preprocessImage.ts
- AuthProvider.tsx
- DatabaseProvider.tsx
- analysis-result.test.tsx
- schema.ts
- Typography
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- login.tsx
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- storage-debug.tsx
- ScanRecordSyncRepository
- reports.tsx
- useCaneGuardModel.tsx
- runInference.ts
- inferenceErrors.ts
- useRecords.ts
- detection/types.ts
- analysis-result.tsx
- postprocessOutput.ts
- image-preview.test.tsx
- scan.test.tsx
- syncScanRecord.ts
- symptom-checklist.test.tsx
- checklistConsistency.ts
- ScanSessionProvider.tsx
- reportRepository.ts
- scanRecordRepository.ts
- reportMultipartMapper.ts
- apiClient.ts
- SyncProvider.tsx
- scanRecordWriteRepository.ts
- recordTypes.ts
- repositoryContracts.ts
- RecordCard.tsx
- validateModelContract.ts
- readPickerOutcome.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 46 edges
2. `toStorageError()` - 21 edges
3. `Typography` - 21 edges
4. `Spacing` - 18 edges
5. `Radius` - 16 edges
6. `StorageError` - 15 edges
7. `ScanRecordDetails` - 15 edges
8. `ComponentTokens` - 15 edges
9. `ScanSessionState` - 13 edges
10. `ScanRecordSyncRepository` - 13 edges

## Surprising Connections (you probably didn't know these)
- `useSaveCompletedScan()` --indirect_call--> `save()`  [INFERRED]
  src/features/records/hooks/useSaveCompletedScan.ts → src/features/records/services/__tests__/saveCompletedScan.test.ts
- `SaveCompletedScanOptions` --references--> `insertScanRecord()`  [EXTRACTED]
  src/features/records/services/saveCompletedScan.ts → src/features/records/data/scanRecordWriteRepository.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-smoke-test.tsx → src/hooks/use-theme.ts
- `ThemedText()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/themed-text.tsx → src/hooks/use-theme.ts
- `ThemedView()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/themed-view.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (50 total, 1 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.14
Nodes (18): SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, RegisterScreen() (+10 more)

### Community 1 - "theme.ts"
Cohesion: 0.15
Nodes (14): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+6 more)

### Community 2 - "image-preview.tsx"
Cohesion: 0.15
Nodes (12): styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, AppCard(), AppCardProps, styles, ScreenHeader() (+4 more)

### Community 3 - "symptom-checklist.tsx"
Cohesion: 0.15
Nodes (13): SEVERITIES, styles, ProgressBar(), ProgressBarProps, styles, styles, SummaryTile(), SummaryTileProps (+5 more)

### Community 4 - "scanRecordSyncRepository.ts"
Cohesion: 0.32
Nodes (12): toStorageError(), countUnsyncedRecords(), createScanRecordSyncRepository(), findLastSuccessfulSyncAt(), findSyncCandidates(), markFailed(), markPending(), markSynced() (+4 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.12
Nodes (15): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), styles, DETAILS (+7 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "home.tsx"
Cohesion: 0.12
Nodes (11): DiseaseExample, DISEASES, QuickAction, styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem (+3 more)

### Community 8 - "recordValidation.ts"
Cohesion: 0.28
Nodes (15): createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite() (+7 more)

### Community 10 - "scan.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 11 - "preprocessImage.ts"
Cohesion: 0.09
Nodes (28): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, createInputTensor(), InputTensor (+20 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.10
Nodes (30): AppNavigator(), SelectRowProps, SettingsScreen(), styles, ToggleRowProps, CurrentUserResponse, isAbortError(), isMobileUser() (+22 more)

### Community 13 - "DatabaseProvider.tsx"
Cohesion: 0.08
Nodes (34): formatDate(), styles, SyncStatusPanel(), CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources() (+26 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "schema.ts"
Cohesion: 0.13
Nodes (14): NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow, NewScanSymptomRow, ScanClassScoreRow, scanClassScores, ScanQualityWarningRow, scanQualityWarnings (+6 more)

### Community 16 - "Typography"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "login.tsx"
Cohesion: 0.13
Nodes (10): InputRowProps, styles, BrandedScreenHeader(), BrandedScreenHeaderProps, styles, Shadows, ThemePreferenceContext, ThemePreferenceContextValue (+2 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.29
Nodes (3): migration0, migration1, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.29
Nodes (8): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

### Community 23 - "ScanRecordSyncRepository"
Cohesion: 0.13
Nodes (3): ScanRecordSyncRepository, ApiHttpError, RECORD

### Community 25 - "reports.tsx"
Cohesion: 0.18
Nodes (7): ClassCount(), getClassPresentation(), styles, mockRefresh, mockRouterPush, SUMMARY, RecordsByLabel

### Community 26 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (15): formatNumber(), formatScore(), ModelDebugScreen(), mockRun, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe() (+7 more)

### Community 27 - "runInference.ts"
Cohesion: 0.20
Nodes (8): mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, MODEL_INPUT, InferenceRunner, runInference(), DetectionResult

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.18
Nodes (10): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+2 more)

### Community 29 - "useRecords.ts"
Cohesion: 0.15
Nodes (14): FilterKey, FILTERS, RecordsScreen(), styles, mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush (+6 more)

### Community 30 - "detection/types.ts"
Cohesion: 0.20
Nodes (10): initialScanSessionState, completedResult, InferenceTimings, ScanSessionAction, ScanSessionState, ScanSessionStatus, NOW, MANAGED_IMAGE (+2 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (8): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, styles, TextField(), TextFieldProps

### Community 32 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 33 - "image-preview.test.tsx"
Cohesion: 0.15
Nodes (11): ImagePreviewScreen(), mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel (+3 more)

### Community 34 - "scan.test.tsx"
Cohesion: 0.22
Nodes (6): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush

### Community 35 - "syncScanRecord.ts"
Cohesion: 0.12
Nodes (17): MobileReportResponse, uploadMobileReport(), getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError() (+9 more)

### Community 36 - "symptom-checklist.test.tsx"
Cohesion: 0.25
Nodes (6): SymptomChecklistScreen(), completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace

### Community 37 - "checklistConsistency.ts"
Cohesion: 0.33
Nodes (7): CHECKLIST_OBSERVATIONS, ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel

### Community 38 - "ScanSessionProvider.tsx"
Cohesion: 0.39
Nodes (6): ScanSessionContext, ScanSessionContextValue, ScanSessionProvider(), scanSessionReducer(), SessionProbe(), useScanSession()

### Community 39 - "reportRepository.ts"
Cohesion: 0.26
Nodes (9): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), createReportRepository(), getLocalReportSummary(), LocalReportOptions, LocalReportState (+1 more)

### Community 40 - "scanRecordRepository.ts"
Cohesion: 0.29
Nodes (8): buildConditions(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), mockDatabase, mockListScanRecords

### Community 41 - "reportMultipartMapper.ts"
Cohesion: 0.27
Nodes (8): appendNumber(), invalid(), isProbability(), mapReportToMultipart(), MultipartMapperDependencies, validateRecord(), RECORD, TestFormData

### Community 42 - "apiClient.ts"
Cohesion: 0.33
Nodes (7): apiBaseUrl, parseApiBaseUrl(), apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage()

### Community 43 - "SyncProvider.tsx"
Cohesion: 0.29
Nodes (11): resetStaleSyncingRecords(), isNetworkOnline(), SyncContextValue, SyncProvider(), OFFLINE, ONLINE, SyncBatchResult, syncPendingScans() (+3 more)

### Community 44 - "scanRecordWriteRepository.ts"
Cohesion: 0.20
Nodes (9): insertScanRecord(), isDuplicateRecordError(), useScanRecordDetails(), useScanRecords(), useSyncRecordsRefresh(), emitSyncRecordsChanged(), Listener, listeners (+1 more)

### Community 45 - "recordTypes.ts"
Cohesion: 0.38
Nodes (8): ClassScore, ReportedSeverity, ScanSourceType, mapScanRecordDetails(), mapScanRecordListItem(), CompletedScanDraft, ScanRecordDetails, StoredClassScore

### Community 46 - "repositoryContracts.ts"
Cohesion: 0.27
Nodes (4): ScanRecordRepository, ScanRecordWriteRepository, SaveCompletedScanInput, ScanRecordQuery

### Community 47 - "RecordCard.tsx"
Cohesion: 0.39
Nodes (7): formatSavedAt(), getResultLabel(), getSyncPresentation(), RecordCard(), RecordCardProps, styles, toPillVariant()

### Community 48 - "validateModelContract.ts"
Cohesion: 0.43
Nodes (4): ModelMetadata, tensorMatches(), TensorMetadata, validateModelContract()

## Knowledge Gaps
- **238 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `theme.ts`, `image-preview.tsx`, `symptom-checklist.tsx`, `record-details.tsx`, `home.tsx`, `scan.tsx`, `Typography`, `login.tsx`, `useCaneGuardModel.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `scanRecordSyncRepository.ts` to `record-details.tsx`, `reportRepository.ts`, `SyncProvider.tsx`, `scanRecordWriteRepository.ts`, `DatabaseProvider.tsx`, `useRecords.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `AuthProvider.tsx` to `login.tsx`, `SyncProvider.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._
- **Should `symptom-checklist.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Should `record-details.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._