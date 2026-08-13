# Graph Report - caneguard-mobile  (2026-08-14)

## Corpus Check
- 183 files · ~73,741 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1030 nodes · 2962 edges · 65 communities (60 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e747faf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- useAuth
- settings.tsx
- records.tsx
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- useTheme
- recordValidation.ts
- preprocessImage.ts
- mobileAuthApi.ts
- detection/types.ts
- field-report.tsx
- fieldReportValidation.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- fieldReportRepository.ts
- CaneGuardDatabase
- mobileReportStatusesApi.ts
- fieldReportSyncRepository.ts
- recordTypes.ts
- useCaneGuardModel.tsx
- apiClient.ts
- record-details.test.tsx
- useSaveCompletedScan.ts
- analysis-result.tsx
- online-map-picker.tsx
- manual-map.tsx
- reportMultipartMapper.ts
- toStorageError
- assessImageQuality.ts
- compareParityReference.ts
- captureGpsLocation.ts
- reportRepository.ts
- Typography
- reports.tsx
- fieldReportTypes.ts
- analysis-result.test.tsx
- image-preview.test.tsx
- scan.test.tsx
- sessionErrors.ts
- FieldReportSyncRepository
- home.tsx
- field-report.test.tsx
- syncPendingFieldReports.test.ts
- _layout.tsx
- reportReviewTypes.ts
- syncPendingFieldReports.ts
- useFieldReportDraft.test.tsx
- records.test.tsx
- symptom-checklist.test.tsx
- syncFieldReport.ts
- useCaneGuardModel.web.tsx
- model-debug.test.tsx
- checklistConsistency.ts
- diseaseCatalog.ts
- env.ts
- readPickerOutcome.ts
- assessImageQuality

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 108 edges
2. `toStorageError()` - 57 edges
3. `CaneGuardDatabase` - 45 edges
4. `Typography` - 33 edges
5. `Spacing` - 30 edges
6. `useAuth()` - 30 edges
7. `StorageError` - 28 edges
8. `Radius` - 26 edges
9. `useCaneGuardDatabase()` - 22 edges
10. `FieldReport` - 22 edges

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

## Communities (65 total, 5 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.11
Nodes (23): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 1 - "useAuth"
Cohesion: 0.10
Nodes (28): fieldReports, useAuth(), ReportStatusesApiError, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache() (+20 more)

### Community 2 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 3 - "records.tsx"
Cohesion: 0.15
Nodes (13): FilterKey, FILTERS, StateCard(), styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem (+5 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.09
Nodes (29): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+21 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.09
Nodes (27): InputRow(), InputRowProps, LoginScreen(), styles, MetadataRow(), styles, styles, ThemedText() (+19 more)

### Community 8 - "useTheme"
Cohesion: 0.14
Nodes (21): SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+13 more)

### Community 10 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+6 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.16
Nodes (23): CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError(), MobileAuthError (+15 more)

### Community 13 - "detection/types.ts"
Cohesion: 0.22
Nodes (9): initialScanSessionState, completedResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW, MANAGED_IMAGE (+1 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.26
Nodes (11): AuthorityReviewSection(), canUseManualMap(), DraftFields(), EvidenceRow(), FinalizedReportSummary(), formatTimestamp(), getGpsPresentation(), InheritedScanEvidence() (+3 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.33
Nodes (14): coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeOptionalText(), validateCoordinates() (+6 more)

### Community 16 - "runInference.ts"
Cohesion: 0.14
Nodes (13): DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores(), PostprocessedOutput (+5 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.20
Nodes (5): migration0, migration1, migration2, migration3, migration4

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.08
Nodes (30): assertManagedScanImageUri(), compensateManagedImageCopy(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+22 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "fieldReportRepository.ts"
Cohesion: 0.22
Nodes (17): createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation() (+9 more)

### Community 23 - "CaneGuardDatabase"
Cohesion: 0.14
Nodes (25): CaneGuardDatabase, scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition() (+17 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.24
Nodes (18): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+10 more)

### Community 26 - "recordTypes.ts"
Cohesion: 0.23
Nodes (15): SyncStatus, ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, CompletedScanDraft (+7 more)

### Community 27 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 28 - "apiClient.ts"
Cohesion: 0.23
Nodes (7): request, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage()

### Community 29 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 30 - "useSaveCompletedScan.ts"
Cohesion: 0.19
Nodes (10): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+2 more)

### Community 31 - "analysis-result.tsx"
Cohesion: 0.10
Nodes (30): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+22 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "manual-map.tsx"
Cohesion: 0.22
Nodes (11): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), styles (+3 more)

### Community 34 - "reportMultipartMapper.ts"
Cohesion: 0.21
Nodes (11): FieldReportUploadRecord, appendNumber(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateReport(), map() (+3 more)

### Community 35 - "toStorageError"
Cohesion: 0.24
Nodes (14): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError(), MAX_RECORD_PAGE_SIZE, mockDatabase, mockListScanRecords, QueryState (+6 more)

### Community 36 - "assessImageQuality.ts"
Cohesion: 0.40
Nodes (4): getQualityWarningMessage(), ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.22
Nodes (7): captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.10
Nodes (21): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary (+13 more)

### Community 40 - "Typography"
Cohesion: 0.12
Nodes (14): RegisterScreen(), styles, DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps (+6 more)

### Community 41 - "reports.tsx"
Cohesion: 0.16
Nodes (12): ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles, ProgressBar(), ProgressBarProps (+4 more)

### Community 42 - "fieldReportTypes.ts"
Cohesion: 0.22
Nodes (12): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FieldReportSubmissionEvidence (+4 more)

### Community 43 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 45 - "scan.test.tsx"
Cohesion: 0.15
Nodes (13): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+5 more)

### Community 46 - "sessionErrors.ts"
Cohesion: 0.36
Nodes (3): SessionStateError, SessionStateErrorCode, DetectionError

### Community 48 - "home.tsx"
Cohesion: 0.18
Nodes (10): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+2 more)

### Community 49 - "field-report.test.tsx"
Cohesion: 0.17
Nodes (10): mockCaptureLocation, mockFinalize, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation, mockScan, mockSyncNow (+2 more)

### Community 50 - "syncPendingFieldReports.test.ts"
Cohesion: 0.20
Nodes (9): getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), database, findSyncCandidates (+1 more)

### Community 51 - "_layout.tsx"
Cohesion: 0.20
Nodes (6): AppNavigator(), styles, ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), ThemeScheme

