# Graph Report - caneguard-mobile  (2026-08-12)

## Corpus Check
- 169 files · ~62,993 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 930 nodes · 2690 edges · 50 communities (48 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e248ed8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- theme.ts
- Spacing
- useTheme
- fieldReportSyncRepository.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- apiClient.ts
- image-preview.tsx
- recordValidation.ts
- preprocessImage.ts
- mobileAuthApi.ts
- symptom-checklist.test.tsx
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
- analysis-result.tsx
- SyncProvider.tsx
- syncFieldReport.ts
- modelContract.ts
- detection/types.ts
- recordTypes.ts
- errors.ts
- scan.tsx
- online-map-picker.tsx
- manual-map.tsx
- toStorageError
- useRecords.ts
- assessImageQuality.ts
- compareParityReference.ts
- record-details.test.tsx
- reportRepository.ts
- ModelDebugScreen
- reports.tsx
- reportMultipartMapper.ts
- analysis-result.test.tsx
- image-preview.test.tsx
- scan.test.tsx
- global.d.ts
- FieldReportSyncRepository
- postprocessOutput.ts
- diseaseCatalog.ts

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
- `renderPreview()` --calls--> `scanSessionReducer()`  [EXTRACTED]
  src/app/__tests__/image-preview.test.tsx → src/features/detection/context/scanSessionReducer.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (50 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.18
Nodes (14): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+6 more)

### Community 1 - "theme.ts"
Cohesion: 0.10
Nodes (20): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles (+12 more)

### Community 2 - "Spacing"
Cohesion: 0.13
Nodes (16): SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles, DisabledRow(), DisabledRowProps (+8 more)

### Community 3 - "useTheme"
Cohesion: 0.15
Nodes (16): EvidenceRow(), HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone (+8 more)

### Community 4 - "fieldReportSyncRepository.ts"
Cohesion: 0.25
Nodes (13): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+5 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.11
Nodes (27): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+19 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "apiClient.ts"
Cohesion: 0.21
Nodes (11): apiBaseUrl, parseApiBaseUrl(), ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+3 more)

### Community 8 - "image-preview.tsx"
Cohesion: 0.08
Nodes (28): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, MetadataRow() (+20 more)

### Community 10 - "recordValidation.ts"
Cohesion: 0.29
Nodes (14): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingStage() (+6 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (31): AppNavigator(), SettingsScreen(), mockLogout, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse (+23 more)

### Community 13 - "symptom-checklist.test.tsx"
Cohesion: 0.25
Nodes (6): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS

### Community 14 - "field-report.tsx"
Cohesion: 0.36
Nodes (8): canUseManualMap(), DraftFields(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), LocationCapture(), styles, SUBMISSION_REQUIREMENT_LABELS

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.06
Nodes (62): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+54 more)

### Community 16 - "runInference.ts"
Cohesion: 0.13
Nodes (14): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage() (+6 more)

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
Cohesion: 0.06
Nodes (35): DevelopmentStorageDebugScreen(), useStorageDiagnostics(), PickerOutcome, readPickerOutcome(), ScanSourceType, assertManagedScanImageUri(), CompensationCleanupResult, CopyScanImageInput (+27 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.11
Nodes (18): ModelDebugRoute(), DevelopmentModelSmokeTestScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel (+10 more)

### Community 22 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.19
Nodes (14): buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), findScanRecordById(), listManagedImageUris(), listScanRecords(), openTestDatabase(), readMigration() (+6 more)

### Community 24 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (11): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+3 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.25
Nodes (12): findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), isNetworkOnline(), isSameSession(), SyncContext, SyncContextValue, SyncProvider(), OFFLINE (+4 more)

### Community 26 - "syncFieldReport.ts"
Cohesion: 0.13
Nodes (17): getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS, syncFieldReport() (+9 more)

### Community 27 - "modelContract.ts"
Cohesion: 0.23
Nodes (10): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+2 more)

### Community 28 - "detection/types.ts"
Cohesion: 0.21
Nodes (14): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, DetectionResult (+6 more)

### Community 29 - "recordTypes.ts"
Cohesion: 0.18
Nodes (12): SyncStatus, QualityWarning, ScanRecordRepository, ScanRecordWriteRepository, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE, RecordsByLabel, SaveCompletedScanInput (+4 more)

### Community 30 - "errors.ts"
Cohesion: 0.11
Nodes (18): DatabaseContextValue, STORAGE_ERROR_CODES, StorageError, USER_MESSAGES, mockOpenDatabaseSync, mockDatabase, mockRandomUUID, mockSaveCompletedScan (+10 more)

### Community 31 - "scan.tsx"
Cohesion: 0.15
Nodes (15): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+7 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "manual-map.tsx"
Cohesion: 0.31
Nodes (8): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), useSync()

### Community 34 - "toStorageError"
Cohesion: 0.44
Nodes (8): CaneGuardDatabase, toStorageError(), deleteScanRecordById(), insertScanRecord(), deleteScanRecord(), SaveCompletedScanOptions, compensateManagedImageCopy(), deleteManagedScanImage()

### Community 35 - "useRecords.ts"
Cohesion: 0.27
Nodes (12): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+4 more)

### Community 36 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 38 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 39 - "reportRepository.ts"
Cohesion: 0.13
Nodes (20): ReportsScreen(), mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition() (+12 more)

### Community 40 - "ModelDebugScreen"
Cohesion: 0.67
Nodes (3): formatNumber(), formatScore(), ModelDebugScreen()

### Community 41 - "reports.tsx"
Cohesion: 0.09
Nodes (25): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), SectionLabel(), StateCard() (+17 more)

### Community 42 - "reportMultipartMapper.ts"
Cohesion: 0.19
Nodes (12): FieldReportUploadRecord, appendNumber(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateReport(), map() (+4 more)

### Community 43 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (11): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+3 more)

### Community 45 - "scan.test.tsx"
Cohesion: 0.16
Nodes (15): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanSessionContext (+7 more)

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 50 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

## Knowledge Gaps
- **266 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `theme.ts`, `Spacing`, `record-details.tsx`, `image-preview.tsx`, `mobileAuthApi.ts`, `field-report.tsx`, `runInference.ts`, `scanImageStorage.ts`, `useCaneGuardModel.tsx`, `records.test.tsx`, `analysis-result.tsx`, `scan.tsx`, `online-map-picker.tsx`, `manual-map.tsx`, `useRecords.ts`, `reportRepository.ts`, `ModelDebugScreen`, `reports.tsx`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useRecords.ts`, `fieldReportSyncRepository.ts`, `record-details.tsx`, `reportRepository.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `schema.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `SyncProvider.tsx`, `errors.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useRecords.ts` to `Spacing`, `record-details.tsx`, `record-details.test.tsx`, `reportRepository.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `SyncProvider.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._
- **Should `Spacing` be split into smaller, more focused modules?**
  _Cohesion score 0.12631578947368421 - nodes in this community are weakly interconnected._
- **Should `record-details.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._