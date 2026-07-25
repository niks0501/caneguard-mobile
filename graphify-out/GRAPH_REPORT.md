# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 84 files · ~24,545 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 364 nodes · 774 edges · 18 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0652d5ab`
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
- compareParityReference.ts
- StatusChip.tsx
- diseaseCatalog.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 55 edges
2. `Typography` - 18 edges
3. `Spacing` - 15 edges
4. `ComponentTokens` - 14 edges
5. `Radius` - 13 edges
6. `useCaneGuardModel()` - 12 edges
7. `preprocessImage()` - 11 edges
8. `PreprocessingError` - 11 edges
9. `useThemePreference()` - 11 edges
10. `runInference()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `DiseaseCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `RecordsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/records.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (18 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.14
Nodes (15): SplashScreen(), styles, RegisterScreen(), styles, AppButtonProps, AppButtonVariant, styles, ScreenContainer() (+7 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.16
Nodes (13): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles (+5 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.17
Nodes (18): HomeScreen(), InputRow(), InputRowProps, LoginScreen(), styles, SelectRow(), SelectRowProps, SettingsScreen() (+10 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.15
Nodes (14): ReportsScreen(), SectionLabel(), styles, ProgressBar(), ProgressBarProps, styles, styles, SummaryTile() (+6 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.09
Nodes (17): DevelopmentModelSmokeTestScreen(), styles, mockUseCaneGuardModel, mockModelRun, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController (+9 more)

### Community 5 - "Home Screen"
Cohesion: 0.15
Nodes (14): AppCard(), AppCardProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP (+6 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.14
Nodes (14): SEVERITIES, styles, completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS (+6 more)

### Community 8 - "Root Layout"
Cohesion: 0.15
Nodes (12): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, BottomNav(), BottomNavProps, NAV_ITEMS (+4 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.06
Nodes (49): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), createCompletedState() (+41 more)

### Community 11 - "scan.tsx"
Cohesion: 0.06
Nodes (39): ImagePreviewScreen(), styles, DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen() (+31 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.22
Nodes (8): DiseaseCard(), DiseaseExample, DISEASES, QuickAction, QuickActionCard(), SectionTitle(), styles, DiseaseTokens

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.20
Nodes (5): BrandedScreenHeaderProps, styles, ThemePreferenceContext, ThemePreferenceContextValue, ThemeScheme

### Community 14 - "modelContract.test.ts"
Cohesion: 0.13
Nodes (14): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, now(), PreprocessingResult, assessImageQuality() (+6 more)

### Community 15 - "compareParityReference.ts"
Cohesion: 0.21
Nodes (13): MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION, ModelLabel, compareModelOutputToParity() (+5 more)

### Community 16 - "StatusChip.tsx"
Cohesion: 0.33
Nodes (5): CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles

### Community 17 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

## Knowledge Gaps
- **140 isolated node(s):** `mockDispatch`, `mockRouterBack`, `mockRouterReplace`, `STATUS_TITLES`, `MatrixCase` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Auth & Onboarding` to `Scan & Analysis Flow`, `Records & Disease Library`, `Reports & Progress`, `Home Screen`, `Root Layout`, `AppButton.tsx`, `ThemePreferenceProvider.tsx`, `StatusChip.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `useCaneGuardModel()` connect `Settings & Navigation` to `scan.test.tsx`, `scan.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `PreprocessingError` connect `scan.tsx` to `scan.test.tsx`, `modelContract.test.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockRouterBack`, `mockRouterReplace` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.09425287356321839 - nodes in this community are weakly interconnected._
- **Should `Home Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._