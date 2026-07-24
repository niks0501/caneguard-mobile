# Graph Report - caneguard-mobile  (2026-07-24)

## Corpus Check
- 33 files · ~9,684 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 154 nodes · 419 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69eccd3f`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 64 edges
2. `Typography` - 22 edges
3. `Spacing` - 19 edges
4. `ComponentTokens` - 18 edges
5. `Radius` - 17 edges
6. `useThemePreference()` - 13 edges
7. `Layout` - 12 edges
8. `AppButton()` - 11 edges
9. `Shadows` - 10 edges
10. `BrandedScreenHeader()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisResultScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `Metric()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `ImagePreviewScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `RecordsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/records.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.12
Nodes (22): AnalysisResultScreen(), Metric(), styles, SplashScreen(), styles, RegisterScreen(), styles, ScanScreen() (+14 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.16
Nodes (13): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles (+5 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.20
Nodes (9): ImagePreviewScreen(), styles, AppCard(), AppCardProps, styles, ScreenHeader(), ScreenHeaderProps, styles (+1 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.17
Nodes (13): ReportsScreen(), SectionLabel(), styles, BrandedScreenHeaderProps, styles, ProgressBar(), ProgressBarProps, styles (+5 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.17
Nodes (11): SelectRow(), SelectRowProps, styles, ToggleRow(), ToggleRowProps, BottomNav(), BottomNavProps, NAV_ITEMS (+3 more)

### Community 5 - "Home Screen"
Cohesion: 0.14
Nodes (15): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+7 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.33
Nodes (5): CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles

### Community 7 - "Symptom Checklist"
Cohesion: 0.22
Nodes (8): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, styles, SymptomChecklistItem(), SymptomChecklistItemProps

### Community 8 - "Root Layout"
Cohesion: 0.11
Nodes (22): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+14 more)

## Knowledge Gaps
- **67 isolated node(s):** `styles`, `QuickAction`, `DiseaseExample`, `DISEASES`, `styles` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Root Layout` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`?**
  _High betweenness centrality (0.386) - this node is a cross-community bridge._
- **Why does `useThemePreference()` connect `Root Layout` to `Records & Disease Library`, `Reports & Progress`, `Settings & Navigation`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `styles`, `QuickAction`, `DiseaseExample` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `Home Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `Root Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.11083743842364532 - nodes in this community are weakly interconnected._