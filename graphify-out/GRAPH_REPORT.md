# Graph Report - caneguard-mobile  (2026-07-25)

## Corpus Check
- 87 files · ~25,106 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 389 nodes · 995 edges · 20 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6dc6d9b`
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
- modelContract.test.ts
- compareParityReference.ts
- StatusChip.tsx
- diseaseCatalog.ts
- ScreenContainer.tsx
- BrandedScreenHeader.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 73 edges
2. `Typography` - 24 edges
3. `Spacing` - 21 edges
4. `Radius` - 18 edges
5. `ComponentTokens` - 18 edges
6. `preprocessImage()` - 14 edges
7. `MODEL_INPUT` - 13 edges
8. `AppButton()` - 12 edges
9. `Layout` - 12 edges
10. `useCaneGuardModel()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `DebugRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-debug.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (20 total, 0 thin omitted)

### Community 0 - "Scan & Analysis Flow"
Cohesion: 0.14
Nodes (15): RegisterScreen(), styles, SEVERITIES, styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+7 more)

### Community 1 - "Records & Disease Library"
Cohesion: 0.12
Nodes (9): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, ThemeColor, ThemePreferenceContext, ThemePreferenceContextValue (+1 more)

### Community 2 - "Auth & Onboarding"
Cohesion: 0.16
Nodes (13): MetadataRow(), styles, AppCard(), AppCardProps, styles, ScreenHeader(), ScreenHeaderProps, styles (+5 more)

### Community 3 - "Reports & Progress"
Cohesion: 0.13
Nodes (15): ReportsScreen(), SectionLabel(), styles, BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles (+7 more)

### Community 4 - "Settings & Navigation"
Cohesion: 0.06
Nodes (44): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+36 more)

### Community 5 - "Home Screen"
Cohesion: 0.14
Nodes (16): FilterKey, FILTERS, MOCK_RECORDS, RecordsScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant (+8 more)

### Community 6 - "StatusChip.tsx"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "Symptom Checklist"
Cohesion: 0.18
Nodes (13): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SymptomChecklistScreen() (+5 more)

### Community 8 - "Root Layout"
Cohesion: 0.10
Nodes (20): ImagePreviewScreen(), MetadataRow(), styles, MODEL_INPUT, getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError (+12 more)

### Community 10 - "scan.test.tsx"
Cohesion: 0.06
Nodes (51): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterReplace, STATUS_TITLES (+43 more)

### Community 11 - "scan.tsx"
Cohesion: 0.19
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AppButton.tsx"
Cohesion: 0.14
Nodes (22): DiseaseCard(), DiseaseExample, DISEASES, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles (+14 more)

### Community 14 - "modelContract.test.ts"
Cohesion: 0.15
Nodes (13): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, getChecklistConsistency() (+5 more)

### Community 15 - "compareParityReference.ts"
Cohesion: 0.27
Nodes (6): DevelopmentStorageCompatibilityScreen(), styles, compatibilityDatabase, expoDatabase, useCompatibilityDatabaseProbe(), compatibilityProbe

### Community 16 - "StatusChip.tsx"
Cohesion: 0.17
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 17 - "diseaseCatalog.ts"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "ScreenContainer.tsx"
Cohesion: 0.29
Nodes (6): SplashScreen(), styles, ScreenContainer(), ScreenContainerProps, styles, Layout

### Community 19 - "BrandedScreenHeader.tsx"
Cohesion: 0.50
Nodes (3): BrandedScreenHeaderProps, styles, Fonts

## Knowledge Gaps
- **145 isolated node(s):** `styles`, `expoDatabase`, `compatibilityDatabase`, `mockDispatch`, `mockRouterBack` (+140 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `AppButton.tsx` to `Scan & Analysis Flow`, `Records & Disease Library`, `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Symptom Checklist`, `Root Layout`, `modelContract.test.ts`, `StatusChip.tsx`, `ScreenContainer.tsx`, `BrandedScreenHeader.tsx`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Why does `Typography` connect `Scan & Analysis Flow` to `Auth & Onboarding`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Symptom Checklist`, `Root Layout`, `AppButton.tsx`, `modelContract.test.ts`, `StatusChip.tsx`, `ScreenContainer.tsx`, `BrandedScreenHeader.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Spacing` connect `Auth & Onboarding` to `Scan & Analysis Flow`, `Reports & Progress`, `Settings & Navigation`, `Home Screen`, `Symptom Checklist`, `Root Layout`, `AppButton.tsx`, `modelContract.test.ts`, `ScreenContainer.tsx`, `BrandedScreenHeader.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `styles`, `expoDatabase`, `compatibilityDatabase` to the rest of the system?**
  _145 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scan & Analysis Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._
- **Should `Records & Disease Library` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `Reports & Progress` be split into smaller, more focused modules?**
  _Cohesion score 0.13450292397660818 - nodes in this community are weakly interconnected._