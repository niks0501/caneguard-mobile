# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 36 files · ~10,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 174 nodes · 445 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19660b7c`
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
6. `Layout` - 12 edges
7. `AppButton()` - 11 edges
8. `useThemePreference()` - 11 edges
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
Cohesion: 0.11
Nodes (23): AnalysisResultScreen(), Metric(), styles, SplashScreen(), styles, RegisterScreen(), styles, ScanScreen() (+15 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.18
Nodes (11): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base, Colors, DiseaseTokens (+3 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.20
Nodes (9): ImagePreviewScreen(), styles, AppCard(), AppCardProps, styles, ScreenHeader(), ScreenHeaderProps, styles (+1 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.14
Nodes (16): ReportsScreen(), SectionLabel(), styles, BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles (+8 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.13
Nodes (16): ModelSmokeTestScreen(), styles, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+8 more)

### Community 5 - "Home Screen"
Cohesion: 0.11
Nodes (19): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseaseBadge(), DiseaseBadgeProps, styles (+11 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.33
Nodes (5): CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles

### Community 7 - "Symptom Checklist"
Cohesion: 0.22
Nodes (8): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, styles, SymptomChecklistItem(), SymptomChecklistItemProps

### Community 8 - "Root Layout"
Cohesion: 0.10
Nodes (25): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+17 more)

## Knowledge Gaps
- **74 isolated node(s):** `styles`, `MODEL_SHA256`, `MODEL_LABELS`, `ModelLabel`, `MODEL_ASSET` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Root Layout` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`?**
  _High betweenness centrality (0.292) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Home Screen`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `ComponentTokens` connect `Home Screen` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `StatusChip.tsx`, `Symptom Checklist`, `Root Layout`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `styles`, `MODEL_SHA256`, `MODEL_LABELS` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.11290322580645161 - nodes in this community are weakly interconnected._
- **Should `Reports & Progress` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._