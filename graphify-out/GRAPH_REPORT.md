# Graph Report - caneguard-mobile  (2026-08-16)

## Corpus Check
- 197 files · ~82,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1106 nodes · 3171 edges · 55 communities (53 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8578816c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- refreshAuthorityReviewStatus.ts
- settings.tsx
- useTheme
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- assessImageQuality.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- field-report.tsx
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
- apiClient.ts
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
- reportRepository.ts
- analysis-result.test.tsx
- errors.ts
- scan.test.tsx
- useFieldReportDraft.test.tsx
- image-preview.test.tsx
- symptom-checklist.test.tsx
- fieldReportReviewRepository.ts
- reports.test.tsx
- checklistConsistency.ts
- diseaseCatalog.ts
- env.ts
- scan.tsx
- reportReviewTypes.ts
- records.test.tsx
- inferenceErrors.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 116 edges
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
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (55 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.13
Nodes (17): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+9 more)

### Community 1 - "refreshAuthorityReviewStatus.ts"
Cohesion: 0.20
Nodes (12): applyAuthorityReviewUpdates(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), ActiveRefresh, activeRefreshes, AuthorityReviewRefreshResult, executeRefresh(), getOverlappedUpdatedAfter() (+4 more)

### Community 2 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 3 - "useTheme"
Cohesion: 0.10
Nodes (30): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel() (+22 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.10
Nodes (28): AutomaticSummaryCard(), InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt() (+20 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.10
Nodes (22): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+14 more)

### Community 8 - "Typography"
Cohesion: 0.13
Nodes (16): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+8 more)

### Community 10 - "assessImageQuality.ts"
Cohesion: 0.25
Nodes (5): getQualityWarningMessage(), ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, QualityWarning, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (29): AppNavigator(), styles, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+21 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.15
Nodes (18): AuthorityReviewSection(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatTimestamp() (+10 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.08
Nodes (44): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+36 more)

### Community 16 - "runInference.ts"
Cohesion: 0.13
Nodes (12): ImagePreviewScreen(), formatNumber(), formatScore(), ModelDebugScreen(), asInferenceError(), getInferenceErrorMessage(), normalizeScores(), PostprocessedOutput (+4 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.18
Nodes (6): migration0, migration1, migration2, migration3, migration4, migration5

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.07
Nodes (36): PickerOutcome, readPickerOutcome(), ScanSourceType, SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput (+28 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.26
Nodes (19): CaneGuardDatabase, toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+11 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.14
Nodes (22): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+14 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.05
Nodes (52): countUnsyncedFieldReports(), createFieldReportSyncRepository(), FieldReportSyncRepository, FieldReportUploadRecord, findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending() (+44 more)

### Community 26 - "recordTypes.ts"
Cohesion: 0.17
Nodes (13): SyncStatus, ReportedSeverity, ScanRecordRepository, ScanRecordWriteRepository, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE, RecordsByLabel, SaveCompletedScanInput (+5 more)

### Community 27 - "useCaneGuardModel.tsx"
Cohesion: 0.11
Nodes (18): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel (+10 more)

### Community 28 - "apiClient.ts"
Cohesion: 0.20
Nodes (10): request, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage(), MobileReportResponse (+2 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "useSaveCompletedScan.ts"
Cohesion: 0.19
Nodes (10): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+2 more)

### Community 31 - "image-preview.tsx"
Cohesion: 0.09
Nodes (27): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, DevelopmentModelSmokeTestScreen() (+19 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (21): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+13 more)

### Community 34 - "detection/types.ts"
Cohesion: 0.21
Nodes (10): initialScanSessionState, completedResult, DetectionResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW (+2 more)

### Community 35 - "useAuth"
Cohesion: 0.18
Nodes (17): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+9 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (10): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+2 more)

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.36
Nodes (7): fieldReports, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), PROTOTYPE_LOW_SCORE_THRESHOLD

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "errors.ts"
Cohesion: 0.15
Nodes (13): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, DatabaseContextValue (+5 more)

### Community 42 - "scan.test.tsx"
Cohesion: 0.20
Nodes (9): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+1 more)

### Community 43 - "useFieldReportDraft.test.tsx"
Cohesion: 0.18
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 45 - "symptom-checklist.test.tsx"
Cohesion: 0.18
Nodes (10): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext, ScanSessionContextValue, ScanSessionProvider() (+2 more)

### Community 46 - "fieldReportReviewRepository.ts"
Cohesion: 0.16
Nodes (14): ReportStatusesApiError, ApplyAuthorityReviewResult, findLastAuthorityReviewFetchedAt(), hasStaleAuthorityReviewCache(), openTestDatabase(), readMigration(), database, hasStaleCache (+6 more)

### Community 47 - "reports.test.tsx"
Cohesion: 0.20
Nodes (8): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, LocalReportOptions, LocalReportState

### Community 48 - "checklistConsistency.ts"
Cohesion: 0.33
Nodes (8): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, CompletedScanDraft

### Community 49 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 51 - "scan.tsx"
Cohesion: 0.16
Nodes (14): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+6 more)

### Community 52 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 55 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 58 - "inferenceErrors.ts"
Cohesion: 0.13
Nodes (12): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode (+4 more)

## Knowledge Gaps
- **308 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+303 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `settings.tsx`, `useAuth`, `analysis-result.tsx`, `record-details.tsx`, `online-map-picker.tsx`, `theme.ts`, `Typography`, `field-report.tsx`, `runInference.ts`, `scan.tsx`, `records.test.tsx`, `image-preview.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `refreshAuthorityReviewStatus.ts`, `useAuth`, `record-details.tsx`, `reportRepository.ts`, `errors.ts`, `field-report.tsx`, `fieldReportReviewRepository.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `fieldReportSyncRepository.ts`, `useSaveCompletedScan.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _308 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.1021021021021021 - nodes in this community are weakly interconnected._
- **Should `record-details.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1032258064516129 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._