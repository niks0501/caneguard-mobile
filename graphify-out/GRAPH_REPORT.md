# Graph Report - caneguard-mobile  (2026-08-24)

## Corpus Check
- 205 files · ~95,532 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1246 nodes · 3553 edges · 67 communities (63 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5684aecb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- _layout.tsx
- reportMultipartMapper.contract.test.ts
- global.d.ts
- useAuth
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- fieldReportSyncRepository.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- BarangayPicker.tsx
- fieldReportValidation.ts
- model-debug.test.tsx
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncErrors.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- errors.ts
- submissionImageStorage.ts
- SyncProvider.tsx
- field-report.tsx
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- model-debug.tsx
- online-map-picker.tsx
- home.tsx
- detection/types.ts
- FieldReportSyncRepository
- analysis-result.tsx
- CaneGuardDatabase
- captureGpsLocation.ts
- recordTypes.ts
- analysis-result.test.tsx
- scan.test.tsx
- useCaneGuardModel.tsx
- scanRecordRepository.ts
- image-preview.test.tsx
- useCaneGuardDatabase
- compareParityReference.ts
- records.test.tsx
- postprocessOutput.ts
- saveCompletedScan.ts
- assessImageQuality.ts
- useTheme
- useSaveCompletedScan.ts
- reportReviewTypes.ts
- mobileReportStatusesApi.ts
- record-details.test.tsx
- symptom-checklist.test.tsx
- reportMultipartMapper.test.ts
- submissionImageStorage.test.ts
- MockFile
- RecordCard.tsx
- apiClient.ts
- model-smoke-test.tsx
- syncPendingFieldReports.ts
- mobileReportStatusesApi.test.ts
- checklistConsistency.ts
- env.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 59 edges
3. `CaneGuardDatabase` - 47 edges
4. `Typography` - 35 edges
5. `Spacing` - 32 edges
6. `StorageError` - 32 edges
7. `useAuth()` - 32 edges
8. `Radius` - 28 edges
9. `FieldReport` - 24 edges
10. `ComponentTokens` - 23 edges

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

## Communities (67 total, 4 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.20
Nodes (9): CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), CaneGuardDatabaseProvider(), DatabaseContext, DatabaseInitializationStatus, styles, useDatabaseState(), mockGetResources (+1 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.17
Nodes (28): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+20 more)

### Community 2 - "_layout.tsx"
Cohesion: 0.16
Nodes (9): AppNavigator(), styles, SettingsScreen(), mockLogout, ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), ThemeScheme (+1 more)

### Community 3 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+14 more)

### Community 5 - "useAuth"
Cohesion: 0.24
Nodes (12): FieldReportScreen(), DatabaseInitializationView(), getStorageErrorMessage(), useAuth(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+4 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.09
Nodes (24): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+16 more)

### Community 8 - "Typography"
Cohesion: 0.13
Nodes (16): SplashScreen(), styles, RegisterScreen(), styles, AppButton(), AppButtonProps, AppButtonVariant, styles (+8 more)

### Community 10 - "fieldReportSyncRepository.ts"
Cohesion: 0.22
Nodes (15): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+7 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.16
Nodes (23): CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile(), mapAuthError(), MobileAuthError (+15 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.35
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "BarangayPicker.tsx"
Cohesion: 0.50
Nodes (4): BarangayOption(), BarangayPicker(), filterBarangayOptions(), styles

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.08
Nodes (46): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+38 more)

