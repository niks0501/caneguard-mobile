# Graph Report - caneguard-mobile  (2026-07-27)

## Corpus Check
- 145 files · ~46,282 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 759 nodes · 1694 edges · 40 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d4771bd`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 52 edges
2. `toStorageError()` - 22 edges
3. `ScanRecordDetails` - 17 edges
4. `Typography` - 17 edges
5. `StorageError` - 15 edges
6. `Spacing` - 15 edges
7. `preprocessImage()` - 14 edges
8. `ScanSessionState` - 13 edges
9. `ScanRecordSyncRepository` - 13 edges
10. `validateCompletedScanDraft()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ScanSessionProvider()` --indirect_call--> `scanSessionReducer()`  [INFERRED]
  src/features/detection/context/ScanSessionProvider.tsx → src/features/detection/context/scanSessionReducer.ts
- `LocalReportOptions` --references--> `DateRange`  [EXTRACTED]
  src/features/reports/data/reportRepository.ts → src/features/records/domain/recordTypes.ts
- `useSaveCompletedScan()` --indirect_call--> `save()`  [INFERRED]
  src/features/records/hooks/useSaveCompletedScan.ts → src/features/records/services/__tests__/saveCompletedScan.test.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (40 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.17
Nodes (12): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+4 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.12
Nodes (17): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+9 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.15
Nodes (14): MetadataRow(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, AppCard(), AppCardProps, styles (+6 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.16
Nodes (13): SEVERITIES, styles, SymptomChecklistScreen(), BrandedScreenHeaderProps, styles, styles, SummaryTile(), SummaryTileProps (+5 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.11
Nodes (33): countUnsyncedRecords(), createScanRecordSyncRepository(), findLastSuccessfulSyncAt(), findSyncCandidates(), markFailed(), markPending(), markSynced(), markSyncing() (+25 more)

### Community 5 - "Home Screen"
Cohesion: 0.07
Nodes (29): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), RecordSyncStatus(), styles (+21 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.15
Nodes (18): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+10 more)

### Community 8 - "Root Layout"
Cohesion: 0.22
Nodes (18): insertScanRecord(), isDuplicateRecordError(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores() (+10 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.26
Nodes (9): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), PickerOutcome (+1 more)

### Community 11 - "scan.tsx"
Cohesion: 0.10
Nodes (24): mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg() (+16 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.09
Nodes (33): AppNavigator(), InputRowProps, LoginScreen(), styles, SelectRowProps, SettingsScreen(), styles, ToggleRowProps (+25 more)

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.09
Nodes (34): CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+26 more)

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
Cohesion: 0.29
Nodes (3): ThemePreferenceContext, ThemePreferenceContextValue, ThemeScheme

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
Cohesion: 0.06
Nodes (24): apiBaseUrl, parseApiBaseUrl(), ScanRecordSyncRepository, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody() (+16 more)

### Community 25 - "recordTypes.ts"
Cohesion: 0.05
Nodes (48): FilterKey, FILTERS, RecordsScreen(), styles, DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh (+40 more)

### Community 26 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (18): mockRun, mockUseCaneGuardModel, MODEL_INPUT, MODEL_OUTPUT, mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext (+10 more)

### Community 27 - "runInference.ts"
Cohesion: 0.19
Nodes (9): ImagePreviewScreen(), DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, InferenceRunner (+1 more)

### Community 28 - "image-preview.tsx"
Cohesion: 0.36
Nodes (4): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError

### Community 29 - "model-debug.tsx"
Cohesion: 0.24
Nodes (8): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles

### Community 30 - "_layout.tsx"
Cohesion: 0.19
Nodes (8): initialScanSessionState, ScanSessionState, NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan, MANAGED_IMAGE, NOW

### Community 31 - "inferenceErrors.ts"
Cohesion: 0.19
Nodes (10): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, styles, TextField(), TextFieldProps (+2 more)

### Community 32 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 33 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 34 - "scan.test.tsx"
Cohesion: 0.20
Nodes (9): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+1 more)

### Community 35 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 36 - "symptom-checklist.test.tsx"
Cohesion: 0.25
Nodes (6): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS

### Community 37 - "checklistConsistency.ts"
Cohesion: 0.39
Nodes (6): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel

### Community 38 - "ScanSessionProvider.tsx"
Cohesion: 0.43
Nodes (5): ScanSessionContext, ScanSessionContextValue, ScanSessionProvider(), SessionProbe(), useScanSession()

### Community 39 - "detection/types.ts"
Cohesion: 0.33
Nodes (5): completedResult, DetectionResult, InferenceTimings, ScanSessionAction, ScanSessionStatus

## Knowledge Gaps
- **235 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+230 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Symptom Checklist` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `scan.test.tsx`, `StatusChip.tsx`, `runInference.ts`, `model-debug.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `ScanRecordDetails` connect `recordTypes.ts` to `Settings & Navigation`, `Home Screen`, `recordMappers.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `ThemePreferenceProvider.tsx` to `Root Layout`, `recordTypes.ts`, `Settings & Navigation`, `Home Screen`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _235 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Records & Disease Library` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `Auth & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.10676532769556026 - nodes in this community are weakly interconnected._