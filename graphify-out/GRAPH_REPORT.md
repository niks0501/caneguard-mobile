# Graph Report - caneguard-mobile  (2026-08-28)

## Corpus Check
- 212 files · ~96,431 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1273 nodes · 3584 edges · 62 communities (61 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `811b2bd5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- fieldReportSyncRepository.ts
- reportMultipartMapper.ts
- Typography
- fieldReportReviewRepository.ts
- global.d.ts
- DatabaseProvider.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- image-preview.tsx
- fieldReportRepository.ts
- preprocessImage.ts
- AuthProvider.tsx
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
- CaneGuardDatabase
- submissionImageStorage.ts
- SyncProvider.tsx
- record-details.tsx
- schema.ts
- sessionErrors.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- useTheme
- online-map-picker.tsx
- home.tsx
- model-debug.test.tsx
- syncFieldReport.ts
- scan.tsx
- mobileReportStatusesApi.ts
- captureGpsLocation.ts
- reportRepository.ts
- field-report.test.tsx
- analysis-result.tsx
- useCaneGuardModel.tsx
- useAuth
- detection/types.ts
- useFieldReportDraft.test.tsx
- compareParityReference.ts
- reportReviewTypes.ts
- runInference.ts
- scanRecordRepository.ts
- assessImageQuality.ts
- ActivityScreen.tsx
- checklistConsistency.ts
- activity.test.tsx
- records.test.tsx
- activityTypes.ts
- useCaneGuardModel.web.tsx
- submissionImageStorage.test.ts
- MockFile
- apiClient.ts
- syncPendingFieldReports.ts
- recordTypes.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 112 edges
2. `toStorageError()` - 59 edges
3. `CaneGuardDatabase` - 47 edges
4. `useAuth()` - 37 edges
5. `Typography` - 34 edges
6. `StorageError` - 32 edges
7. `Spacing` - 31 edges
8. `Radius` - 27 edges
9. `FieldReport` - 24 edges
10. `ComponentTokens` - 22 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedHomeRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/__tests__/auth-bootstrap.test.tsx → src/features/auth/hooks/useAuth.ts
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

## Communities (62 total, 1 thin omitted)

### Community 0 - "fieldReportSyncRepository.ts"
Cohesion: 0.24
Nodes (13): findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+5 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (56): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+48 more)

### Community 2 - "Typography"
Cohesion: 0.11
Nodes (16): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+8 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.16
Nodes (17): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), openTestDatabase(), readMigration(), ActiveRefresh (+9 more)

### Community 5 - "DatabaseProvider.tsx"
Cohesion: 0.12
Nodes (20): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+12 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.11
Nodes (20): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+12 more)

### Community 8 - "image-preview.tsx"
Cohesion: 0.07
Nodes (39): ImagePreviewScreen(), MetadataRow(), styles, SplashScreen(), styles, DebugRow(), DebugRun, Fixture (+31 more)

### Community 10 - "fieldReportRepository.ts"
Cohesion: 0.15
Nodes (22): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, persistSubmissionImageMetadata(), getSubmissionImageUri(), PreparedSubmissionImage, SubmissionImagePreparationInput (+14 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.08
Nodes (39): AppNavigator(), styles, AuthenticatedHomeRoute(), fetchMock, mockSession, AuthRequestKind, CurrentUserResponse, isAbortError() (+31 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.35
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.16
Nodes (18): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+10 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.20
Nodes (22): FieldReportSubmissionEvidence, coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported() (+14 more)

### Community 16 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.29
Nodes (8): AUTO_RETRYABLE_SYNC_ERROR_CODES, getSyncErrorMessage(), isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError()

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (35): assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+27 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.41
Nodes (12): toStorageError(), createOrGetFieldReportDraft(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation(), toFieldReport() (+4 more)

### Community 23 - "CaneGuardDatabase"
Cohesion: 0.10
Nodes (26): CaneGuardDatabase, DatabaseContextValue, STORAGE_ERROR_CODES, StorageError, USER_MESSAGES, scanRecords, ScanRecordWriteRepository, deleteScanRecordById() (+18 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.17
Nodes (25): toPersistenceInput(), getManagedScanImageDirectory(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS (+17 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.21
Nodes (14): countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession() (+6 more)

### Community 26 - "record-details.tsx"
Cohesion: 0.10
Nodes (24): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+16 more)

### Community 27 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 28 - "sessionErrors.ts"
Cohesion: 0.36
Nodes (3): SessionStateError, SessionStateErrorCode, DetectionError

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "useTheme"
Cohesion: 0.15
Nodes (18): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, BarangayOption() (+10 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 34 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 35 - "syncFieldReport.ts"
Cohesion: 0.11
Nodes (8): FieldReportSyncRepository, ApiHttpError, MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 36 - "scan.tsx"
Cohesion: 0.13
Nodes (19): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+11 more)

### Community 37 - "mobileReportStatusesApi.ts"
Cohesion: 0.16
Nodes (22): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses() (+14 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.12
Nodes (18): ReportRepository, ScanRecordRepository, DateRange, LocalReportSummary, ScanRecordQuery, buildDateCondition(), buildPendingReportCondition(), createReportRepository() (+10 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.21
Nodes (11): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, DisclosureSection() (+3 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "useAuth"
Cohesion: 0.11
Nodes (30): FieldReportScreen(), RecordDetailsScreen(), DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace (+22 more)

### Community 44 - "detection/types.ts"
Cohesion: 0.06
Nodes (48): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+40 more)

### Community 45 - "useFieldReportDraft.test.tsx"
Cohesion: 0.18
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 48 - "runInference.ts"
Cohesion: 0.14
Nodes (13): DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores(), PostprocessedOutput (+5 more)

### Community 49 - "scanRecordRepository.ts"
Cohesion: 0.19
Nodes (14): fieldReports, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), findScanRecordById(), listManagedImageUris(), listScanRecords(), openTestDatabase() (+6 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "ActivityScreen.tsx"
Cohesion: 0.16
Nodes (12): BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, ActivityScreen(), formatActivityCount() (+4 more)

### Community 52 - "checklistConsistency.ts"
Cohesion: 0.43
Nodes (5): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase

### Community 53 - "activity.test.tsx"
Cohesion: 0.22
Nodes (7): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, REPORT, SCAN

### Community 54 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 55 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 56 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 59 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 61 - "apiClient.ts"
Cohesion: 0.18
Nodes (10): MOBILE_REPORT_STATUSES_V1_FIXTURE, request, apiRequest(), createAbortError(), DEFAULT_API_TIMEOUT_MS, normalizePath(), parseRetryAfter(), readResponseBody() (+2 more)

### Community 63 - "syncPendingFieldReports.ts"
Cohesion: 0.14
Nodes (16): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch() (+8 more)

### Community 65 - "recordTypes.ts"
Cohesion: 0.23
Nodes (15): SyncStatus, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, CompletedScanDraft, DEFAULT_RECORD_PAGE_SIZE (+7 more)

## Knowledge Gaps
- **349 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockUsePaginatedScanRecords`, `mockRouterPush` (+344 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `online-map-picker.tsx`, `home.tsx`, `Typography`, `scan.tsx`, `DatabaseProvider.tsx`, `theme.ts`, `image-preview.tsx`, `analysis-result.tsx`, `useAuth`, `field-report.tsx`, `ActivityScreen.tsx`, `record-details.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldReportSyncRepository.ts`, `fieldReportReviewRepository.ts`, `DatabaseProvider.tsx`, `reportRepository.ts`, `fieldReportRepository.ts`, `useAuth`, `field-report.tsx`, `scanRecordRepository.ts`, `scanImageStorage.ts`, `CaneGuardDatabase`, `SyncProvider.tsx`, `record-details.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `home.tsx`, `theme.ts`, `reportRepository.ts`, `AuthProvider.tsx`, `useFieldReportDraft.test.tsx`, `field-report.tsx`, `toStorageError`, `SyncProvider.tsx`, `record-details.tsx`, `useTheme`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _349 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06885245901639345 - nodes in this community are weakly interconnected._
- **Should `Typography` be split into smaller, more focused modules?**
  _Cohesion score 0.11052631578947368 - nodes in this community are weakly interconnected._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._