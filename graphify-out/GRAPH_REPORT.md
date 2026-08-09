# Graph Report - caneguard-mobile  (2026-08-10)

## Corpus Check
- 161 files · ~57,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 887 nodes · 2196 edges · 55 communities (52 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0c740ad0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- register.tsx
- theme.ts
- useTheme
- symptom-checklist.tsx
- DatabaseProvider.tsx
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
- home.tsx
- migrations.test.ts
- scanImageStorage.ts
- runInference.ts
- storage-debug.tsx
- apiClient.ts
- reports.tsx
- modelContract.ts
- useCaneGuardModel.tsx
- postprocessOutput.ts
- useRecords.ts
- scan.test.tsx
- analysis-result.tsx
- online-map-picker.tsx
- syncFieldReport.ts
- BrandedScreenHeader.tsx
- fieldReportSyncRepository.ts
- reportMultipartMapper.ts
- StorageError
- image-preview.test.tsx
- reportRepository.ts
- scanRecordRepository.ts
- manual-map.tsx
- FieldReportSyncRepository
- record-details.test.tsx
- SyncProvider.tsx
- recordTypes.ts
- ScanRecordRepository
- ComponentTokens
- symptom-checklist.test.tsx
- scan.tsx
- RecordCard.tsx
- useSync.ts
- validateModelContract.ts
- saveCompletedScan.test.ts
- syncEvents.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 50 edges
2. `Typography` - 25 edges
3. `Spacing` - 22 edges
4. `StorageError` - 20 edges
5. `toStorageError()` - 19 edges
6. `Radius` - 19 edges
7. `ComponentTokens` - 18 edges
8. `ScanRecordDetails` - 16 edges
9. `FieldReport` - 14 edges
10. `FieldReportSyncRepository` - 13 edges

## Surprising Connections (you probably didn't know these)
- `DatabaseInitializationView()` --calls--> `getStorageErrorMessage()`  [EXTRACTED]
  src/database/DatabaseProvider.tsx → src/database/errors.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts
- `ThemedText()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/themed-text.tsx → src/hooks/use-theme.ts
- `ThemedView()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/themed-view.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (55 total, 3 thin omitted)

### Community 0 - "register.tsx"
Cohesion: 0.20
Nodes (8): RegisterScreen(), styles, ScreenContainerProps, styles, styles, TextField(), TextFieldProps, Layout

### Community 1 - "theme.ts"
Cohesion: 0.14
Nodes (15): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+7 more)

### Community 2 - "useTheme"
Cohesion: 0.14
Nodes (18): styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, DevelopmentModelSmokeTestScreen(), MetadataRow() (+10 more)

### Community 3 - "symptom-checklist.tsx"
Cohesion: 0.21
Nodes (10): SEVERITIES, styles, styles, SummaryTile(), SummaryTileProps, styles, SymptomChecklistItem(), SymptomChecklistItemProps (+2 more)

### Community 4 - "DatabaseProvider.tsx"
Cohesion: 0.13
Nodes (20): CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+12 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.20
Nodes (8): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel(), RecordDetailsScreen(), styles

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "records.tsx"
Cohesion: 0.12
Nodes (13): FilterKey, FILTERS, styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab (+5 more)

### Community 8 - "schema.ts"
Cohesion: 0.10
Nodes (19): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportAuthoringState, FieldReportLocationSource, FieldReportRow, fieldReports, GPS_CAPTURE_OUTCOMES, GpsCaptureOutcome (+11 more)

### Community 10 - "field-report.tsx"
Cohesion: 0.27
Nodes (8): canUseManualMap(), DraftFields(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), LocationCapture(), styles, SUBMISSION_REQUIREMENT_LABELS

