# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 51 files · ~15,127 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 232 nodes · 530 edges · 15 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `452a465e`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 60 edges
2. `Typography` - 20 edges
3. `Spacing` - 17 edges
4. `ComponentTokens` - 16 edges
5. `Radius` - 15 edges
6. `useThemePreference()` - 11 edges
7. `Layout` - 10 edges
8. `AppButton()` - 9 edges
9. `Shadows` - 9 edges
10. `scanSessionReducer()` - 8 edges

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

## Communities (15 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.18
Nodes (11): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), ScreenContainer(), ScreenContainerProps, styles (+3 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.09
Nodes (23): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+15 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.22
Nodes (9): SelectRow(), SelectRowProps, styles, ToggleRow(), ToggleRowProps, ScreenHeader(), ScreenHeaderProps, styles (+1 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.13
Nodes (16): ReportsScreen(), SectionLabel(), styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab (+8 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.08
Nodes (21): ModelSmokeTestScreen(), styles, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256 (+13 more)

### Community 5 - "Home Screen"
Cohesion: 0.14
Nodes (15): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+7 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.33
Nodes (5): CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles

### Community 7 - "Symptom Checklist"
Cohesion: 0.17
Nodes (12): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, BrandedScreenHeaderProps, styles, styles (+4 more)

### Community 8 - "Root Layout"
Cohesion: 0.27
Nodes (11): AnalysisResultScreen(), Metric(), styles, InputRow(), InputRowProps, LoginScreen(), styles, SettingsScreen() (+3 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.13
Nodes (24): mockDispatch, mockRouterReplace, renderPreview(), selectedState, mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary (+16 more)

### Community 11 - "scan.tsx"
Cohesion: 0.16
Nodes (14): ImagePreviewScreen(), styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles (+6 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.22
Nodes (7): AppButtonProps, AppButtonVariant, styles, DiseaseBadge(), DiseaseBadgeProps, styles, ComponentTokens

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.29
Nodes (3): ThemePreferenceContext, ThemePreferenceContextValue, ThemeScheme

## Knowledge Gaps
- **97 isolated node(s):** `mockDispatch`, `mockRouterReplace`, `selectedState`, `mockUseCaneGuardModel`, `mockDispatch` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Root Layout` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `AppButton.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `Typography` connect `Auth & Onboarding` to `Scan & Analysis Flow`, `Records & Disease Library`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`, `AppButton.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `ComponentTokens` connect `AppButton.tsx` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockRouterReplace`, `selectedState` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Records & Disease Library` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._
- **Should `Reports & Progress` be split into smaller, more focused modules?**
  _Cohesion score 0.13157894736842105 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.08377896613190731 - nodes in this community are weakly interconnected._