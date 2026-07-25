# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 84 files · ~24,545 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 379 nodes · 991 edges · 18 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a23fb31d`
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
- compareParityReference.ts
- StatusChip.tsx
- diseaseCatalog.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 73 edges
2. `Typography` - 24 edges
3. `Spacing` - 21 edges
4. `Radius` - 18 edges
5. `ComponentTokens` - 18 edges
6. `preprocessImage()` - 14 edges
7. `MODEL_INPUT` - 13 edges
8. `useThemePreference()` - 13 edges
9. `AppButton()` - 12 edges
10. `Layout` - 12 edges

## Surprising Connections (you probably didn't know these)
- `AppNavigator()` --calls--> `useThemePreference()`  [EXTRACTED]
  src/app/_layout.tsx → src/providers/ThemePreferenceProvider.tsx
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (18 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.12
Nodes (16): SplashScreen(), styles, InputRow(), InputRowProps, styles, RegisterScreen(), styles, AppButton() (+8 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.23
Nodes (9): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, base, Colors, Fonts (+1 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.16
Nodes (10): MetadataRow(), styles, AppCard(), AppCardProps, styles, ScreenHeader(), ScreenHeaderProps, styles (+2 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.13
Nodes (16): ReportsScreen(), SectionLabel(), styles, BrandedScreenHeaderProps, styles, ProgressBar(), ProgressBarProps, styles (+8 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.06
Nodes (45): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+37 more)

### Community 5 - "Home Screen"
Cohesion: 0.14
Nodes (15): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+7 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.24
Nodes (10): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), PickerOutcome (+2 more)

### Community 8 - "Root Layout"
Cohesion: 0.17
Nodes (11): SelectRow(), SelectRowProps, styles, ToggleRow(), ToggleRowProps, BottomNav(), BottomNavProps, NAV_ITEMS (+3 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.06
Nodes (56): SEVERITIES, styles, SymptomChecklistScreen(), createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch (+48 more)

### Community 11 - "scan.tsx"
Cohesion: 0.11
Nodes (24): ImagePreviewScreen(), MetadataRow(), styles, getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage (+16 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.22
Nodes (14): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+6 more)

### Community 13 - "ThemePreferenceProvider.tsx"
Cohesion: 0.22
Nodes (5): AppNavigator(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), ThemeScheme

### Community 14 - "modelContract.test.ts"
Cohesion: 0.12
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, getChecklistConsistency() (+8 more)

### Community 15 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 16 - "StatusChip.tsx"
Cohesion: 0.15
Nodes (12): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+4 more)

### Community 17 - "diseaseCatalog.ts"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

## Knowledge Gaps
- **142 isolated node(s):** `mockDispatch`, `mockRouterBack`, `mockRouterReplace`, `STATUS_TITLES`, `MatrixCase` (+137 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `AppButton.tsx` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Symptom Checklist`, `Root Layout`, `scan.test.tsx`, `scan.tsx`, `modelContract.test.ts`, `StatusChip.tsx`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Why does `Typography` connect `StatusChip.tsx` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Symptom Checklist`, `Root Layout`, `scan.test.tsx`, `scan.tsx`, `AppButton.tsx`, `modelContract.test.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Spacing` connect `Reports & Progress` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Settings & Navigation`, `Home Screen`, `Symptom Checklist`, `Root Layout`, `scan.test.tsx`, `scan.tsx`, `AppButton.tsx`, `modelContract.test.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockRouterBack`, `mockRouterReplace` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `Reports & Progress` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Settings & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._