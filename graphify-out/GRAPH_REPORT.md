# Graph Report - caneguard-mobile  (2026-08-26)

## Corpus Check
- 207 files · ~96,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1263 nodes · 3600 edges · 58 communities (56 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cdb5320f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- fieldReportSyncRepository.ts
- reportMultipartMapper.ts
- Typography
- fieldReportReviewRepository.ts
- global.d.ts
- postprocessOutput.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- model-debug.tsx
- getManagedScanImageDirectory
- preprocessImage.ts
- useAuth
- recordValidation.ts
- field-report.tsx
- fieldReportValidation.ts
- diseaseCatalog.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- errors.ts
- submissionImageStorage.ts
- SyncProvider.tsx
- record-details.tsx
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- useTheme
- online-map-picker.tsx
- home.tsx
- model-debug.test.tsx
- syncFieldReport.ts
- analysis-result.tsx
- mobileReportStatusesApi.ts
- useFieldReportDraft.test.tsx
- reportRepository.ts
- analysis-result.test.tsx
- scan.test.tsx
- useCaneGuardModel.tsx
- useRecords.ts
- image-preview.test.tsx
- compareParityReference.ts
- runInference
- CaneGuardDatabase
- assessImageQuality.ts
- records.tsx
- detection/types.ts
- submissionImageStorage.test.ts
- MockFile
- apiClient.ts
- syncPendingFieldReports.ts
- mobileReportStatusesApi.test.ts
- recordTypes.ts
- env.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 59 edges
3. `CaneGuardDatabase` - 47 edges
4. `useAuth()` - 37 edges
5. `Typography` - 35 edges
6. `Spacing` - 32 edges
7. `StorageError` - 32 edges
8. `Radius` - 28 edges
9. `FieldReport` - 24 edges
10. `ComponentTokens` - 23 edges

## Surprising Connections (you probably didn't know these)
- `renderScan()` --calls--> `scanSessionReducer()`  [EXTRACTED]
  src/app/__tests__/scan.test.tsx → src/features/detection/context/scanSessionReducer.ts
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

## Communities (58 total, 2 thin omitted)

### Community 0 - "fieldReportSyncRepository.ts"
Cohesion: 0.21
Nodes (16): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+8 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (55): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+47 more)

### Community 2 - "Typography"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.27
Nodes (8): fieldReports, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), openTestDatabase(), readMigration()

### Community 5 - "postprocessOutput.ts"
Cohesion: 0.43
Nodes (4): normalizeScores(), PostprocessedOutput, softmax(), DetectionResult

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "model-debug.tsx"
Cohesion: 0.07
Nodes (36): styles, DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+28 more)

