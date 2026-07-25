# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 76 files · ~21,945 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 303 nodes · 657 edges · 15 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4365f100`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 55 edges
2. `Typography` - 18 edges
3. `Spacing` - 15 edges
4. `ComponentTokens` - 14 edges
5. `Radius` - 13 edges
6. `useThemePreference()` - 11 edges
7. `preprocessImage()` - 10 edges
8. `PreprocessingError` - 10 edges
9. `ScanSessionState` - 9 edges
10. `Shadows` - 8 edges

## Surprising Connections (you probably didn't know these)
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `DiseaseCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `InputRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (15 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.12
Nodes (16): RegisterScreen(), styles, AppButtonProps, AppButtonVariant, styles, DiseaseBadge(), DiseaseBadgeProps, styles (+8 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.21
Nodes (10): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base, Colors, Fonts (+2 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.20
Nodes (9): SelectRow(), SelectRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, ScreenHeader(), ScreenHeaderProps (+1 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.17
Nodes (17): ReportsScreen(), SectionLabel(), styles, AppButton(), BottomNav(), ProgressBar(), ProgressBarProps, styles (+9 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.13
Nodes (14): ModelSmokeTestScreen(), styles, mockUseCaneGuardModel, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelProvider(), CPU_DELEGATES (+6 more)

### Community 5 - "Home Screen"
Cohesion: 0.11
Nodes (17): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillVariant, DISEASE_ICONS (+9 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.08
Nodes (25): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, SEVERITIES, styles, createCompletedState() (+17 more)

### Community 8 - "Root Layout"
Cohesion: 0.18
Nodes (9): AppCard(), AppCardProps, styles, BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles (+1 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.06
Nodes (42): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), mockDispatch (+34 more)

### Community 11 - "scan.tsx"
Cohesion: 0.10
Nodes (29): ImagePreviewScreen(), styles, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+21 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.22
Nodes (8): DiseaseCard(), DiseaseExample, DISEASES, QuickAction, QuickActionCard(), SectionTitle(), styles, DiseaseTokens

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.14
Nodes (12): HomeScreen(), InputRow(), InputRowProps, LoginScreen(), styles, BrandedScreenHeader(), BrandedScreenHeaderProps, styles (+4 more)

### Community 14 - "modelContract.test.ts"
Cohesion: 0.29
Nodes (6): SplashScreen(), styles, ScreenContainer(), ScreenContainerProps, styles, Layout

## Knowledge Gaps
- **119 isolated node(s):** `Answer`, `Outcome`, `Source Nodes`, `mockDispatch`, `mockRouterBack` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Reports & Progress` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Home Screen`, `Root Layout`, `AppButton.tsx`, `ThemePreferenceProvider.tsx`, `modelContract.test.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `ScanSessionState` connect `scan.test.tsx` to `Symptom Checklist`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `ScanSessionAction` connect `scan.test.tsx` to `Symptom Checklist`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `Answer`, `Outcome`, `Source Nodes` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `Home Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._