### Community 11 - "preprocessImage.ts"
Cohesion: 0.09
Nodes (28): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, createInputTensor(), InputTensor (+20 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.10
Nodes (29): SelectRowProps, SettingsScreen(), styles, ToggleRowProps, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile() (+21 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.30
Nodes (13): createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite() (+5 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.13
Nodes (17): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+9 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.07
Nodes (51): FieldReportScreen(), mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan (+43 more)

### Community 16 - "inferenceErrors.ts"
Cohesion: 0.18
Nodes (10): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+2 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "home.tsx"
Cohesion: 0.20
Nodes (5): DiseaseExample, DISEASES, QuickAction, styles, DiseaseTokens

### Community 19 - "migrations.test.ts"
Cohesion: 0.20
Nodes (5): migration0, migration1, migration2, migration3, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "runInference.ts"
Cohesion: 0.20
Nodes (8): mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, MODEL_INPUT, InferenceRunner, runInference(), DetectionResult

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

### Community 23 - "apiClient.ts"
Cohesion: 0.21
Nodes (11): apiBaseUrl, parseApiBaseUrl(), ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+3 more)

### Community 25 - "reports.tsx"
Cohesion: 0.18
Nodes (7): ClassCount(), getClassPresentation(), styles, mockRefresh, mockRouterPush, SUMMARY, RecordsByLabel

### Community 26 - "modelContract.ts"
Cohesion: 0.29
Nodes (8): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION

### Community 27 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (15): formatNumber(), formatScore(), ModelDebugScreen(), mockRun, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe() (+7 more)

### Community 28 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 29 - "useRecords.ts"
Cohesion: 0.15
Nodes (18): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, getStorageErrorMessage(), toStorageError() (+10 more)

### Community 30 - "scan.test.tsx"
Cohesion: 0.15
Nodes (16): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, ScanSessionContext, ScanSessionContextValue (+8 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.31
Nodes (6): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, useSaveCompletedScan()

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (15): OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER, DEFAULT_MANUAL_MAP_ZOOM, getMapTiles() (+7 more)

### Community 33 - "syncFieldReport.ts"
Cohesion: 0.15
Nodes (15): getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS, syncFieldReport() (+7 more)

### Community 34 - "BrandedScreenHeader.tsx"
Cohesion: 0.14
Nodes (10): InputRowProps, styles, BrandedScreenHeader(), BrandedScreenHeaderProps, styles, ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider() (+2 more)

### Community 35 - "fieldReportSyncRepository.ts"
Cohesion: 0.26
Nodes (12): findScanRecordById(), findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+4 more)

### Community 36 - "reportMultipartMapper.ts"
Cohesion: 0.19
Nodes (12): FieldReportUploadRecord, appendNumber(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateReport(), map() (+4 more)

### Community 37 - "StorageError"
Cohesion: 0.21
Nodes (9): StorageError, mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, saveCompletedScan() (+1 more)

### Community 38 - "image-preview.test.tsx"
Cohesion: 0.15
Nodes (11): ImagePreviewScreen(), mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel (+3 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.21
Nodes (12): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+4 more)

### Community 40 - "scanRecordRepository.ts"
Cohesion: 0.16
Nodes (16): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, ScanRecordWriteRepository, buildConditions(), createScanRecordRepository(), deleteScanRecordById() (+8 more)

### Community 41 - "manual-map.tsx"
Cohesion: 0.21
Nodes (10): SplashScreen(), styles, firstParam(), getInitialCenter(), ManualMapScreen(), styles, AppButton(), AppButtonProps (+2 more)

### Community 43 - "record-details.test.tsx"
Cohesion: 0.20
Nodes (9): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, deleteScanRecord() (+1 more)

### Community 44 - "SyncProvider.tsx"
Cohesion: 0.33
Nodes (10): countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), isNetworkOnline(), SyncContextValue, SyncProvider(), OFFLINE, ONLINE (+2 more)

### Community 45 - "recordTypes.ts"
Cohesion: 0.21
Nodes (12): PickerOutcome, readPickerOutcome(), ClassScore, InferenceTimings, ReportedSeverity, ScanSessionStatus, ScanSourceType, mapScanRecordDetails() (+4 more)

### Community 47 - "ComponentTokens"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 48 - "symptom-checklist.test.tsx"
Cohesion: 0.22
Nodes (7): SymptomChecklistScreen(), completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS

### Community 49 - "scan.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 50 - "RecordCard.tsx"
Cohesion: 0.39
Nodes (7): formatSavedAt(), getResultLabel(), getSyncPresentation(), RecordCard(), RecordCardProps, styles, toPillVariant()

### Community 51 - "useSync.ts"
Cohesion: 0.43
Nodes (5): formatDate(), styles, SyncStatusPanel(), useSync(), SyncContext

### Community 52 - "validateModelContract.ts"
Cohesion: 0.43
Nodes (4): ModelMetadata, tensorMatches(), TensorMetadata, validateModelContract()

### Community 54 - "syncEvents.ts"
Cohesion: 0.40
Nodes (3): emitSyncRecordsChanged(), Listener, listeners

## Knowledge Gaps
- **259 isolated node(s):** `mockSave`, `mockCaptureLocation`, `mockFinalize`, `mockSaveManualLocation`, `mockRefresh` (+254 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `register.tsx`, `theme.ts`, `BrandedScreenHeader.tsx`, `symptom-checklist.tsx`, `online-map-picker.tsx`, `record-details.tsx`, `records.tsx`, `manual-map.tsx`, `field-report.tsx`, `ComponentTokens`, `scan.tsx`, `home.tsx`, `useCaneGuardModel.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Typography` connect `symptom-checklist.tsx` to `register.tsx`, `theme.ts`, `useTheme`, `BrandedScreenHeader.tsx`, `online-map-picker.tsx`, `record-details.tsx`, `records.tsx`, `manual-map.tsx`, `field-report.tsx`, `ComponentTokens`, `scan.tsx`, `home.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `managedImageExists()` connect `scanImageStorage.ts` to `reportMultipartMapper.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `mockSave`, `mockCaptureLocation`, `mockFinalize` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._