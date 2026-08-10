# Graph Report - 01KZNP9FXP3KPF3YBSCHEJGY57  (2026-08-10)

## Corpus Check
- 161 files · ~59,812 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 893 nodes · 2599 edges · 41 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8127c89e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- toStorageError
- theme.ts
- useTheme
- settings.tsx
- DatabaseProvider.tsx
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- records.tsx
- analysis-result.tsx
- field-report.tsx
- preprocessImage.ts
- mobileAuthApi.ts
- scan.test.tsx
- analysis-result.test.tsx
- fieldReportValidation.ts
- image-preview.test.tsx
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- records.test.tsx
- scanRecordRepository.ts
- captureGpsLocation.ts
- record-details.test.tsx
- modelContract.ts
- recordTypes.ts
- scanRecordWriteRepository.ts
- detection/types.ts
- Spacing
- online-map-picker.tsx
- postprocessOutput.ts
- register.tsx
- saveCompletedScan.ts
- reportRepository.ts
- reports.tsx
- reportMultipartMapper.ts
- fieldReportSyncRepository.ts
- AppButton.tsx
- syncEvents.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `toStorageError()` - 51 edges
3. `CaneGuardDatabase` - 37 edges
4. `Typography` - 31 edges
5. `Spacing` - 28 edges
6. `StorageError` - 27 edges
7. `Radius` - 23 edges
8. `ComponentTokens` - 21 edges
9. `RecordDetailsScreen()` - 19 edges
10. `useCaneGuardDatabase()` - 19 edges

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

## Communities (41 total, 0 thin omitted)

### Community 0 - "toStorageError"
Cohesion: 0.30
Nodes (16): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), saveFieldReportDraft(), saveGpsCapture() (+8 more)

### Community 1 - "theme.ts"
Cohesion: 0.12
Nodes (17): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, CHIP_CONFIG, StatusChip(), StatusChipProps (+9 more)

### Community 2 - "useTheme"
Cohesion: 0.12
Nodes (25): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+17 more)

### Community 3 - "settings.tsx"
Cohesion: 0.11
Nodes (16): HomeScreen(), InputRow(), InputRowProps, LoginScreen(), styles, SelectRow(), SelectRowProps, SettingsScreen() (+8 more)

### Community 4 - "DatabaseProvider.tsx"
Cohesion: 0.12
Nodes (20): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+12 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.15
Nodes (24): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+16 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "records.tsx"
Cohesion: 0.08
Nodes (26): DiseaseCard(), DiseaseExample, DISEASES, QuickAction, QuickActionCard(), SectionTitle(), styles, FilterKey (+18 more)

### Community 8 - "analysis-result.tsx"
Cohesion: 0.09
Nodes (33): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ChecklistObservationId (+25 more)

### Community 10 - "field-report.tsx"
Cohesion: 0.13
Nodes (22): canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence(), LocationCapture() (+14 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.09
Nodes (27): DetectionError, DetectionErrorStage, compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison (+19 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.16
Nodes (23): CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError(), MobileAuthError (+15 more)

### Community 13 - "scan.test.tsx"
Cohesion: 0.16
Nodes (14): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+6 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.09
Nodes (38): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+30 more)

### Community 16 - "image-preview.test.tsx"
Cohesion: 0.12
Nodes (18): ImagePreviewScreen(), mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel (+10 more)

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
Nodes (35): PickerOutcome, readPickerOutcome(), ScanSourceType, assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage() (+27 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.12
Nodes (17): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe() (+9 more)

### Community 22 - "records.test.tsx"
Cohesion: 0.14
Nodes (11): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, SyncStatus, ScanRecordListItem (+3 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.29
Nodes (10): buildConditions(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), openTestDatabase(), readMigration() (+2 more)

### Community 24 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 25 - "record-details.test.tsx"
Cohesion: 0.19
Nodes (9): AppNavigator(), DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams (+1 more)

### Community 27 - "modelContract.ts"
Cohesion: 0.23
Nodes (10): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+2 more)

### Community 28 - "recordTypes.ts"
Cohesion: 0.35
Nodes (10): ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, QualityWarning, CompletedScanDraft, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE (+2 more)

### Community 29 - "scanRecordWriteRepository.ts"
Cohesion: 0.15
Nodes (11): useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), ScanRecordRepository (+3 more)

### Community 30 - "detection/types.ts"
Cohesion: 0.11
Nodes (19): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, initialScanSessionState, completedResult, DetectionResult (+11 more)

### Community 31 - "Spacing"
Cohesion: 0.14
Nodes (18): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+10 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 34 - "register.tsx"
Cohesion: 0.33
Nodes (5): RegisterScreen(), styles, styles, TextField(), TextFieldProps

### Community 37 - "saveCompletedScan.ts"
Cohesion: 0.31
Nodes (7): insertScanRecord(), INITIAL_STATE, SaveRecordState, SaveRecordStatus, saveCompletedScan(), SaveCompletedScanOptions, toPersistenceInput()

### Community 39 - "reportRepository.ts"
Cohesion: 0.16
Nodes (17): ReportsScreen(), mockRefresh, mockRouterPush, SUMMARY, fieldReports, ReportRepository, DateRange, LocalReportSummary (+9 more)

### Community 41 - "reports.tsx"
Cohesion: 0.17
Nodes (12): ClassCount(), getClassPresentation(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps, styles (+4 more)

### Community 42 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (31): apiBaseUrl, parseApiBaseUrl(), FieldReportSyncRepository, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody() (+23 more)

### Community 44 - "fieldReportSyncRepository.ts"
Cohesion: 0.16
Nodes (27): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced(), markFieldReportSyncing() (+19 more)

### Community 51 - "AppButton.tsx"
Cohesion: 0.15
Nodes (16): FieldReportScreen(), SplashScreen(), styles, firstParam(), getInitialCenter(), ManualMapScreen(), styles, AppButton() (+8 more)

### Community 54 - "syncEvents.ts"
Cohesion: 0.40
Nodes (3): Listener, listeners, subscribeSyncRecords()

## Knowledge Gaps
- **245 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `theme.ts`, `register.tsx`, `settings.tsx`, `DatabaseProvider.tsx`, `record-details.tsx`, `records.tsx`, `analysis-result.tsx`, `reports.tsx`, `field-report.tsx`, `reportRepository.ts`, `image-preview.test.tsx`, `AppButton.tsx`, `Spacing`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `record-details.tsx`, `saveCompletedScan.ts`, `reportRepository.ts`, `field-report.tsx`, `fieldReportSyncRepository.ts`, `AppButton.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `scanRecordWriteRepository.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `StorageError` connect `DatabaseProvider.tsx` to `toStorageError`, `saveCompletedScan.ts`, `analysis-result.tsx`, `fieldReportSyncRepository.ts`, `fieldReportValidation.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `scanRecordWriteRepository.ts`, `detection/types.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._
- **Should `settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._