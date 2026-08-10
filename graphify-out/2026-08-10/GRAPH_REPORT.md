# Graph Report - 01KZNRWQK5WNC1GTNSM8H7N251  (2026-08-10)

## Corpus Check
- 161 files · ~60,500 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 896 nodes · 2617 edges · 47 communities (44 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd82b47b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- inferenceErrors.ts
- theme.ts
- model-debug.tsx
- useTheme
- toStorageError
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- reportMultipartMapper.ts
- recordValidation.ts
- records.tsx
- preprocessImage.ts
- mobileAuthApi.ts
- scan.test.tsx
- analysis-result.test.tsx
- fieldReportValidation.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- records.test.tsx
- scanRecordRepository.ts
- captureGpsLocation.ts
- record-details.test.tsx
- image-preview.test.tsx
- modelContract.ts
- recordTypes.ts
- repositoryContracts.ts
- detection/types.ts
- analysis-result.tsx
- online-map-picker.tsx
- postprocessOutput.ts
- field-report.tsx
- FieldReportSyncRepository
- syncFieldReport.ts
- compareParityReference.ts
- assessImageQuality.ts
- reportRepository.ts
- symptom-checklist.test.tsx
- reports.tsx
- apiClient.ts
- diseaseCatalog.ts
- env.ts
- readPickerOutcome.ts
- AppButton.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `toStorageError()` - 51 edges
3. `CaneGuardDatabase` - 37 edges
4. `Typography` - 31 edges
5. `Spacing` - 28 edges
6. `StorageError` - 27 edges
7. `useAuth()` - 25 edges
8. `Radius` - 23 edges
9. `ComponentTokens` - 21 edges
10. `RecordDetailsScreen()` - 19 edges

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

## Communities (47 total, 3 thin omitted)

### Community 0 - "inferenceErrors.ts"
Cohesion: 0.21
Nodes (7): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceStage(), InferenceErrorCode

### Community 1 - "theme.ts"
Cohesion: 0.11
Nodes (19): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles (+11 more)

### Community 2 - "model-debug.tsx"
Cohesion: 0.08
Nodes (33): MetadataRow(), styles, SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES (+25 more)

### Community 3 - "useTheme"
Cohesion: 0.08
Nodes (33): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+25 more)

### Community 4 - "toStorageError"
Cohesion: 0.05
Nodes (87): FieldReportScreen(), AppNavigator(), CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources() (+79 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.18
Nodes (17): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+9 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "reportMultipartMapper.ts"
Cohesion: 0.21
Nodes (11): FieldReportUploadRecord, appendNumber(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateReport(), map() (+3 more)

### Community 8 - "recordValidation.ts"
Cohesion: 0.29
Nodes (14): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 10 - "records.tsx"
Cohesion: 0.15
Nodes (16): FilterKey, FILTERS, RecordsScreen(), StateCard(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+8 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (17): MODEL_INPUT, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), PreprocessingResult (+9 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.16
Nodes (23): CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError(), MobileAuthError (+15 more)

### Community 13 - "scan.test.tsx"
Cohesion: 0.15
Nodes (16): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+8 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.08
Nodes (38): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+30 more)

### Community 16 - "runInference.ts"
Cohesion: 0.16
Nodes (12): ImagePreviewScreen(), ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), getInferenceErrorMessage() (+4 more)

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
Cohesion: 0.07
Nodes (32): useStorageDiagnostics(), SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage() (+24 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (13): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController (+5 more)

### Community 22 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.16
Nodes (17): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+9 more)

### Community 24 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 25 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 26 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 27 - "modelContract.ts"
Cohesion: 0.28
Nodes (8): MODEL_FILENAME, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION, ModelMetadata, tensorMatches(), TensorMetadata, validateModelContract()

### Community 28 - "recordTypes.ts"
Cohesion: 0.27
Nodes (13): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity (+5 more)

### Community 29 - "repositoryContracts.ts"
Cohesion: 0.22
Nodes (7): SyncStatus, ScanRecordRepository, ScanRecordWriteRepository, SaveCompletedScanInput, ScanRecordListItem, ScanRecordQuery, PaginatedQueryState

### Community 30 - "detection/types.ts"
Cohesion: 0.15
Nodes (16): InferenceTimings, ScanSessionState, ScanSessionStatus, mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState (+8 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (24): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+16 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 34 - "field-report.tsx"
Cohesion: 0.18
Nodes (14): canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence(), LocationCapture() (+6 more)

### Community 36 - "syncFieldReport.ts"
Cohesion: 0.27
Nodes (6): isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS

### Community 37 - "compareParityReference.ts"
Cohesion: 0.39
Nodes (6): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison

### Community 38 - "assessImageQuality.ts"
Cohesion: 0.32
Nodes (4): assessImageQuality(), ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 39 - "reportRepository.ts"
Cohesion: 0.16
Nodes (14): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition() (+6 more)

### Community 40 - "symptom-checklist.test.tsx"
Cohesion: 0.29
Nodes (5): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace

### Community 41 - "reports.tsx"
Cohesion: 0.17
Nodes (13): ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps (+5 more)

### Community 42 - "apiClient.ts"
Cohesion: 0.26
Nodes (10): ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage(), MobileReportResponse, readRemoteId() (+2 more)

### Community 43 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 51 - "AppButton.tsx"
Cohesion: 0.21
Nodes (11): firstParam(), getInitialCenter(), ManualMapScreen(), styles, AppButtonProps, AppButtonVariant, styles, formatDate() (+3 more)

## Knowledge Gaps
- **245 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `theme.ts`, `field-report.tsx`, `model-debug.tsx`, `toStorageError`, `record-details.tsx`, `reports.tsx`, `records.tsx`, `runInference.ts`, `AppButton.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `field-report.tsx`, `record-details.tsx`, `reportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `detection/types.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `StorageError` connect `toStorageError` to `recordValidation.ts`, `fieldReportValidation.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `detection/types.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._
- **Should `model-debug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08194905869324474 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._