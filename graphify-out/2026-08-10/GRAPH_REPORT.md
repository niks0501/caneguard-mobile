# Graph Report - caneguard-mobile  (2026-08-10)

## Corpus Check
- 161 files · ~57,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 892 nodes · 2581 edges · 52 communities (50 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f5abed3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- detection/types.ts
- theme.ts
- image-preview.tsx
- toStorageError
- DatabaseProvider.tsx
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- useTheme
- schema.ts
- field-report.tsx
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- analysis-result.test.tsx
- fieldReportValidation.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- captureGpsLocation.ts
- migrations.test.ts
- scanImageStorage.ts
- model-debug.tsx
- compareParityReference.ts
- apiClient.ts
- records.test.tsx
- checklistConsistency.ts
- diseaseCatalog.ts
- modelContract.ts
- sessionErrors.ts
- scanRecordRepository.ts
- scan.test.tsx
- analysis-result.tsx
- online-map-picker.tsx
- syncPendingFieldReports.test.ts
- use-theme.ts
- fieldReportSyncRepository.ts
- reportMultipartMapper.ts
- saveCompletedScan.ts
- image-preview.test.tsx
- reportRepository.ts
- scanRecordWriteRepository.ts
- Typography
- syncFieldReport.ts
- record-details.test.tsx
- SyncProvider.tsx
- recordTypes.ts
- assessImageQuality.ts
- ComponentTokens
- symptom-checklist.test.tsx
- readPickerOutcome.ts
- records.tsx
- syncEvents.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 103 edges
2. `toStorageError()` - 49 edges
3. `CaneGuardDatabase` - 37 edges
4. `Typography` - 31 edges
5. `Spacing` - 28 edges
6. `StorageError` - 27 edges
7. `Radius` - 23 edges
8. `ComponentTokens` - 21 edges
9. `useCaneGuardDatabase()` - 19 edges
10. `ScanRecordDetails` - 19 edges

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

## Communities (52 total, 2 thin omitted)

### Community 0 - "detection/types.ts"
Cohesion: 0.18
Nodes (12): initialScanSessionState, completedResult, DetectionResult, InferenceTimings, ScanSessionAction, ScanSessionState, ScanSessionStatus, ImageQualityAssessment (+4 more)

### Community 1 - "theme.ts"
Cohesion: 0.16
Nodes (12): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base, BottomTabInset, Colors (+4 more)

### Community 2 - "image-preview.tsx"
Cohesion: 0.11
Nodes (20): MetadataRow(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles (+12 more)

### Community 3 - "toStorageError"
Cohesion: 0.53
Nodes (12): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation() (+4 more)

### Community 4 - "DatabaseProvider.tsx"
Cohesion: 0.12
Nodes (22): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+14 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.18
Nodes (15): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+7 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "useTheme"
Cohesion: 0.11
Nodes (26): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+18 more)

### Community 8 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 10 - "field-report.tsx"
Cohesion: 0.13
Nodes (23): canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportScreen(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence() (+15 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.11
Nodes (29): AppNavigator(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError() (+21 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.09
Nodes (38): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+30 more)

### Community 16 - "runInference.ts"
Cohesion: 0.13
Nodes (12): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+4 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 19 - "migrations.test.ts"
Cohesion: 0.20
Nodes (5): migration0, migration1, migration2, migration3, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.08
Nodes (29): assertManagedScanImageUri(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME, findOrphanedManagedImages() (+21 more)

### Community 21 - "model-debug.tsx"
Cohesion: 0.16
Nodes (16): ImagePreviewScreen(), DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute() (+8 more)

### Community 22 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 23 - "apiClient.ts"
Cohesion: 0.24
Nodes (9): apiBaseUrl, parseApiBaseUrl(), ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+1 more)

### Community 24 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 25 - "checklistConsistency.ts"
Cohesion: 0.47
Nodes (4): ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase

### Community 26 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 27 - "modelContract.ts"
Cohesion: 0.12
Nodes (21): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+13 more)

### Community 28 - "sessionErrors.ts"
Cohesion: 0.47
Nodes (3): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode

### Community 29 - "scanRecordRepository.ts"
Cohesion: 0.15
Nodes (20): useCaneGuardDatabase(), buildConditions(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), openTestDatabase() (+12 more)

### Community 30 - "scan.test.tsx"
Cohesion: 0.15
Nodes (13): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+5 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (24): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+16 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.21
Nodes (17): MapControl(), MapOverlay(), OnlineMapPicker(), styles, coordinateAtViewportPoint(), coordinateToViewportPoint(), coordinateToWorldPixel(), DEFAULT_MANUAL_MAP_CENTER (+9 more)

### Community 33 - "syncPendingFieldReports.test.ts"
Cohesion: 0.20
Nodes (9): getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), database, findSyncCandidates (+1 more)

### Community 34 - "use-theme.ts"
Cohesion: 0.15
Nodes (14): InputRow(), InputRowProps, LoginScreen(), styles, SelectRow(), SelectRowProps, SettingsScreen(), styles (+6 more)

### Community 35 - "fieldReportSyncRepository.ts"
Cohesion: 0.26
Nodes (12): findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced(), markFieldReportSyncing() (+4 more)

### Community 36 - "reportMultipartMapper.ts"
Cohesion: 0.21
Nodes (11): FieldReportUploadRecord, appendNumber(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateReport(), map() (+3 more)

### Community 37 - "saveCompletedScan.ts"
Cohesion: 0.17
Nodes (13): INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan(), SaveCompletedScanOptions, toPersistenceInput(), compensateManagedImageCopy() (+5 more)

### Community 38 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.11
Nodes (19): mockRefresh, mockRouterPush, SUMMARY, fieldReports, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange (+11 more)

### Community 40 - "scanRecordWriteRepository.ts"
Cohesion: 0.24
Nodes (9): useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), insertScanRecord() (+1 more)

### Community 41 - "Typography"
Cohesion: 0.17
Nodes (12): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+4 more)

### Community 42 - "syncFieldReport.ts"
Cohesion: 0.12
Nodes (6): FieldReportSyncRepository, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 43 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 44 - "SyncProvider.tsx"
Cohesion: 0.22
Nodes (16): countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), isNetworkOnline(), SyncContextValue, SyncProvider(), OFFLINE, ONLINE (+8 more)

### Community 45 - "recordTypes.ts"
Cohesion: 0.31
Nodes (12): ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, CompletedScanDraft, DEFAULT_RECORD_PAGE_SIZE (+4 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.50
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 47 - "ComponentTokens"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 48 - "symptom-checklist.test.tsx"
Cohesion: 0.29
Nodes (5): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace

### Community 51 - "records.tsx"
Cohesion: 0.16
Nodes (14): firstParam(), getInitialCenter(), ManualMapScreen(), styles, FilterKey, FILTERS, RecordsScreen(), StateCard() (+6 more)

## Knowledge Gaps
- **244 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `theme.ts`, `image-preview.tsx`, `use-theme.ts`, `DatabaseProvider.tsx`, `record-details.tsx`, `Typography`, `field-report.tsx`, `ComponentTokens`, `records.tsx`, `model-debug.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldReportSyncRepository.ts`, `DatabaseProvider.tsx`, `saveCompletedScan.ts`, `record-details.tsx`, `reportRepository.ts`, `scanRecordWriteRepository.ts`, `SyncProvider.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `StorageError` connect `DatabaseProvider.tsx` to `detection/types.ts`, `toStorageError`, `fieldReportSyncRepository.ts`, `saveCompletedScan.ts`, `scanRecordWriteRepository.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `image-preview.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.11494252873563218 - nodes in this community are weakly interconnected._