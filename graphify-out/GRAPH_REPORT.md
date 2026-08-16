# Graph Report - caneguard-mobile  (2026-08-17)

## Corpus Check
- 197 files · ~84,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1111 nodes · 3182 edges · 49 communities (48 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba4f7844`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- postprocessOutput.ts
- reports.tsx
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- settings.tsx
- assessImageQuality.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- useTheme
- fieldReportValidation.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- fieldReportSyncRepository.ts
- recordTypes.ts
- useCaneGuardModel.tsx
- useCaneGuardModel.web.tsx
- referenceDataTypes.ts
- useSaveCompletedScan.ts
- image-preview.tsx
- online-map-picker.tsx
- home.tsx
- detection/types.ts
- useAuth
- analysis-result.tsx
- compareParityReference.ts
- captureGpsLocation.ts
- analysis-result.test.tsx
- image-preview.test.tsx
- symptom-checklist.test.tsx
- useCaneGuardDatabase
- reportRepository.ts
- checklistConsistency.ts
- scan.tsx
- reportReviewTypes.ts
- records.test.tsx
- sessionErrors.ts

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
- `renderPreview()` --calls--> `scanSessionReducer()`  [EXTRACTED]
  src/app/__tests__/image-preview.test.tsx → src/features/detection/context/scanSessionReducer.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (49 total, 1 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.12
Nodes (20): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+12 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.10
Nodes (15): FieldReportSyncRepository, appendMismatchReported(), appendNumber(), appendOptionalText(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies (+7 more)

### Community 2 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 3 - "reports.tsx"
Cohesion: 0.09
Nodes (27): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel() (+19 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.11
Nodes (28): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+20 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.10
Nodes (22): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+14 more)

### Community 8 - "settings.tsx"
Cohesion: 0.12
Nodes (17): SplashScreen(), styles, RegisterScreen(), styles, DisabledRow(), DisabledRowProps, styles, ToggleRow() (+9 more)

### Community 10 - "assessImageQuality.ts"
Cohesion: 0.40
Nodes (4): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, QualityWarning, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 11 - "preprocessImage.ts"
Cohesion: 0.15
Nodes (16): DetectionErrorStage, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError() (+8 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.08
Nodes (34): AppNavigator(), styles, SettingsScreen(), mockLogout, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile() (+26 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "useTheme"
Cohesion: 0.11
Nodes (30): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+22 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.06
Nodes (53): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+45 more)

### Community 16 - "runInference.ts"
Cohesion: 0.14
Nodes (14): ImagePreviewScreen(), ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), getInferenceErrorMessage() (+6 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.17
Nodes (7): migration0, migration1, migration2, migration3, migration4, migration5, migration6

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (36): PickerOutcome, readPickerOutcome(), ScanSourceType, SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput (+28 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.15
Nodes (29): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+21 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.12
Nodes (25): useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), buildConditions() (+17 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (35): apiBaseUrl, parseApiBaseUrl(), assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord() (+27 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.10
Nodes (33): fieldReports, countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+25 more)

### Community 26 - "recordTypes.ts"
Cohesion: 0.19
Nodes (12): SyncStatus, ReportedSeverity, ScanRecordRepository, ScanRecordWriteRepository, RecordsByLabel, SaveCompletedScanInput, ScanRecordDetails, ScanRecordListItem (+4 more)

### Community 27 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 28 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "useSaveCompletedScan.ts"
Cohesion: 0.19
Nodes (10): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+2 more)

### Community 31 - "image-preview.tsx"
Cohesion: 0.09
Nodes (29): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+21 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (21): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+13 more)

### Community 34 - "detection/types.ts"
Cohesion: 0.13
Nodes (19): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanSessionContextValue (+11 more)

### Community 35 - "useAuth"
Cohesion: 0.20
Nodes (14): FieldReportScreen(), DatabaseInitializationView(), getStorageErrorMessage(), useAuth(), MAX_RECORD_PAGE_SIZE, mockDatabase, mockListScanRecords, QueryState (+6 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (10): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+2 more)

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (11): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+3 more)

### Community 45 - "symptom-checklist.test.tsx"
Cohesion: 0.25
Nodes (6): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext

### Community 46 - "useCaneGuardDatabase"
Cohesion: 0.11
Nodes (26): RecordsScreen(), useCaneGuardDatabase(), ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), openTestDatabase() (+18 more)

### Community 47 - "reportRepository.ts"
Cohesion: 0.13
Nodes (18): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition() (+10 more)

### Community 48 - "checklistConsistency.ts"
Cohesion: 0.20
Nodes (11): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken (+3 more)

### Community 51 - "scan.tsx"
Cohesion: 0.16
Nodes (14): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+6 more)

### Community 52 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 55 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 58 - "sessionErrors.ts"
Cohesion: 0.36
Nodes (4): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError

## Knowledge Gaps
- **309 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+304 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `online-map-picker.tsx`, `useAuth`, `analysis-result.tsx`, `record-details.tsx`, `reports.tsx`, `theme.ts`, `settings.tsx`, `mobileAuthApi.ts`, `useCaneGuardDatabase`, `runInference.ts`, `scan.tsx`, `image-preview.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `home.tsx`, `record-details.tsx`, `theme.ts`, `settings.tsx`, `mobileAuthApi.ts`, `useTheme`, `fieldReportValidation.ts`, `useCaneGuardDatabase`, `reportRepository.ts`, `toStorageError`, `fieldReportSyncRepository.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useAuth`, `record-details.tsx`, `useTheme`, `useCaneGuardDatabase`, `reportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `fieldReportSyncRepository.ts`, `useSaveCompletedScan.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _309 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._
- **Should `reports.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0944741532976827 - nodes in this community are weakly interconnected._