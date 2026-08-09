# Graph Report - caneguard-mobile  (2026-08-10)

## Corpus Check
- 152 files · ~49,727 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 805 nodes · 1933 edges · 41 communities (40 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5d53aac6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- model-debug.tsx
- theme.ts
- useTheme
- symptom-checklist.tsx
- scanRecordWriteRepository.test.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- records.tsx
- schema.ts
- scan.tsx
- preprocessImage.ts
- AuthProvider.tsx
- DatabaseProvider.tsx
- analysis-result.test.tsx
- useFieldReportDraft.ts
- toStorageError
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- home.tsx
- migrations.test.ts
- scanImageStorage.ts
- fieldReportValidation.ts
- storage-debug.tsx
- syncScanRecord.ts
- reports.tsx
- modelContract.ts
- records.test.tsx
- detection/types.ts
- analysis-result.tsx
- image-preview.test.tsx
- scan.test.tsx
- symptom-checklist.test.tsx
- ScanSessionProvider.tsx
- reportRepository.ts
- scanRecordRepository.ts
- useRecords.ts
- recordTypes.ts
- repositoryContracts.ts
- RecordCard.tsx
- readPickerOutcome.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 48 edges
2. `toStorageError()` - 30 edges
3. `Typography` - 23 edges
4. `Spacing` - 20 edges
5. `StorageError` - 18 edges
6. `Radius` - 18 edges
7. `ComponentTokens` - 17 edges
8. `ScanRecordDetails` - 15 edges
9. `getStorageErrorMessage()` - 14 edges
10. `validateCompletedScanDraft()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `DatabaseInitializationView()` --calls--> `getStorageErrorMessage()`  [EXTRACTED]
  src/database/DatabaseProvider.tsx → src/database/errors.ts
- `PaginatedQueryState` --references--> `ScanRecordListItem`  [EXTRACTED]
  src/features/records/hooks/useRecords.ts → src/features/records/domain/recordTypes.ts
- `SplashScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/index.tsx → src/hooks/use-theme.ts
- `DebugRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/model-debug.tsx → src/hooks/use-theme.ts
- `RegisterScreen()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/register.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (41 total, 1 thin omitted)

### Community 0 - "model-debug.tsx"
Cohesion: 0.13
Nodes (17): SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, RegisterScreen() (+9 more)

### Community 1 - "theme.ts"
Cohesion: 0.12
Nodes (18): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseasePill(), DiseasePillProps, DiseasePillVariant (+10 more)

### Community 2 - "useTheme"
Cohesion: 0.14
Nodes (17): styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, AppCard(), AppCardProps, styles, ScreenHeader() (+9 more)

### Community 3 - "symptom-checklist.tsx"
Cohesion: 0.15
Nodes (13): SEVERITIES, styles, DiseaseBadge(), DiseaseBadgeProps, styles, styles, SummaryTile(), SummaryTileProps (+5 more)

### Community 4 - "scanRecordWriteRepository.test.ts"
Cohesion: 0.07
Nodes (44): SelectRowProps, SettingsScreen(), styles, ToggleRowProps, formatDate(), styles, SyncStatusPanel(), useAuth() (+36 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.11
Nodes (16): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getObservationLabel(), RecordDetailsScreen(), styles, DETAILS (+8 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "records.tsx"
Cohesion: 0.17
Nodes (9): FilterKey, FILTERS, styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab (+1 more)

### Community 8 - "schema.ts"
Cohesion: 0.09
Nodes (35): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, fieldReports, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+27 more)

### Community 10 - "scan.tsx"
Cohesion: 0.14
Nodes (16): styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource() (+8 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.07
Nodes (33): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity() (+25 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.15
Nodes (23): CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError(), MobileAuthError (+15 more)

### Community 13 - "DatabaseProvider.tsx"
Cohesion: 0.11
Nodes (23): CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext, DatabaseContextValue (+15 more)

### Community 14 - "analysis-result.test.tsx"
Cohesion: 0.13
Nodes (17): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+9 more)

### Community 15 - "useFieldReportDraft.ts"
Cohesion: 0.22
Nodes (10): FieldReportScreen(), mockRefresh, mockSave, mockUseLocalSearchParams, FieldReportAuthoringState, FieldReportLocationSource, SyncStatus, FieldReport (+2 more)

### Community 16 - "toStorageError"
Cohesion: 0.34
Nodes (11): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), findFieldReportById(), findFieldReportByScanRecordId(), saveFieldReportDraft(), toFieldReport(), openTestDatabase() (+3 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "home.tsx"
Cohesion: 0.09
Nodes (12): DiseaseExample, DISEASES, QuickAction, styles, InputRowProps, styles, DiseaseTokens, Shadows (+4 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.22
Nodes (4): migration0, migration1, migration2, migrationJournal

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (32): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+24 more)

### Community 21 - "fieldReportValidation.ts"
Cohesion: 0.50
Nodes (7): CreateFieldReportDraftInput, invalid(), normalizeFieldReportDraftInput(), normalizeOptionalText(), validateCreateFieldReportDraftInput(), validateUtcTimestamp(), validateUuid()

### Community 22 - "storage-debug.tsx"
Cohesion: 0.32
Nodes (4): DevelopmentStorageDebugScreen(), styles, StorageDiagnostics, useStorageDiagnostics()

### Community 23 - "syncScanRecord.ts"
Cohesion: 0.06
Nodes (28): apiBaseUrl, parseApiBaseUrl(), ScanRecordSyncRepository, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody() (+20 more)

### Community 25 - "reports.tsx"
Cohesion: 0.18
Nodes (7): ClassCount(), getClassPresentation(), styles, mockRefresh, mockRouterPush, SUMMARY, RecordsByLabel

### Community 26 - "modelContract.ts"
Cohesion: 0.06
Nodes (44): formatNumber(), formatScore(), ModelDebugScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockRun (+36 more)

### Community 29 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 30 - "detection/types.ts"
Cohesion: 0.15
Nodes (12): initialScanSessionState, completedResult, InferenceTimings, ScanSessionAction, ScanSessionState, ScanSessionStatus, NOW, mockDatabase (+4 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.31
Nodes (6): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, formatPercentage(), ScoreRow(), styles, useSaveCompletedScan()

### Community 33 - "image-preview.test.tsx"
Cohesion: 0.15
Nodes (11): ImagePreviewScreen(), mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel (+3 more)

### Community 34 - "scan.test.tsx"
Cohesion: 0.22
Nodes (6): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush

### Community 36 - "symptom-checklist.test.tsx"
Cohesion: 0.22
Nodes (7): SymptomChecklistScreen(), completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS

### Community 38 - "ScanSessionProvider.tsx"
Cohesion: 0.39
Nodes (6): ScanSessionContext, ScanSessionContextValue, ScanSessionProvider(), scanSessionReducer(), SessionProbe(), useScanSession()

### Community 39 - "reportRepository.ts"
Cohesion: 0.27
Nodes (9): buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), LocalReportOptions, PROTOTYPE_LOW_SCORE_THRESHOLD, LocalReportState (+1 more)

### Community 40 - "scanRecordRepository.ts"
Cohesion: 0.29
Nodes (8): buildConditions(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), mockDatabase, mockListScanRecords

### Community 44 - "useRecords.ts"
Cohesion: 0.46
Nodes (7): getStorageErrorMessage(), PaginatedQueryState, QueryState, usePaginatedScanRecords(), useScanRecordDetails(), useScanRecords(), useSyncRecordsRefresh()

### Community 45 - "recordTypes.ts"
Cohesion: 0.29
Nodes (10): ClassScore, ReportedSeverity, ScanSourceType, mapScanRecordDetails(), mapScanRecordListItem(), CompletedScanDraft, ScanRecordDetails, ScanRecordListItem (+2 more)

### Community 46 - "repositoryContracts.ts"
Cohesion: 0.23
Nodes (6): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput

### Community 47 - "RecordCard.tsx"
Cohesion: 0.39
Nodes (7): formatSavedAt(), getResultLabel(), getSyncPresentation(), RecordCard(), RecordCardProps, styles, toPillVariant()

## Knowledge Gaps
- **245 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `model-debug.tsx`, `theme.ts`, `symptom-checklist.tsx`, `record-details.tsx`, `records.tsx`, `scan.tsx`, `home.tsx`, `modelContract.ts`, `analysis-result.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `scanRecordWriteRepository.test.ts`, `record-details.tsx`, `reportRepository.ts`, `schema.ts`, `useRecords.ts`, `DatabaseProvider.tsx`, `useFieldReportDraft.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Typography` connect `symptom-checklist.tsx` to `model-debug.tsx`, `theme.ts`, `useTheme`, `record-details.tsx`, `records.tsx`, `scan.tsx`, `home.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `model-debug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._