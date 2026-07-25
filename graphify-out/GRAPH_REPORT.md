# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 61 files · ~17,496 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 266 nodes · 626 edges · 15 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `60697a37`
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
1. `useTheme()` - 60 edges
2. `Typography` - 20 edges
3. `Spacing` - 17 edges
4. `ComponentTokens` - 16 edges
5. `Radius` - 15 edges
6. `useThemePreference()` - 11 edges
7. `preprocessImage()` - 10 edges
8. `PreprocessingError` - 10 edges
9. `Layout` - 10 edges
10. `AppButton()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisResultScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `Metric()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `DiseaseCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (15 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.15
Nodes (15): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+7 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.21
Nodes (10): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base, Colors, Fonts (+2 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.22
Nodes (14): HomeScreen(), LoginScreen(), SelectRow(), SelectRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps (+6 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.20
Nodes (11): ReportsScreen(), SectionLabel(), styles, ProgressBar(), ProgressBarProps, styles, styles, SummaryTile() (+3 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.11
Nodes (14): ModelSmokeTestScreen(), styles, mockUseCaneGuardModel, mockUseTensorflowModel, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelProvider(), CPU_DELEGATES (+6 more)

### Community 5 - "Home Screen"
Cohesion: 0.14
Nodes (15): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+7 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 7 - "Symptom Checklist"
Cohesion: 0.22
Nodes (8): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, styles, SymptomChecklistItem(), SymptomChecklistItemProps

### Community 8 - "Root Layout"
Cohesion: 0.22
Nodes (7): InputRow(), InputRowProps, styles, AppCard(), AppCardProps, styles, Shadows

### Community 10 - "scan.test.tsx"
Cohesion: 0.08
Nodes (39): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), mockDispatch (+31 more)

### Community 11 - "scan.tsx"
Cohesion: 0.11
Nodes (28): ImagePreviewScreen(), styles, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+20 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.13
Nodes (14): DiseaseCard(), DiseaseExample, DISEASES, QuickAction, QuickActionCard(), SectionTitle(), styles, BottomNav() (+6 more)

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.29
Nodes (3): ThemePreferenceContext, ThemePreferenceContextValue, ThemeScheme

### Community 14 - "modelContract.test.ts"
Cohesion: 0.29
Nodes (6): AnalysisResultScreen(), Metric(), styles, BrandedScreenHeaderProps, styles, Layout

## Knowledge Gaps
- **101 isolated node(s):** `mockDispatch`, `mockRouterReplace`, `mockPreprocessImage`, `successfulPreprocessingResult`, `selectedState` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Auth & Onboarding` to `Scan & Analysis Flow`, `Records & Disease Library`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`, `AppButton.tsx`, `modelContract.test.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`, `AppButton.tsx`, `modelContract.test.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockRouterReplace`, `mockPreprocessImage` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._
- **Should `Home Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `scan.test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07607843137254902 - nodes in this community are weakly interconnected._