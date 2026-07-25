# Graph Report - caneguard-mobile  (2026-07-13)

## Corpus Check
- 33 files · ~9,684 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 154 nodes · 326 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3e80f4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Scan & Analysis Flow|Scan & Analysis Flow]]
- [[_COMMUNITY_Records & Disease Library|Records & Disease Library]]
- [[_COMMUNITY_Auth & Onboarding|Auth & Onboarding]]
- [[_COMMUNITY_Settings & Navigation|Settings & Navigation]]
- [[_COMMUNITY_Home Screen|Home Screen]]
- [[_COMMUNITY_Symptom Checklist|Symptom Checklist]]
- [[_COMMUNITY_Root Layout|Root Layout]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 64 edges
2. `useThemePreference()` - 13 edges
3. `AppButton()` - 11 edges
4. `Typography` - 9 edges
5. `BrandedScreenHeader()` - 8 edges
6. `ComponentTokens` - 8 edges
7. `BottomNav()` - 6 edges
8. `Spacing` - 6 edges
9. `ScreenContainer()` - 4 edges
10. `ThemeColor` - 4 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisResultScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `Metric()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `InputRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts
- `RecordsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/records.tsx → src/hooks/use-theme.ts
- `ScanScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/scan.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.14
Nodes (14): AnalysisResultScreen(), Metric(), styles, SplashScreen(), styles, ScanScreen(), styles, AppButton() (+6 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.07
Nodes (29): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, AppCard(), AppCardProps, styles (+21 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.14
Nodes (17): ImagePreviewScreen(), styles, RegisterScreen(), styles, ScreenContainer(), ScreenContainerProps, styles, ScreenHeader() (+9 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.09
Nodes (30): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+22 more)

### Community 5 - "Home Screen"
Cohesion: 0.20
Nodes (10): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DISEASE_ICONS, MockRecord, RecordCard() (+2 more)

### Community 7 - "Symptom Checklist"
Cohesion: 0.22
Nodes (8): SEVERITIES, Severity, styles, SymptomChecklistScreen(), SYMPTOMS, styles, SymptomChecklistItem(), SymptomChecklistItemProps

### Community 8 - "Root Layout"
Cohesion: 0.18
Nodes (10): AppNavigator(), InputRow(), InputRowProps, LoginScreen(), styles, ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider() (+2 more)

## Knowledge Gaps
- **70 isolated node(s):** `styles`, `QuickAction`, `DiseaseExample`, `DISEASES`, `styles` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Settings & Navigation` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Home Screen`, `Symptom Checklist`, `Root Layout`?**
  _High betweenness centrality (0.503) - this node is a cross-community bridge._
- **Why does `useThemePreference()` connect `Root Layout` to `Scan & Analysis Flow`, `Settings & Navigation`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `AppButton()` connect `Scan & Analysis Flow` to `Root Layout`, `Auth & Onboarding`, `Settings & Navigation`, `Symptom Checklist`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `styles`, `QuickAction`, `DiseaseExample` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `Records & Disease Library` be split into smaller, more focused modules?**
  _Cohesion score 0.06984126984126984 - nodes in this community are weakly interconnected._
- **Should `Auth & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._