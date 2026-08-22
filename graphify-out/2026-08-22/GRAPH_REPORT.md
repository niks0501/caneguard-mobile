# Graph Report - caneguard-mobile  (2026-08-19)

## Corpus Check
- 198 files · ~85,795 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1120 nodes · 3209 edges · 42 communities (39 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ff11246`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- useTheme
- records.tsx
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- syncFieldReport.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- field-report.tsx
- schema.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- fieldReportSyncRepository.ts
- syncPendingFieldReports.ts
- useCaneGuardModel.web.tsx
- referenceDataTypes.ts
- saveCompletedScan.ts
- use-theme.ts
- online-map-picker.tsx
- home.tsx
- detection/types.ts
- FieldReportSyncRepository
- analysis-result.tsx
- readPickerOutcome.ts
- captureGpsLocation.ts
- analysis-result.test.tsx
- reportRepository.ts
- recordTypes.ts
- scan.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 57 edges
3. `CaneGuardDatabase` - 45 edges
4. `Typography` - 35 edges
5. `Spacing` - 32 edges
6. `useAuth()` - 32 edges
7. `StorageError` - 29 edges
8. `Radius` - 28 edges
9. `ComponentTokens` - 23 edges
10. `FieldReport` - 23 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `ReporterMismatchSection()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (42 total, 3 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.10
Nodes (25): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+17 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.19
Nodes (14): FieldReportUploadRecord, appendMismatchReported(), appendNumber(), appendOptionalText(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies (+6 more)

### Community 2 - "useTheme"
Cohesion: 0.09
Nodes (30): MetadataRow(), DebugRow(), MetadataRow(), ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard() (+22 more)

### Community 3 - "records.tsx"
Cohesion: 0.11
Nodes (20): firstParam(), getInitialCenter(), ManualMapScreen(), styles, FilterKey, FILTERS, StateCard(), styles (+12 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.05
Nodes (56): FieldReportScreen(), AppNavigator(), styles, CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration() (+48 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.11
Nodes (18): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+10 more)

### Community 8 - "Typography"
Cohesion: 0.10
Nodes (19): RegisterScreen(), styles, DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps (+11 more)

### Community 10 - "syncFieldReport.ts"
Cohesion: 0.14
Nodes (13): request, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage(), MobileReportResponse (+5 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.09
Nodes (25): SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison (+17 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.16
Nodes (23): CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError(), MobileAuthError (+15 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.10
Nodes (30): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+22 more)

### Community 15 - "schema.ts"
Cohesion: 0.05
Nodes (64): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+56 more)

### Community 16 - "runInference.ts"
Cohesion: 0.11
Nodes (17): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+9 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.20
Nodes (12): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), syncFieldReport() (+4 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.17
Nodes (7): migration0, migration1, migration2, migration3, migration4, migration5, migration6

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.08
Nodes (31): SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+23 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.09
Nodes (27): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+19 more)

### Community 22 - "toStorageError"
Cohesion: 0.14
Nodes (30): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+22 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.13
Nodes (23): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+15 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.07
Nodes (47): apiBaseUrl, parseApiBaseUrl(), assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord() (+39 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.21
Nodes (20): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+12 more)

### Community 27 - "syncPendingFieldReports.ts"
Cohesion: 0.20
Nodes (11): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, MAX_SYNC_REPORTS_PER_RUN, SyncBatchResult (+3 more)

### Community 28 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "saveCompletedScan.ts"
Cohesion: 0.17
Nodes (12): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan(), toPersistenceInput() (+4 more)

### Community 31 - "use-theme.ts"
Cohesion: 0.10
Nodes (31): ImagePreviewScreen(), styles, SplashScreen(), styles, DebugRun, Fixture, FIXTURES, formatNumber() (+23 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.13
Nodes (17): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+9 more)

### Community 34 - "detection/types.ts"
Cohesion: 0.08
Nodes (36): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+28 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (10): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+2 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 47 - "reportRepository.ts"
Cohesion: 0.10
Nodes (21): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary (+13 more)

### Community 48 - "recordTypes.ts"
Cohesion: 0.19
Nodes (16): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity (+8 more)

### Community 51 - "scan.tsx"
Cohesion: 0.16
Nodes (14): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+6 more)

## Knowledge Gaps
- **313 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+308 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `online-map-picker.tsx`, `records.tsx`, `analysis-result.tsx`, `record-details.tsx`, `theme.ts`, `Typography`, `field-report.tsx`, `scan.tsx`, `use-theme.ts`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `record-details.tsx` to `home.tsx`, `useTheme`, `theme.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `reportRepository.ts`, `toStorageError`, `fieldReportSyncRepository.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `record-details.tsx`, `field-report.tsx`, `reportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `mobileReportStatusesApi.ts`, `fieldReportSyncRepository.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _313 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1021021021021021 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.09243697478991597 - nodes in this community are weakly interconnected._
- **Should `records.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._