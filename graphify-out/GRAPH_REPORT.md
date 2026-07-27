# Graph Report - caneguard-mobile  (2026-07-27)

## Corpus Check
- 145 files · ~46,401 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 758 nodes · 1677 edges · 47 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0161afb5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Scan & Analysis Flow
- Records & Disease Library
- Auth & Onboarding
- Reports & Progress
- Settings & Navigation
- Home Screen
- StatusChip.tsx
- Symptom Checklist
- Root Layout
- scan.test.tsx
- scan.tsx
- AppButton.tsx
- ThemePreferenceProvider.tsx
- modelContract.test.ts
- schema.ts
- StatusChip.tsx
- diseaseCatalog.ts
- BrandedScreenHeader.tsx
- BrandedScreenHeader.tsx
- scanImageStorage.ts
- runInference.ts
- storage-debug.tsx
- recordMappers.ts
- recordTypes.ts
- useCaneGuardModel.tsx
- runInference.ts
- image-preview.tsx
- model-debug.tsx
- _layout.tsx
- inferenceErrors.ts
- postprocessOutput.ts
- image-preview.test.tsx
- scan.test.tsx
- compareParityReference.ts
- symptom-checklist.test.tsx
- checklistConsistency.ts
- ScanSessionProvider.tsx
- detection/types.ts
- useSaveCompletedScan.ts
- reportMultipartMapper.ts
- apiClient.ts
- SyncProvider.tsx
- scanRecordWriteRepository.ts
- record-details.test.tsx
- saveCompletedScan.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 52 edges
2. `toStorageError()` - 22 edges
3. `Typography` - 17 edges
4. `StorageError` - 15 edges
5. `ScanRecordDetails` - 15 edges
6. `Spacing` - 15 edges
7. `preprocessImage()` - 14 edges
8. `ScanSessionState` - 13 edges
9. `ScanRecordSyncRepository` - 13 edges
10. `validateCompletedScanDraft()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `useSaveCompletedScan()` --indirect_call--> `save()`  [INFERRED]
  src/features/records/hooks/useSaveCompletedScan.ts → src/features/records/services/__tests__/saveCompletedScan.test.ts
- `SaveRecordState` --references--> `StorageError`  [EXTRACTED]
  src/features/records/hooks/useSaveCompletedScan.ts → src/database/errors.ts
- `DatabaseInitializationView()` --calls--> `getStorageErrorMessage()`  [EXTRACTED]
  src/database/DatabaseProvider.tsx → src/database/errors.ts
- `SaveCompletedScanOptions` --references--> `insertScanRecord()`  [EXTRACTED]
  src/features/records/services/saveCompletedScan.ts → src/features/records/data/scanRecordWriteRepository.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (47 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.17
Nodes (13): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+5 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.15
Nodes (14): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+6 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.11
Nodes (20): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+12 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.15
Nodes (11): ProgressBar(), ProgressBarProps, styles, styles, SummaryTile(), SummaryTileProps, styles, SymptomChecklistItem() (+3 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.32
Nodes (12): toStorageError(), countUnsyncedRecords(), createScanRecordSyncRepository(), findLastSuccessfulSyncAt(), findSyncCandidates(), markFailed(), markPending(), markSynced() (+4 more)

### Community 5 - "Home Screen"
Cohesion: 0.15
Nodes (15): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), RecordSyncStatus(), styles (+7 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.15
Nodes (18): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+10 more)

### Community 8 - "Root Layout"
Cohesion: 0.28
Nodes (15): createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite() (+7 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 11 - "scan.tsx"
Cohesion: 0.09
Nodes (27): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, createInputTensor(), InputTensor (+19 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.09
Nodes (33): AppNavigator(), InputRowProps, LoginScreen(), styles, SelectRowProps, SettingsScreen(), styles, ToggleRowProps (+25 more)

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.13
Nodes (21): CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+13 more)

### Community 14 - "modelContract.test.ts"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 15 - "schema.ts"
Cohesion: 0.13
Nodes (14): NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow, NewScanSymptomRow, ScanClassScoreRow, scanClassScores, ScanQualityWarningRow, scanQualityWarnings (+6 more)

### Community 16 - "StatusChip.tsx"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 17 - "diseaseCatalog.ts"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "BrandedScreenHeader.tsx"
Cohesion: 0.20
Nodes (5): BrandedScreenHeaderProps, styles, ThemePreferenceContext, ThemePreferenceContextValue, ThemeScheme

### Community 19 - "BrandedScreenHeader.tsx"
Cohesion: 0.29
Nodes (3): migration0, migration1, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "runInference.ts"
Cohesion: 0.31
Nodes (7): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_LABELS, MODEL_SHA256, MODEL_VERSION

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

### Community 23 - "recordMappers.ts"
Cohesion: 0.13
Nodes (3): ScanRecordSyncRepository, ApiHttpError, RECORD

### Community 25 - "recordTypes.ts"
Cohesion: 0.05
Nodes (44): ClassCount(), getClassPresentation(), styles, mockRefresh, mockRouterPush, SUMMARY, PickerOutcome, readPickerOutcome() (+36 more)

### Community 26 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (17): mockRun, mockUseCaneGuardModel, MODEL_INPUT, MODEL_OUTPUT, mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext (+9 more)

### Community 27 - "runInference.ts"
Cohesion: 0.16
Nodes (11): mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), getInferenceStage(), InferenceError, InferenceErrorCode (+3 more)

### Community 28 - "image-preview.tsx"
Cohesion: 0.29
Nodes (5): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 29 - "model-debug.tsx"
Cohesion: 0.15
Nodes (16): FilterKey, FILTERS, RecordsScreen(), styles, mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush (+8 more)

### Community 30 - "_layout.tsx"
Cohesion: 0.23
Nodes (7): initialScanSessionState, completedResult, ScanSessionState, NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan

### Community 31 - "inferenceErrors.ts"
Cohesion: 0.21
Nodes (8): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, styles, TextField(), TextFieldProps

### Community 32 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 33 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 34 - "scan.test.tsx"
Cohesion: 0.17
Nodes (12): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+4 more)

### Community 35 - "compareParityReference.ts"
Cohesion: 0.18
Nodes (10): MobileReportResponse, uploadMobileReport(), getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError() (+2 more)

### Community 36 - "symptom-checklist.test.tsx"
Cohesion: 0.22
Nodes (7): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ScanSessionContext

### Community 37 - "checklistConsistency.ts"
Cohesion: 0.39
Nodes (6): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel

### Community 38 - "ScanSessionProvider.tsx"
Cohesion: 0.24
Nodes (9): ImagePreviewScreen(), MetadataRow(), styles, SEVERITIES, styles, SymptomChecklistScreen(), SessionProbe(), useScanSession() (+1 more)

### Community 39 - "detection/types.ts"
Cohesion: 0.22
Nodes (11): executeBatch(), SyncBatchResult, syncPendingScans(), SyncPendingScansOptions, SyncResult, syncScanRecord(), database, findSyncCandidates (+3 more)

### Community 40 - "useSaveCompletedScan.ts"
Cohesion: 0.24
Nodes (9): formatDate(), styles, SyncStatusPanel(), INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), useSync() (+1 more)

### Community 41 - "reportMultipartMapper.ts"
Cohesion: 0.27
Nodes (8): appendNumber(), invalid(), isProbability(), mapReportToMultipart(), MultipartMapperDependencies, validateRecord(), RECORD, TestFormData

### Community 42 - "apiClient.ts"
Cohesion: 0.33
Nodes (7): apiBaseUrl, parseApiBaseUrl(), apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage()

### Community 43 - "SyncProvider.tsx"
Cohesion: 0.33
Nodes (8): resetStaleSyncingRecords(), isNetworkOnline(), SyncContextValue, SyncProvider(), OFFLINE, ONLINE, subscribeSyncRecords(), SyncTriggerSource

### Community 44 - "scanRecordWriteRepository.ts"
Cohesion: 0.31
Nodes (5): insertScanRecord(), isDuplicateRecordError(), emitSyncRecordsChanged(), Listener, listeners

### Community 45 - "record-details.test.tsx"
Cohesion: 0.29
Nodes (6): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterReplace, mockUseLocalSearchParams

### Community 46 - "saveCompletedScan.test.ts"
Cohesion: 0.40
Nodes (3): MANAGED_IMAGE, NOW, save()

## Knowledge Gaps
- **238 isolated node(s):** `fetchMock`, `LoginResponse`, `CurrentUserResponse`, `RECORD`, `MultipartMapperDependencies` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Symptom Checklist` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `ScanSessionProvider.tsx`, `scan.test.tsx`, `StatusChip.tsx`, `BrandedScreenHeader.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `Settings & Navigation` to `Home Screen`, `useSaveCompletedScan.ts`, `SyncProvider.tsx`, `scanRecordWriteRepository.ts`, `ThemePreferenceProvider.tsx`, `recordTypes.ts`, `model-debug.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `ScanRecordDetails` connect `recordTypes.ts` to `Settings & Navigation`, `Home Screen`, `record-details.test.tsx`, `recordMappers.ts`, `model-debug.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `fetchMock`, `LoginResponse`, `CurrentUserResponse` to the rest of the system?**
  _238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
- **Should `scan.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0919661733615222 - nodes in this community are weakly interconnected._
- **Should `AppButton.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08549019607843138 - nodes in this community are weakly interconnected._