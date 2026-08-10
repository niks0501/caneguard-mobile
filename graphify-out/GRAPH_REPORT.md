# Graph Report - 01KZNRWQK5WNC1GTNSM8H7N251  (2026-08-10)

## Corpus Check
- 162 files · ~61,089 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 904 nodes · 2639 edges · 44 communities (43 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28c580e8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- theme.ts
- model-smoke-test.tsx
- useTheme
- fieldReportSyncRepository.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- recordValidation.ts
- toStorageError
- RecordCard.tsx
- preprocessImage.ts
- mobileAuthApi.ts
- scan.test.tsx
- analysis-result.test.tsx
- fieldReportTypes.ts
- image-preview.test.tsx
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- records.test.tsx
- scanRecordWriteRepository.ts
- captureGpsLocation.ts
- record-details.test.tsx
- useRecords.ts
- modelContract.ts
- detection/types.ts
- recordTypes.ts
- saveCompletedScan.test.ts
- analysis-result.tsx
- manual-map.tsx
- postprocessOutput.ts
- model-debug.tsx
- scan.tsx
- saveCompletedScan.ts
- compareParityReference.ts
- useRecords.test.tsx
- scanRecordRepository.ts
- symptom-checklist.test.tsx
- reports.tsx
- diseaseCatalog.ts
- Typography

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
- `renderPreview()` --calls--> `scanSessionReducer()`  [EXTRACTED]
  src/app/__tests__/image-preview.test.tsx → src/features/detection/context/scanSessionReducer.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (44 total, 1 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.11
Nodes (24): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+16 more)

### Community 1 - "theme.ts"
Cohesion: 0.13
Nodes (16): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, BrandedScreenHeaderProps, styles, DiseaseBadge() (+8 more)

### Community 2 - "model-smoke-test.tsx"
Cohesion: 0.10
Nodes (20): SplashScreen(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles (+12 more)

### Community 3 - "useTheme"
Cohesion: 0.10
Nodes (28): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+20 more)

### Community 4 - "fieldReportSyncRepository.ts"
Cohesion: 0.15
Nodes (28): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced(), markFieldReportSyncing() (+20 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.08
Nodes (33): canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportScreen(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence() (+25 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "recordValidation.ts"
Cohesion: 0.05
Nodes (44): apiBaseUrl, parseApiBaseUrl(), MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+36 more)

### Community 8 - "toStorageError"
Cohesion: 0.20
Nodes (22): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+14 more)

### Community 10 - "RecordCard.tsx"
Cohesion: 0.23
Nodes (10): DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), RecordCard(), RecordCardProps (+2 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.16
Nodes (17): DetectionError, DetectionErrorStage, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage() (+9 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.11
Nodes (28): AppNavigator(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError() (+20 more)

### Community 13 - "scan.test.tsx"
Cohesion: 0.16
Nodes (15): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanSessionContext (+7 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "fieldReportTypes.ts"
Cohesion: 0.09
Nodes (37): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+29 more)

### Community 16 - "image-preview.test.tsx"
Cohesion: 0.11
Nodes (20): ImagePreviewScreen(), mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel (+12 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.13
Nodes (17): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+9 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.22
Nodes (4): migration0, migration1, migration2, migration3

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.06
Nodes (38): useDatabaseState(), scanQualityWarnings, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), PickerOutcome, readPickerOutcome(), ScanSourceType (+30 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.17
Nodes (12): mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider(), CPU_DELEGATES, MODEL_ASSET (+4 more)

### Community 22 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 23 - "scanRecordWriteRepository.ts"
Cohesion: 0.14
Nodes (13): scanClassScores, createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), insertScanRecord(), isDuplicateRecordError(), openTestDatabase() (+5 more)

### Community 24 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 25 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 26 - "useRecords.ts"
Cohesion: 0.24
Nodes (16): ReportsScreen(), mockRefresh, mockRouterPush, SUMMARY, useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), LocalReportSummary (+8 more)

### Community 27 - "modelContract.ts"
Cohesion: 0.23
Nodes (10): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+2 more)

### Community 28 - "detection/types.ts"
Cohesion: 0.21
Nodes (10): ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, InferenceTimings, ScanSessionState, ScanSessionStatus (+2 more)

### Community 29 - "recordTypes.ts"
Cohesion: 0.19
Nodes (14): SyncStatus, ChecklistConsistency, ClassScore, ReportedSeverity, QualityWarning, ScanRecordRepository, ScanRecordWriteRepository, CompletedScanDraft (+6 more)

### Community 30 - "saveCompletedScan.test.ts"
Cohesion: 0.18
Nodes (7): mockDatabase, mockRandomUUID, mockSaveCompletedScan, useSaveCompletedScan(), MANAGED_IMAGE, NOW, save()

### Community 31 - "analysis-result.tsx"
Cohesion: 0.12
Nodes (20): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, MetadataRow() (+12 more)

### Community 32 - "manual-map.tsx"
Cohesion: 0.17
Nodes (21): firstParam(), getInitialCenter(), ManualMapScreen(), styles, MapControl(), MapOverlay(), OnlineMapPicker(), styles (+13 more)

### Community 33 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 34 - "model-debug.tsx"
Cohesion: 0.16
Nodes (13): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+5 more)

### Community 35 - "scan.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 36 - "saveCompletedScan.ts"
Cohesion: 0.47
Nodes (5): saveCompletedScan(), SaveCompletedScanOptions, toPersistenceInput(), compensateManagedImageCopy(), deleteManagedScanImage()

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 39 - "scanRecordRepository.ts"
Cohesion: 0.17
Nodes (16): fieldReports, scanRecords, ReportRepository, buildConditions(), buildFieldReportJoinCondition(), listScanRecords(), DateRange, DEFAULT_RECORD_PAGE_SIZE (+8 more)

### Community 40 - "symptom-checklist.test.tsx"
Cohesion: 0.29
Nodes (5): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace

### Community 41 - "reports.tsx"
Cohesion: 0.18
Nodes (12): ClassCount(), getClassPresentation(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps, styles (+4 more)

### Community 43 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 51 - "Typography"
Cohesion: 0.10
Nodes (23): FilterKey, FILTERS, StateCard(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps (+15 more)

## Knowledge Gaps
- **249 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+244 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `manual-map.tsx`, `theme.ts`, `model-smoke-test.tsx`, `model-debug.tsx`, `scan.tsx`, `record-details.tsx`, `DatabaseProvider.tsx`, `reports.tsx`, `RecordCard.tsx`, `image-preview.test.tsx`, `Typography`, `records.test.tsx`, `useRecords.ts`, `analysis-result.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `saveCompletedScan.ts`, `record-details.tsx`, `fieldReportSyncRepository.ts`, `scanRecordRepository.ts`, `scanImageStorage.ts`, `scanRecordWriteRepository.ts`, `useRecords.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `StorageError` connect `DatabaseProvider.tsx` to `fieldReportSyncRepository.ts`, `recordValidation.ts`, `scanRecordRepository.ts`, `toStorageError`, `fieldReportTypes.ts`, `scanImageStorage.ts`, `scanRecordWriteRepository.ts`, `detection/types.ts`, `saveCompletedScan.test.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _249 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10510510510510511 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `model-smoke-test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._