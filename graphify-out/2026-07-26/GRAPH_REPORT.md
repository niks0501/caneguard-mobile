# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 118 files · ~38,510 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 615 nodes · 1291 edges · 26 communities (25 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c58f215d`
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
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `DiseaseCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (26 total, 1 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.13
Nodes (18): SplashScreen(), styles, RegisterScreen(), styles, SEVERITIES, styles, AppButton(), AppButtonProps (+10 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.15
Nodes (14): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+6 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.11
Nodes (17): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, MetadataRow() (+9 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.15
Nodes (11): ProgressBar(), ProgressBarProps, styles, styles, SummaryTile(), SummaryTileProps, styles, SymptomChecklistItem() (+3 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.13
Nodes (15): ClassCount(), getClassPresentation(), ReportsScreen(), styles, mockRefresh, mockRouterPush, SUMMARY, openTestDatabase() (+7 more)

### Community 5 - "Home Screen"
Cohesion: 0.06
Nodes (39): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), styles, FilterKey (+31 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.22
Nodes (14): HomeScreen(), InputRow(), InputRowProps, LoginScreen(), styles, SelectRow(), SelectRowProps, SettingsScreen() (+6 more)

### Community 8 - "Root Layout"
Cohesion: 0.07
Nodes (40): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, insertScanRecord(), isDuplicateRecordError(), CompletedScanDraft, DateRange, LocalReportSummary (+32 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.05
Nodes (55): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SymptomChecklistScreen() (+47 more)

### Community 11 - "scan.tsx"
Cohesion: 0.07
Nodes (32): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity() (+24 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.13
Nodes (14): DiseaseCard(), DiseaseExample, DISEASES, QuickAction, QuickActionCard(), SectionTitle(), styles, BottomNav() (+6 more)

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
Cohesion: 0.20
Nodes (5): BrandedScreenHeaderProps, styles, ThemePreferenceContext, ThemePreferenceContextValue, ThemeScheme

### Community 19 - "BrandedScreenHeader.tsx"
Cohesion: 0.29
Nodes (3): migration0, migration1, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "runInference.ts"
Cohesion: 0.06
Nodes (46): ImagePreviewScreen(), formatNumber(), formatScore(), ModelDebugScreen(), DevelopmentModelSmokeTestScreen(), mockModelRun, mockPreprocessImage, mockRunInference (+38 more)

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

## Knowledge Gaps
- **213 isolated node(s):** `styles`, `migration0`, `migration1`, `migrationJournal`, `StorageDiagnostics` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Symptom Checklist` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `scan.test.tsx`, `AppButton.tsx`, `StatusChip.tsx`, `BrandedScreenHeader.tsx`, `runInference.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Symptom Checklist`, `scan.test.tsx`, `AppButton.tsx`, `StatusChip.tsx`, `BrandedScreenHeader.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `preprocessImage()` connect `scan.tsx` to `Auth & Onboarding`, `scan.test.tsx`, `runInference.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `styles`, `migration0`, `migration1` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `Auth & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._