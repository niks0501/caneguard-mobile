# Graph Report - caneguard-mobile  (2026-08-13)

## Corpus Check
- 170 files · ~63,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 931 nodes · 2692 edges · 39 communities (38 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1de6ab3f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- MockFile
- settings.tsx
- records.tsx
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- recordValidation.ts
- preprocessImage.ts
- mobileAuthApi.ts
- detection/types.ts
- field-report.tsx
- fieldReportRepository.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- fieldReportSyncRepository.ts
- recordTypes.ts
- saveCompletedScan.ts
- scan.tsx
- online-map-picker.tsx
- Radius
- scanRecordWriteRepository.test.ts
- assessImageQuality.ts
- compareParityReference.ts
- reportRepository.ts
- Typography
- useTheme
- analysis-result.test.tsx
- image-preview.test.tsx
- scan.test.tsx
- inferenceErrors.ts
- postprocessOutput.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 107 edges
2. `toStorageError()` - 52 edges
3. `CaneGuardDatabase` - 38 edges
4. `Typography` - 33 edges
5. `Spacing` - 30 edges
6. `StorageError` - 27 edges
7. `useAuth()` - 27 edges
8. `Radius` - 25 edges
9. `ComponentTokens` - 21 edges
10. `FieldReport` - 20 edges

## Surprising Connections (you probably didn't know these)
- `renderScan()` --calls--> `scanSessionReducer()`  [EXTRACTED]
  src/app/__tests__/scan.test.tsx → src/features/detection/context/scanSessionReducer.ts
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

## Communities (39 total, 1 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.11
Nodes (23): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 1 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 2 - "settings.tsx"
Cohesion: 0.11
Nodes (18): SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles, DisabledRow(), DisabledRowProps (+10 more)

### Community 3 - "records.tsx"
Cohesion: 0.10
Nodes (20): FilterKey, FILTERS, RecordsScreen(), StateCard(), styles, SEVERITIES, styles, SymptomChecklistScreen() (+12 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.11
Nodes (25): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, CenteredState() (+17 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 8 - "theme.ts"
Cohesion: 0.09
Nodes (34): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+26 more)

### Community 10 - "recordValidation.ts"
Cohesion: 0.15
Nodes (25): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken (+17 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.07
Nodes (40): AppNavigator(), apiBaseUrl, parseApiBaseUrl(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse (+32 more)

### Community 13 - "detection/types.ts"
Cohesion: 0.17
Nodes (13): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, initialScanSessionState, completedResult, InferenceTimings (+5 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.12
Nodes (23): canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence(), LocationCapture() (+15 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.06
Nodes (62): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+54 more)

### Community 16 - "runInference.ts"
Cohesion: 0.16
Nodes (12): ImagePreviewScreen(), ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), getInferenceErrorMessage() (+4 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.11
Nodes (22): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, fieldReports, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow (+14 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.22
Nodes (4): migration0, migration1, migration2, migration3

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.14
Nodes (28): SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+20 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.12
Nodes (22): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+14 more)

### Community 23 - "toStorageError"
Cohesion: 0.18
Nodes (24): FieldReportScreen(), CaneGuardDatabase, DatabaseInitializationView(), getStorageErrorMessage(), toStorageError(), useAuth(), buildConditions(), buildFieldReportJoinCondition() (+16 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.05
Nodes (54): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), FieldReportSyncRepository, FieldReportUploadRecord, findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt() (+46 more)

### Community 29 - "recordTypes.ts"
Cohesion: 0.09
Nodes (25): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, mockLoadMore (+17 more)

### Community 30 - "saveCompletedScan.ts"
Cohesion: 0.16
Nodes (12): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+4 more)

### Community 31 - "scan.tsx"
Cohesion: 0.20
Nodes (12): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), PickerOutcome (+4 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "Radius"
Cohesion: 0.21
Nodes (12): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), styles (+4 more)

### Community 35 - "scanRecordWriteRepository.test.ts"
Cohesion: 0.23
Nodes (7): openTestDatabase(), readMigration(), useSyncRecordsRefresh(), getSyncRecordsRevision(), Listener, listeners, subscribeSyncRecords()

### Community 36 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 39 - "reportRepository.ts"
Cohesion: 0.14
Nodes (19): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition() (+11 more)

### Community 40 - "Typography"
Cohesion: 0.13
Nodes (15): RegisterScreen(), styles, DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps (+7 more)

### Community 41 - "useTheme"
Cohesion: 0.09
Nodes (29): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+21 more)

### Community 43 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.14
Nodes (17): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+9 more)

### Community 45 - "scan.test.tsx"
Cohesion: 0.22
Nodes (7): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan()

### Community 46 - "inferenceErrors.ts"
Cohesion: 0.21
Nodes (7): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceStage(), InferenceErrorCode

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

## Knowledge Gaps
- **266 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `Radius`, `settings.tsx`, `records.tsx`, `online-map-picker.tsx`, `record-details.tsx`, `theme.ts`, `Typography`, `mobileAuthApi.ts`, `field-report.tsx`, `runInference.ts`, `toStorageError`, `scan.tsx`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `record-details.tsx`, `reportRepository.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `schema.ts`, `scanImageStorage.ts`, `fieldReportSyncRepository.ts`, `recordTypes.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `toStorageError` to `settings.tsx`, `record-details.tsx`, `reportRepository.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `fieldReportSyncRepository.ts`, `recordTypes.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Should `MockFile` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._