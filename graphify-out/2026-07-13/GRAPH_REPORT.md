# Graph Report - .  (2026-07-06)

## Corpus Check
- Corpus is ~8,004 words - fits in a single context window. You may not need a graph.

## Summary
- 140 nodes · 386 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Scan & Analysis Flow|Scan & Analysis Flow]]
- [[_COMMUNITY_Records & Disease Library|Records & Disease Library]]
- [[_COMMUNITY_Auth & Onboarding|Auth & Onboarding]]
- [[_COMMUNITY_Reports & Progress|Reports & Progress]]
- [[_COMMUNITY_Settings & Navigation|Settings & Navigation]]
- [[_COMMUNITY_Home Screen|Home Screen]]
- [[_COMMUNITY_Design System & Theme|Design System & Theme]]
- [[_COMMUNITY_Symptom Checklist|Symptom Checklist]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 60 edges
2. `Typography` - 21 edges
3. `Spacing` - 18 edges
4. `ComponentTokens` - 18 edges
5. `Radius` - 12 edges
6. `AppButton()` - 11 edges
7. `Layout` - 11 edges
8. `ScreenHeader()` - 9 edges
9. `Shadows` - 6 edges
10. `AppCard()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisResultScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `ImagePreviewScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `LoginScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts
- `RecordsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/records.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.15
Nodes (19): AnalysisResultScreen(), styles, ImagePreviewScreen(), styles, styles, AppCard(), AppCardProps, styles (+11 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.11
Nodes (20): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+12 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.13
Nodes (17): SplashScreen(), styles, LoginScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps (+9 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.18
Nodes (10): DISEASE_BARS, ReportsScreen(), styles, ProgressBar(), ProgressBarProps, styles, styles, SummaryTile() (+2 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.15
Nodes (12): SelectRow(), SelectRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, BottomNav(), BottomNavProps (+4 more)

### Community 5 - "Home Screen"
Cohesion: 0.23
Nodes (12): BottomNavItem(), DiseaseExample, diseaseExamples, DiseasePhotoCard(), HeaderIconButton(), HomeScreen(), QuickAction, QuickActionCard() (+4 more)

### Community 6 - "Design System & Theme"
Cohesion: 0.21
Nodes (9): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base, Fonts, IconSize (+1 more)

### Community 7 - "Symptom Checklist"
Cohesion: 0.22
Nodes (8): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, styles, SymptomChecklistItem(), SymptomChecklistItemProps

## Knowledge Gaps
- **60 isolated node(s):** `styles`, `QuickAction`, `DiseaseExample`, `diseaseExamples`, `styles` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Home Screen` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Design System & Theme`, `Symptom Checklist`?**
  _High betweenness centrality (0.382) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Design System & Theme`, `Symptom Checklist`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ComponentTokens` connect `Scan & Analysis Flow` to `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Design System & Theme`, `Symptom Checklist`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `styles`, `QuickAction`, `DiseaseExample` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `Records & Disease Library` be split into smaller, more focused modules?**
  _Cohesion score 0.10869565217391304 - nodes in this community are weakly interconnected._
- **Should `Auth & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._