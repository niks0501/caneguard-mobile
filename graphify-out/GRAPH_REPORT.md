# Graph Report - caneguard-mobile  (2026-07-26)

## Corpus Check
- 119 files · ~39,232 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 622 nodes · 1314 edges · 33 communities (32 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8f8f64d`
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
- inferenceErrors.ts
- postprocessOutput.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 61 edges
2. `Typography` - 20 edges
3. `Spacing` - 17 edges
4. `Radius` - 14 edges
5. `ComponentTokens` - 14 edges
6. `preprocessImage()` - 14 edges
7. `validateCompletedScanDraft()` - 13 edges
8. `MODEL_INPUT` - 13 edges
9. `useCaneGuardModel()` - 12 edges
10. `runInference()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `DebugRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-debug.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-smoke-test.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (33 total, 1 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.17
Nodes (13): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+5 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.15
Nodes (14): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+6 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.16
Nodes (10): MetadataRow(), styles, AppCard(), AppCardProps, styles, ScreenHeader(), ScreenHeaderProps, styles (+2 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.12
Nodes (16): SEVERITIES, styles, BrandedScreenHeaderProps, styles, ProgressBar(), ProgressBarProps, styles, styles (+8 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.13
Nodes (15): ClassCount(), getClassPresentation(), ReportsScreen(), styles, mockRefresh, mockRouterPush, SUMMARY, openTestDatabase() (+7 more)

### Community 5 - "Home Screen"
Cohesion: 0.10
Nodes (21): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), styles, DETAILS (+13 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.18
Nodes (17): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+9 more)

### Community 8 - "Root Layout"
Cohesion: 0.10
Nodes (29): insertScanRecord(), isDuplicateRecordError(), CompletedScanDraft, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+21 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.05
Nodes (55): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SymptomChecklistScreen() (+47 more)

### Community 11 - "scan.tsx"
Cohesion: 0.10
Nodes (25): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, createInputTensor(), InputTensor (+17 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.13
Nodes (14): SelectRow(), SelectRowProps, styles, ToggleRow(), ToggleRowProps, BottomNav(), BottomNavProps, NAV_ITEMS (+6 more)

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.13
Nodes (23): CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 14 - "modelContract.test.ts"
Cohesion: 0.11
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, createCompletedState(), createResult(), MATRIX (+8 more)

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
Cohesion: 0.19
Nodes (13): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256 (+5 more)

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

### Community 25 - "recordTypes.ts"
Cohesion: 0.08
Nodes (34): FilterKey, FILTERS, RecordsScreen(), styles, mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush (+26 more)

### Community 26 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (13): DevelopmentModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController (+5 more)

### Community 27 - "runInference.ts"
Cohesion: 0.20
Nodes (8): mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), InferenceRunner, runInference(), DetectionResult

### Community 28 - "image-preview.tsx"
Cohesion: 0.27
Nodes (8): ImagePreviewScreen(), MetadataRow(), styles, getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, getInferenceErrorMessage(), getPreprocessingErrorMessage()

### Community 29 - "model-debug.tsx"
Cohesion: 0.24
Nodes (8): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles

### Community 31 - "inferenceErrors.ts"
Cohesion: 0.33
Nodes (5): DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode

### Community 32 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

## Knowledge Gaps
- **216 isolated node(s):** `RecordCardProps`, `styles`, `mockRefresh`, `mockLoadMore`, `mockRecordsState` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Symptom Checklist` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `scan.test.tsx`, `AppButton.tsx`, `StatusChip.tsx`, `useCaneGuardModel.tsx`, `image-preview.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Symptom Checklist`, `scan.test.tsx`, `AppButton.tsx`, `StatusChip.tsx`, `image-preview.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `preprocessImage()` connect `scan.tsx` to `scan.test.tsx`, `runInference.ts`, `image-preview.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `RecordCardProps`, `styles`, `mockRefresh` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reports & Progress` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `Home Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._