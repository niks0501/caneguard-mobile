# Graph Report - caneguard-mobile  (2026-06-27)

## Corpus Check
- 14 files · ~2,319 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 52 nodes · 127 edges · 7 communities (6 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `145afa82`
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

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 20 edges
2. `Typography` - 6 edges
3. `ComponentTokens` - 6 edges
4. `AppButton()` - 5 edges
5. `AppCard()` - 5 edges
6. `ScreenContainer()` - 5 edges
7. `Spacing` - 5 edges
8. `TextField()` - 4 edges
9. `Radius` - 4 edges
10. `ThemedText()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `LoginScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts
- `useTheme()` --calls--> `useColorScheme()`  [INFERRED]
  src/hooks/use-theme.ts → src/hooks/use-color-scheme.web.ts
- `RootLayout()` --calls--> `useColorScheme()`  [INFERRED]
  src/app/_layout.tsx → src/hooks/use-color-scheme.web.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (7 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.43
Nodes (6): SplashScreen(), styles, ThemedText(), ThemedView(), ThemedViewProps, useTheme()

### Community 1 - "Community 1"
Cohesion: 0.25
Nodes (7): styles, ThemedTextProps, base, Colors, DiseaseTokens, Fonts, ThemeColor

### Community 2 - "Community 2"
Cohesion: 0.28
Nodes (7): RegisterScreen(), styles, Layout, Spacing, ScreenContainer(), ScreenContainerProps, styles

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (8): LoginScreen(), styles, Radius, Typography, AppButton(), AppButtonProps, AppButtonVariant, styles

### Community 5 - "Community 5"
Cohesion: 0.40
Nodes (4): ComponentTokens, styles, TextField(), TextFieldProps

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (4): Shadows, AppCard(), AppCardProps, styles

## Knowledge Gaps
- **17 isolated node(s):** `styles`, `styles`, `styles`, `ThemedTextProps`, `styles` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.284) - this node is a cross-community bridge._
- **Why does `useColorScheme()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **What connects `styles`, `styles`, `styles` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._