# Graph Report - caneguard-mobile  (2026-08-22)

## Corpus Check
- 199 files · ~86,092 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1122 nodes · 3212 edges · 52 communities (50 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1cc145d3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- settings.tsx
- reports.tsx
- global.d.ts
- useAuth
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- apiClient.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- field-report.tsx
- fieldReportRepository.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- SyncProvider.tsx
- record-details.tsx
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- detection/types.ts
- image-preview.tsx
- online-map-picker.tsx
- useTheme
- scan.test.tsx
- FieldReportSyncRepository
- analysis-result.tsx
- fieldReportReviewRepository.ts
- captureGpsLocation.ts
- recordTypes.ts
- analysis-result.test.tsx
- fieldReportSyncRepository.ts
- useCaneGuardModel.tsx
- symptom-checklist.tsx
- register.tsx
- image-preview.test.tsx
- compareParityReference.ts
- reportRepository.ts
- assessImageQuality.ts
- records.test.tsx
- diseaseCatalog.ts
- records.tsx

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
- `ReporterMismatchSection()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (52 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.11
Nodes (23): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.18
Nodes (15): FieldReportUploadRecord, appendMismatchReported(), appendNumber(), appendOptionalText(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies (+7 more)

### Community 2 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 3 - "reports.tsx"
Cohesion: 0.09
Nodes (24): ClassCount(), getClassPresentation(), SectionLabel(), StateCard(), styles, BottomNavProps, NAV_ITEMS, NavItem (+16 more)

### Community 5 - "useAuth"
Cohesion: 0.14
Nodes (22): FieldReportScreen(), RecordsScreen(), DatabaseInitializationView(), useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), mockDatabase, mockListScanRecords (+14 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "Typography"
Cohesion: 0.11
Nodes (19): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+11 more)

### Community 10 - "apiClient.ts"
Cohesion: 0.17
Nodes (11): MOBILE_REPORT_STATUSES_V1_FIXTURE, request, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+3 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingStage() (+6 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (29): AppNavigator(), styles, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+21 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.29
Nodes (14): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.10
Nodes (30): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+22 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.08
Nodes (46): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+38 more)

### Community 16 - "runInference.ts"
Cohesion: 0.13
Nodes (12): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), normalizeScores(), PostprocessedOutput (+4 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.18
Nodes (13): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS (+5 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.17
Nodes (7): migration0, migration1, migration2, migration3, migration4, migration5, migration6

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (35): PickerOutcome, readPickerOutcome(), ScanSourceType, SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CopyScanImageInput, copyScanImageToManagedStorage() (+27 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.18
Nodes (24): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture() (+16 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.18
Nodes (17): buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), insertScanRecord() (+9 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.11
Nodes (28): apiBaseUrl, parseApiBaseUrl(), assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord() (+20 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.14
Nodes (22): findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), SYNC_RETRY_COOLDOWN_MS, getSessionKey(), isNetworkOnline(), isSameSession(), SyncContext, SyncContextValue (+14 more)

### Community 26 - "record-details.tsx"
Cohesion: 0.12
Nodes (22): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+14 more)

### Community 27 - "schema.ts"
Cohesion: 0.11
Nodes (23): useDatabaseState(), FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, fieldReports, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow (+15 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.13
Nodes (11): SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode, CaneGuardModelContext (+3 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "detection/types.ts"
Cohesion: 0.15
Nodes (15): initialScanSessionState, completedResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, mockDatabase, mockRandomUUID (+7 more)

### Community 31 - "image-preview.tsx"
Cohesion: 0.09
Nodes (28): ImagePreviewScreen(), MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber() (+20 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "useTheme"
Cohesion: 0.14
Nodes (20): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+12 more)

### Community 34 - "scan.test.tsx"
Cohesion: 0.17
Nodes (13): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanSessionContext (+5 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (10): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+2 more)

### Community 37 - "fieldReportReviewRepository.ts"
Cohesion: 0.16
Nodes (16): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), openTestDatabase(), readMigration(), ActiveRefresh, activeRefreshes (+8 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "recordTypes.ts"
Cohesion: 0.17
Nodes (13): SyncStatus, QualityWarning, ScanRecordRepository, ScanRecordWriteRepository, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE, RecordsByLabel, SaveCompletedScanInput (+5 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.12
Nodes (20): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+12 more)

### Community 41 - "fieldReportSyncRepository.ts"
Cohesion: 0.23
Nodes (14): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+6 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "symptom-checklist.tsx"
Cohesion: 0.16
Nodes (11): SEVERITIES, styles, SymptomChecklistScreen(), completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace (+3 more)

### Community 44 - "register.tsx"
Cohesion: 0.19
Nodes (9): RegisterScreen(), styles, ScreenContainer(), ScreenContainerProps, styles, styles, TextField(), TextFieldProps (+1 more)

### Community 45 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (11): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+3 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "reportRepository.ts"
Cohesion: 0.13
Nodes (20): ReportsScreen(), mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition() (+12 more)

### Community 48 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 49 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 50 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 51 - "records.tsx"
Cohesion: 0.11
Nodes (20): SplashScreen(), styles, FilterKey, FILTERS, StateCard(), styles, ActiveOperation, clearPendingSource() (+12 more)

## Knowledge Gaps
- **313 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+308 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `online-map-picker.tsx`, `settings.tsx`, `reports.tsx`, `analysis-result.tsx`, `useAuth`, `theme.ts`, `Typography`, `symptom-checklist.tsx`, `register.tsx`, `field-report.tsx`, `reportRepository.ts`, `records.tsx`, `record-details.tsx`, `image-preview.tsx`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `useTheme`, `settings.tsx`, `theme.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `reportRepository.ts`, `toStorageError`, `SyncProvider.tsx`, `record-details.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useAuth`, `fieldReportReviewRepository.ts`, `fieldReportSyncRepository.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `reportRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `SyncProvider.tsx`, `record-details.tsx`, `detection/types.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _313 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10695187165775401 - nodes in this community are weakly interconnected._
- **Should `reports.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09462365591397849 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.14022988505747128 - nodes in this community are weakly interconnected._