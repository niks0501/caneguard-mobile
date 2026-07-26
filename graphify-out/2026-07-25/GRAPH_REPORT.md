# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 118 files · ~38,390 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 614 nodes · 1308 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d03cda8d`
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
- StatusChip.tsx
- diseaseCatalog.ts
- BrandedScreenHeader.tsx
- scanImageStorage.ts
- runInference.ts

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

## Communities (21 total, 1 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.13
Nodes (15): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+7 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.15
Nodes (14): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+6 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.11
Nodes (18): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, DevelopmentModelSmokeTestScreen() (+10 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.12
Nodes (16): SEVERITIES, styles, SymptomChecklistScreen(), BrandedScreenHeaderProps, styles, ProgressBar(), ProgressBarProps, styles (+8 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.13
Nodes (15): ClassCount(), getClassPresentation(), ReportsScreen(), styles, mockRefresh, mockRouterPush, SUMMARY, openTestDatabase() (+7 more)

### Community 5 - "Home Screen"
Cohesion: 0.06
Nodes (41): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), styles, FilterKey (+33 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 8 - "Root Layout"
Cohesion: 0.07
Nodes (40): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, insertScanRecord(), isDuplicateRecordError(), CompletedScanDraft, DateRange, LocalReportSummary (+32 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.06
Nodes (47): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+39 more)

### Community 11 - "scan.tsx"
Cohesion: 0.07
Nodes (32): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity() (+24 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.08
Nodes (32): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+24 more)

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.07
Nodes (41): DevelopmentStorageDebugScreen(), styles, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider() (+33 more)

### Community 14 - "modelContract.test.ts"
Cohesion: 0.11
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, createCompletedState(), createResult(), MATRIX (+8 more)

### Community 16 - "StatusChip.tsx"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 17 - "diseaseCatalog.ts"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "runInference.ts"
Cohesion: 0.06
Nodes (45): ImagePreviewScreen(), formatNumber(), formatScore(), ModelDebugScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel (+37 more)

## Knowledge Gaps
- **208 isolated node(s):** `mockRefresh`, `mockRouterPush`, `SUMMARY`, `styles`, `LocalReportOptions` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `AppButton.tsx` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Symptom Checklist`, `StatusChip.tsx`, `runInference.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Typography` connect `StatusChip.tsx` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Symptom Checklist`, `AppButton.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `preprocessImage()` connect `scan.tsx` to `Auth & Onboarding`, `scan.test.tsx`, `runInference.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockRouterPush`, `SUMMARY` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.13157894736842105 - nodes in this community are weakly interconnected._
- **Should `Auth & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Reports & Progress` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._