### Community 10 - "getManagedScanImageDirectory"
Cohesion: 0.60
Nodes (5): getManagedScanImageDirectory(), copyLegacySourceToCanonical(), isCanonicalManagedSourceUri(), prepareDerivativeFromManagedSource(), removeStagedSource()

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "useAuth"
Cohesion: 0.07
Nodes (45): HomeScreen(), AppNavigator(), styles, SettingsScreen(), AuthenticatedHomeRoute(), fetchMock, mockSession, mockRouterPush (+37 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.32
Nodes (14): getChecklistConsistency(), MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores() (+6 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.14
Nodes (18): AuthorityReviewSection(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatTimestamp() (+10 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.05
Nodes (62): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+54 more)

### Community 16 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.33
Nodes (7): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError()

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (34): assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+26 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (10): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+2 more)

### Community 22 - "toStorageError"
Cohesion: 0.23
Nodes (22): toStorageError(), persistSubmissionImageMetadata(), compensateManagedImageCopy(), deleteManagedScanImage(), getSubmissionImageUri(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport() (+14 more)

### Community 23 - "errors.ts"
Cohesion: 0.09
Nodes (29): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+21 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.15
Nodes (25): toPersistenceInput(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES, persistCandidate(), PreparedSubmissionImage (+17 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.23
Nodes (11): findLastSuccessfulFieldReportSyncAt(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), SyncContext, SyncProvider() (+3 more)

### Community 26 - "record-details.tsx"
Cohesion: 0.10
Nodes (29): AutomaticSummaryCard(), InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt() (+21 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (25): useDatabaseState(), FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow (+17 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.12
Nodes (14): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+6 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "useTheme"
Cohesion: 0.10
Nodes (28): SplashScreen(), DebugRow(), ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel(), StateCard(), styles (+20 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.12
Nodes (20): QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle(), styles (+12 more)

### Community 34 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 35 - "syncFieldReport.ts"
Cohesion: 0.13
Nodes (4): FieldReportSyncRepository, RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 36 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (26): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, MetadataRow() (+18 more)

### Community 37 - "mobileReportStatusesApi.ts"
Cohesion: 0.07
Nodes (44): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, assertContinuationCheckpoint() (+36 more)

### Community 38 - "useFieldReportDraft.test.tsx"
Cohesion: 0.10
Nodes (17): GpsCaptureUnavailableReason, DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft (+9 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.11
Nodes (19): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, ScanRecordRepository, DateRange, LocalReportSummary, buildDateCondition() (+11 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "scan.test.tsx"
Cohesion: 0.17
Nodes (9): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), supportedImageFormats (+1 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.14
Nodes (15): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+7 more)

### Community 43 - "useRecords.ts"
Cohesion: 0.14
Nodes (20): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), SyncStatus, MAX_RECORD_PAGE_SIZE, ScanRecordListItem, ScanRecordQuery, mockDatabase (+12 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.10
Nodes (24): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+16 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 48 - "runInference"
Cohesion: 0.22
Nodes (4): ImagePreviewScreen(), postprocessOutput(), InferenceRunner, runInference()

### Community 49 - "CaneGuardDatabase"
Cohesion: 0.23
Nodes (15): CaneGuardDatabase, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords() (+7 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.50
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "records.tsx"
Cohesion: 0.15
Nodes (13): FilterKey, FILTERS, StateCard(), styles, BottomNav(), BottomNavProps, NAV_ITEMS, NavItem (+5 more)

### Community 52 - "detection/types.ts"
Cohesion: 0.19
Nodes (9): ChecklistObservationId, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW, mockDatabase, mockRandomUUID (+1 more)

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.13
Nodes (6): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata

### Community 59 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 61 - "apiClient.ts"
Cohesion: 0.22
Nodes (12): ApiHttpError, apiRequest(), createAbortError(), DEFAULT_API_TIMEOUT_MS, normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+4 more)

### Community 63 - "syncPendingFieldReports.ts"
Cohesion: 0.14
Nodes (16): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch() (+8 more)

### Community 65 - "recordTypes.ts"
Cohesion: 0.28
Nodes (12): ChecklistConsistency, MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning (+4 more)

### Community 66 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

## Knowledge Gaps
- **343 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `home.tsx`, `Typography`, `analysis-result.tsx`, `mobileReportStatusesApi.ts`, `theme.ts`, `model-debug.tsx`, `useRecords.ts`, `useAuth`, `field-report.tsx`, `runInference`, `records.tsx`, `errors.ts`, `record-details.tsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldReportSyncRepository.ts`, `fieldReportReviewRepository.ts`, `mobileReportStatusesApi.ts`, `reportRepository.ts`, `useRecords.ts`, `field-report.tsx`, `CaneGuardDatabase`, `scanImageStorage.ts`, `errors.ts`, `SyncProvider.tsx`, `record-details.tsx`, `schema.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `home.tsx`, `mobileReportStatusesApi.ts`, `useFieldReportDraft.test.tsx`, `theme.ts`, `model-debug.tsx`, `reportRepository.ts`, `useRecords.ts`, `field-report.tsx`, `fieldReportValidation.ts`, `toStorageError`, `SyncProvider.tsx`, `record-details.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07005649717514124 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `model-debug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0726950354609929 - nodes in this community are weakly interconnected._