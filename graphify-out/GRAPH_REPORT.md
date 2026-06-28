# Graph Report - caneguard-mobile  (2026-06-27)

## Corpus Check
- 31 files · ~8,132 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 140 nodes · 416 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d182087e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 61 edges
2. `Typography` - 21 edges
3. `ComponentTokens` - 19 edges
4. `Spacing` - 18 edges
5. `Radius` - 14 edges
6. `AppButton()` - 12 edges
7. `Layout` - 11 edges
8. `ScreenContainer()` - 10 edges
9. `AppCard()` - 9 edges
10. `ScreenHeader()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `RecordsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/records.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts
- `ReportsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/reports.tsx → src/hooks/use-theme.ts
- `SelectRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/settings.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (9): RegisterScreen(), styles, Typography, AppButtonProps, AppButtonVariant, styles, styles, TextField() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (14): SplashScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (18): AnalysisResultScreen(), BottomNavItem(), DiseaseExample, diseaseExamples, DiseasePhotoCard(), HeaderIconButton(), HomeScreen(), QuickAction (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (10): DISEASE_BARS, ReportsScreen(), styles, Colors, ProgressBar(), ProgressBarProps, styles, styles (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (21): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, ComponentTokens, DiseaseTokens, DiseasePill() (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (12): SelectRow(), SelectRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, BottomNav(), BottomNavProps (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (8): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, styles, SymptomChecklistItem(), SymptomChecklistItemProps

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (15): styles, styles, styles, styles, Layout, Radius, Spacing, AppButton() (+7 more)

## Knowledge Gaps
- **60 isolated node(s):** `styles`, `QuickAction`, `DiseaseExample`, `diseaseExamples`, `styles` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.416) - this node is a cross-community bridge._
- **Why does `useColorScheme()` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `Typography` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `styles`, `QuickAction`, `DiseaseExample` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._