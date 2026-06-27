# Graph Report - caneguard-mobile  (2026-06-27)

## Corpus Check
- 17 files · ~2,677 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 149 nodes · 208 edges · 12 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bece1fbb`
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `expo` - 13 edges
2. `useTheme()` - 10 edges
3. `ThemedText()` - 8 edges
4. `ThemedView()` - 8 edges
5. `scripts` - 7 edges
6. `Spacing` - 7 edges
7. `useColorScheme()` - 6 edges
8. `adaptiveIcon` - 5 edges
9. `Welcome to your Expo app 👋` - 5 edges
10. `WebBadge()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `TabLayout()` --calls--> `useColorScheme()`  [INFERRED]
  src/app/_layout.tsx → src/hooks/use-color-scheme.web.ts
- `AppTabs()` --calls--> `useColorScheme()`  [INFERRED]
  src/components/app-tabs.tsx → src/hooks/use-color-scheme.web.ts
- `CustomTabList()` --calls--> `useColorScheme()`  [INFERRED]
  src/components/app-tabs.web.tsx → src/hooks/use-color-scheme.web.ts
- `useTheme()` --calls--> `useColorScheme()`  [INFERRED]
  src/hooks/use-theme.ts → src/hooks/use-color-scheme.web.ts
- `TabTwoScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/explore.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (20): styles, TabTwoScreen(), getDevMenuHint(), HomeScreen(), styles, HintRow(), HintRowProps, styles (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (17): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (24): dependencies, expo, expo-constants, expo-device, expo-font, expo-glass-effect, expo-image, expo-linking (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (7): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, android

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (12): TabLayout(), AnimatedIcon(), AnimatedSplashOverlay(), glowKeyframe, keyframe, logoKeyframe, styles, AppTabs() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (14): devDependencies, @types/react, typescript, main, name, private, scripts, android (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/*, @/assets/*

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (6): Get a fresh project, Get started, Join the community, Learn more, Other setup steps, Welcome to your Expo app 👋

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (3): styles, ExternalLink(), Props

## Knowledge Gaps
- **88 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+83 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `expo` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _88 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._