### Community 16 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncErrors.ts"
Cohesion: 0.17
Nodes (14): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS (+6 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (35): ScanSourceType, assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory() (+27 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.18
Nodes (9): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT, MODEL_SHA256, MODEL_VERSION, InferenceRunner (+1 more)

### Community 22 - "toStorageError"
Cohesion: 0.16
Nodes (26): toStorageError(), deleteManagedScanImage(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+18 more)

### Community 23 - "errors.ts"
Cohesion: 0.19
Nodes (11): CANEGUARD_DATABASE_FILENAME, createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), DatabaseConnectionAttempt(), STORAGE_ERROR_CODES, StorageError, StorageErrorCode, USER_MESSAGES (+3 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.13
Nodes (33): persistSubmissionImageMetadata(), toPersistenceInput(), getManagedScanImageDirectory(), getSubmissionImageUri(), readManagedImageMetadata(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates() (+25 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.22
Nodes (12): findLastSuccessfulFieldReportSyncAt(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), SyncContext, SyncProvider() (+4 more)

### Community 26 - "field-report.tsx"
Cohesion: 0.09
Nodes (34): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+26 more)

### Community 27 - "schema.ts"
Cohesion: 0.12
Nodes (21): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, fieldReports, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow (+13 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.12
Nodes (14): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+6 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "model-debug.tsx"
Cohesion: 0.09
Nodes (23): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+15 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 34 - "detection/types.ts"
Cohesion: 0.20
Nodes (11): initialScanSessionState, completedResult, DetectionResult, InferenceTimings, ScanSessionAction, ScanSessionState, ScanSessionStatus, ImageQualityAssessment (+3 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (25): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, MetadataRow() (+17 more)

### Community 37 - "CaneGuardDatabase"
Cohesion: 0.15
Nodes (20): CaneGuardDatabase, DatabaseContextValue, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew() (+12 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "recordTypes.ts"
Cohesion: 0.08
Nodes (38): ReportsScreen(), mockRefresh, mockRouterPush, SUMMARY, SyncStatus, ChecklistConsistency, ModelLabel, ClassScore (+30 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "scan.test.tsx"
Cohesion: 0.18
Nodes (8): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, supportedImageFormats, unsupportedImageFormats

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (16): MODEL_OUTPUT, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+8 more)

### Community 43 - "scanRecordRepository.ts"
Cohesion: 0.20
Nodes (14): buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), openTestDatabase() (+6 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.15
Nodes (13): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+5 more)

### Community 45 - "useCaneGuardDatabase"
Cohesion: 0.24
Nodes (10): useCaneGuardDatabase(), ReportStatusesApiError, database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState (+2 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 49 - "saveCompletedScan.ts"
Cohesion: 0.60
Nodes (4): insertScanRecord(), isDuplicateRecordError(), SaveCompletedScanOptions, compensateManagedImageCopy()

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "useTheme"
Cohesion: 0.09
Nodes (35): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), SectionLabel(), StateCard() (+27 more)

### Community 52 - "useSaveCompletedScan.ts"
Cohesion: 0.21
Nodes (9): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+1 more)

### Community 53 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 54 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 55 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 56 - "symptom-checklist.test.tsx"
Cohesion: 0.18
Nodes (9): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext, ScanSessionContextValue, ScanSessionProvider() (+1 more)

### Community 57 - "reportMultipartMapper.test.ts"
Cohesion: 0.33
Nodes (4): map(), REPORT, SCAN, TestFormData

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 59 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "RecordCard.tsx"
Cohesion: 0.22
Nodes (11): DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), RecordCard(), RecordCardProps (+3 more)

### Community 61 - "apiClient.ts"
Cohesion: 0.29
Nodes (9): ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage(), MobileReportResponse, readRemoteId() (+1 more)

### Community 62 - "model-smoke-test.tsx"
Cohesion: 0.21
Nodes (10): ImagePreviewScreen(), DevelopmentModelSmokeTestScreen(), MetadataRow(), ModelSmokeTestScreen(), styles, mockRun, mockUseCaneGuardModel, IconSize (+2 more)

### Community 63 - "syncPendingFieldReports.ts"
Cohesion: 0.20
Nodes (11): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, MAX_SYNC_REPORTS_PER_RUN, SyncBatchResult (+3 more)

### Community 65 - "checklistConsistency.ts"
Cohesion: 0.47
Nodes (4): ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase

## Knowledge Gaps
- **340 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+335 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `_layout.tsx`, `online-map-picker.tsx`, `analysis-result.tsx`, `useAuth`, `theme.ts`, `Typography`, `recordTypes.ts`, `BarangayPicker.tsx`, `records.test.tsx`, `field-report.tsx`, `RecordCard.tsx`, `model-smoke-test.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `useAuth`, `CaneGuardDatabase`, `recordTypes.ts`, `fieldReportSyncRepository.ts`, `scanRecordRepository.ts`, `saveCompletedScan.ts`, `useSaveCompletedScan.ts`, `scanImageStorage.ts`, `errors.ts`, `submissionImageStorage.ts`, `SyncProvider.tsx`, `field-report.tsx`, `schema.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `home.tsx`, `_layout.tsx`, `theme.ts`, `recordTypes.ts`, `mobileAuthApi.ts`, `useCaneGuardDatabase`, `toStorageError`, `record-details.test.tsx`, `SyncProvider.tsx`, `field-report.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _340 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reportMultipartMapper.contract.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08817204301075268 - nodes in this community are weakly interconnected._
- **Should `Typography` be split into smaller, more focused modules?**
  _Cohesion score 0.12554112554112554 - nodes in this community are weakly interconnected._