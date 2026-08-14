# Graph Report - caneguard-mobile  (2026-08-14)

## Corpus Check
- 197 files · ~82,803 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1105 nodes · 3164 edges · 56 communities (54 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f26c3f04`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- fieldReportReviewRepository.ts
- useTheme
- reports.tsx
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- recordValidation.ts
- preprocessImage.ts
- mobileAuthApi.ts
- detection/types.ts
- field-report.tsx
- fieldReportValidation.ts
- model-debug.tsx
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- schema.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- CaneGuardDatabase
- recordTypes.ts
- model-smoke-test.tsx
- apiClient.ts
- referenceDataTypes.ts
- saveCompletedScan.ts
- image-preview.tsx
- online-map-picker.tsx
- manual-map.tsx
- reportMultipartMapper.ts
- useAuth
- analysis-result.tsx
- compareParityReference.ts
- captureGpsLocation.ts
- reportRepository.ts
- ComponentTokens
- errors.ts
- fieldReportRepository.ts
- MockFile
- image-preview.test.tsx
- analysis-result.test.tsx
- useAuthorityReviewStatus.test.tsx
- FieldReportSyncRepository
- home.tsx
- field-report.test.tsx
- postprocessOutput.ts
- scan.tsx
- reportReviewTypes.ts
- symptom-checklist.tsx
- records.test.tsx
- inferenceErrors.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 116 edges
2. `toStorageError()` - 57 edges
3. `CaneGuardDatabase` - 45 edges
4. `Typography` - 35 edges
5. `Spacing` - 32 edges
6. `useAuth()` - 30 edges
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

## Communities (56 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.15
Nodes (18): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+10 more)

### Community 1 - "fieldReportReviewRepository.ts"
Cohesion: 0.16
Nodes (17): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), openTestDatabase(), readMigration(), ActiveRefresh (+9 more)

### Community 2 - "useTheme"
Cohesion: 0.13
Nodes (20): ReportsScreen(), SectionLabel(), StateCard(), DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow() (+12 more)

### Community 3 - "reports.tsx"
Cohesion: 0.11
Nodes (24): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), styles, BottomNav() (+16 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.12
Nodes (21): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), getFieldReportAction(), ObservationList(), RecordSyncStatus(), Section() (+13 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "Typography"
Cohesion: 0.11
Nodes (19): SplashScreen(), styles, RegisterScreen(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles, AppButton() (+11 more)

### Community 10 - "recordValidation.ts"
Cohesion: 0.40
Nodes (12): createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft(), validateNonNegativeFinite() (+4 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingStage() (+6 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (29): AppNavigator(), styles, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+21 more)

### Community 13 - "detection/types.ts"
Cohesion: 0.15
Nodes (16): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, PickerOutcome, readPickerOutcome() (+8 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.13
Nodes (21): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+13 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.21
Nodes (21): FieldReportSubmissionEvidence, coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeOptionalAffectedArea() (+13 more)

### Community 16 - "model-debug.tsx"
Cohesion: 0.13
Nodes (17): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+9 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "schema.ts"
Cohesion: 0.14
Nodes (17): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+9 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.18
Nodes (6): migration0, migration1, migration2, migration3, migration4, migration5

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.13
Nodes (27): SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+19 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.19
Nodes (13): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256 (+5 more)

### Community 22 - "toStorageError"
Cohesion: 0.18
Nodes (22): toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation() (+14 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.16
Nodes (19): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), deleteScanRecordById() (+11 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 25 - "CaneGuardDatabase"
Cohesion: 0.11
Nodes (36): CaneGuardDatabase, findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed() (+28 more)

### Community 26 - "recordTypes.ts"
Cohesion: 0.17
Nodes (14): SyncStatus, ReportedSeverity, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, QualityWarning, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE (+6 more)

### Community 27 - "model-smoke-test.tsx"
Cohesion: 0.11
Nodes (20): DevelopmentModelSmokeTestScreen(), MetadataRow(), ModelSmokeTestScreen(), styles, mockRun, mockUseCaneGuardModel, IconSize, mockAsset (+12 more)

### Community 28 - "apiClient.ts"
Cohesion: 0.16
Nodes (12): apiBaseUrl, parseApiBaseUrl(), request, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody() (+4 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "saveCompletedScan.ts"
Cohesion: 0.16
Nodes (13): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+5 more)

### Community 31 - "image-preview.tsx"
Cohesion: 0.19
Nodes (11): ImagePreviewScreen(), MetadataRow(), styles, AppCard(), AppCardProps, styles, getSessionStateErrorMessage(), SessionStateError (+3 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "manual-map.tsx"
Cohesion: 0.22
Nodes (11): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), styles (+3 more)

### Community 34 - "reportMultipartMapper.ts"
Cohesion: 0.11
Nodes (20): FieldReportUploadRecord, getSyncErrorMessage(), isAbortError(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), appendNumber() (+12 more)

### Community 35 - "useAuth"
Cohesion: 0.09
Nodes (30): FieldReportScreen(), formatClassLabel(), formatDuration(), formatSavedAt(), RecordDetailsScreen(), DETAILS, mockDatabase, mockDeleteScanRecord (+22 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (11): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+3 more)

### Community 37 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.14
Nodes (15): fieldReports, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, buildDateCondition() (+7 more)

### Community 40 - "ComponentTokens"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 41 - "errors.ts"
Cohesion: 0.21
Nodes (8): DatabaseContextValue, STORAGE_ERROR_CODES, StorageError, USER_MESSAGES, mockOpenDatabaseSync, deleteScanRecord(), DeleteScanRecordResult, CompensationCleanupResult

### Community 42 - "fieldReportRepository.ts"
Cohesion: 0.27
Nodes (12): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FinalizeFieldReportInput (+4 more)

### Community 43 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 45 - "analysis-result.test.tsx"
Cohesion: 0.07
Nodes (33): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+25 more)

### Community 46 - "useAuthorityReviewStatus.test.tsx"
Cohesion: 0.24
Nodes (9): ReportStatusesApiError, hasStaleAuthorityReviewCache(), database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState (+1 more)

### Community 48 - "home.tsx"
Cohesion: 0.18
Nodes (10): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+2 more)

### Community 49 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 50 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 51 - "scan.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 52 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 53 - "symptom-checklist.tsx"
Cohesion: 0.29
Nodes (6): SEVERITIES, styles, SymptomChecklistScreen(), styles, SymptomChecklistItem(), SymptomChecklistItemProps

### Community 55 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 58 - "inferenceErrors.ts"
Cohesion: 0.17
Nodes (9): DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode, CaneGuardModelContext, CaneGuardModelController, ModelRun (+1 more)

## Knowledge Gaps
- **308 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+303 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `manual-map.tsx`, `online-map-picker.tsx`, `useAuth`, `analysis-result.tsx`, `record-details.tsx`, `reports.tsx`, `theme.ts`, `Typography`, `ComponentTokens`, `field-report.tsx`, `home.tsx`, `model-debug.tsx`, `scan.tsx`, `symptom-checklist.tsx`, `records.test.tsx`, `model-smoke-test.tsx`, `image-preview.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `useTheme`, `record-details.tsx`, `theme.ts`, `mobileAuthApi.ts`, `field-report.tsx`, `useAuthorityReviewStatus.test.tsx`, `toStorageError`, `CaneGuardDatabase`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `FieldReportSyncRepository` connect `FieldReportSyncRepository` to `CaneGuardDatabase`, `reportMultipartMapper.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _308 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `reports.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10752688172043011 - nodes in this community are weakly interconnected._