# Graph Report - caneguard-mobile  (2026-06-27)

## Corpus Check
- 21 files · ~5,074 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 86 nodes · 247 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c9bf0f5`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 39 edges
2. `Typography` - 13 edges
3. `ComponentTokens` - 12 edges
4. `Spacing` - 11 edges
5. `AppButton()` - 10 edges
6. `ScreenContainer()` - 10 edges
7. `AppCard()` - 9 edges
8. `Radius` - 9 edges
9. `TextField()` - 4 edges
10. `ThemedText()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisResultScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `ImagePreviewScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `LoginScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (13): LoginScreen(), styles, RegisterScreen(), styles, Layout, Spacing, AppCard(), ScreenContainer() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.20
Nodes (11): SplashScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.26
Nodes (11): BottomNavItem(), DiseaseExample, diseaseExamples, DiseasePhotoCard(), HeaderIconButton(), HomeScreen(), QuickAction, QuickActionCard() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (9): ImagePreviewScreen(), styles, ScanScreen(), styles, Radius, AppButton(), AppButtonProps, AppButtonVariant (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.28
Nodes (7): AnalysisResultScreen(), styles, ComponentTokens, DiseaseTokens, DiseaseBadge(), DiseaseBadgeProps, styles

### Community 6 - "Community 6"
Cohesion: 0.50
Nodes (3): Shadows, AppCardProps, styles

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (9): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, Typography, styles, SymptomChecklistItem() (+1 more)

## Knowledge Gaps
- **31 isolated node(s):** `styles`, `QuickAction`, `DiseaseExample`, `diseaseExamples`, `styles` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.386) - this node is a cross-community bridge._
- **Why does `useColorScheme()` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `styles`, `QuickAction`, `DiseaseExample` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._