### Community 52 - "reportReviewTypes.ts"
Cohesion: 0.25
Nodes (9): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewSnapshot, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus (+1 more)

### Community 53 - "syncPendingFieldReports.ts"
Cohesion: 0.27
Nodes (9): SyncContextValue, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, executeBatch(), SyncBatchResult, SyncPendingFieldReportsOptions (+1 more)

### Community 54 - "useFieldReportDraft.test.tsx"
Cohesion: 0.22
Nodes (7): DATABASE, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, ScanProps

### Community 55 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 56 - "symptom-checklist.test.tsx"
Cohesion: 0.25
Nodes (6): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext

### Community 57 - "syncFieldReport.ts"
Cohesion: 0.36
Nodes (5): MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions

### Community 58 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 59 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 60 - "checklistConsistency.ts"
Cohesion: 0.47
Nodes (4): ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase

### Community 61 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

## Knowledge Gaps
- **296 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `manual-map.tsx`, `settings.tsx`, `toStorageError`, `records.tsx`, `record-details.tsx`, `online-map-picker.tsx`, `theme.ts`, `Typography`, `reports.tsx`, `field-report.tsx`, `home.tsx`, `records.test.tsx`, `analysis-result.tsx`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useAuth`, `record-details.tsx`, `reportRepository.ts`, `field-report.tsx`, `scanImageStorage.ts`, `fieldReportRepository.ts`, `CaneGuardDatabase`, `fieldReportSyncRepository.ts`, `useSaveCompletedScan.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `settings.tsx`, `toStorageError`, `record-details.tsx`, `theme.ts`, `reportRepository.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `_layout.tsx`, `useFieldReportDraft.test.tsx`, `fieldReportRepository.ts`, `fieldReportSyncRepository.ts`, `record-details.test.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11092436974789915 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.1021021021021021 - nodes in this community are weakly interconnected._
- **Should `record-details.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0946969696969697 - nodes in this community are weakly interconnected._