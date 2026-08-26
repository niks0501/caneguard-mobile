# Graph Report - caneguard-mobile  (2026-08-24)

## Corpus Check
- 207 files · ~96,840 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1261 nodes · 3595 edges · 62 communities (60 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ff0ca5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scan.tsx
- reportMultipartMapper.ts
- ThemePreferenceProvider.tsx
- recordTypes.ts
- global.d.ts
- getStorageErrorMessage
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- getManagedScanImageDirectory
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
- errors.ts
- submissionImageStorage.ts
- fieldReportSyncRepository.ts
- record-details.tsx
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- model-debug.tsx
- online-map-picker.tsx
- home.tsx
- saveCompletedScan.test.ts
- syncFieldReport.ts
- analysis-result.tsx
- useAuth
- captureGpsLocation.ts
- reportRepository.ts
- analysis-result.test.tsx
- scan.test.tsx
- useCaneGuardModel.tsx
- scanRecordRepository.ts
- image-preview.test.tsx
- compareParityReference.ts
- records.test.tsx
- runInference.ts
- scanImageStorage.test.ts
- assessImageQuality.ts
- useTheme
- detection/types.ts
- reportReviewTypes.ts
- mobileReportStatusesApi.ts
- symptom-checklist.test.tsx
- submissionImageStorage.test.ts
- MockFile
- apiClient.ts
- syncPendingFieldReports.ts
- mobileReportStatusesApi.test.ts
- checklistConsistency.ts
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

## Communities (62 total, 2 thin omitted)

### Community 0 - "scan.tsx"
Cohesion: 0.15
Nodes (15): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), SEVERITIES (+7 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (55): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+47 more)

### Community 2 - "ThemePreferenceProvider.tsx"
Cohesion: 0.29
Nodes (4): ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), ThemeScheme

### Community 3 - "recordTypes.ts"
Cohesion: 0.20
Nodes (11): SyncStatus, ScanSourceType, QualityWarning, ScanRecordRepository, ScanRecordWriteRepository, DEFAULT_RECORD_PAGE_SIZE, RecordsByLabel, SaveCompletedScanInput (+3 more)

### Community 5 - "getStorageErrorMessage"
Cohesion: 0.50
Nodes (5): FieldReportScreen(), DatabaseInitializationView(), getStorageErrorMessage(), useScanRecordDetails(), useLocalReport()

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.10
Nodes (22): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+14 more)

### Community 8 - "Typography"
Cohesion: 0.10
Nodes (21): SplashScreen(), styles, RegisterScreen(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles, AppButton() (+13 more)

### Community 10 - "getManagedScanImageDirectory"
Cohesion: 0.47
Nodes (6): ensureManagedScanImageDirectory(), getManagedScanImageDirectory(), copyLegacySourceToCanonical(), isCanonicalManagedSourceUri(), prepareDerivativeFromManagedSource(), removeStagedSource()

### Community 11 - "preprocessImage.ts"
Cohesion: 0.14
Nodes (19): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, createInputTensor(), InputTensor, DecodedJpeg (+11 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.10
Nodes (35): HomeScreen(), AuthenticatedHomeRoute(), fetchMock, mockSession, mockRouterPush, AuthRequestKind, CurrentUserResponse, isAbortError() (+27 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.35
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.10
Nodes (25): AuthorityReviewSection(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatTimestamp() (+17 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.06
Nodes (55): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+47 more)

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
Cohesion: 0.14
Nodes (25): collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, EXTENSION_TO_MIME, findOrphanedManagedImages(), getManagedImageRootDirectory() (+17 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.13
Nodes (35): CaneGuardDatabase, toStorageError(), persistSubmissionImageMetadata(), getSubmissionImageUri(), createOrGetFieldReportDraft(), finalizeFieldReport(), FinalizeFieldReportDependencies, findFieldReportById() (+27 more)

### Community 23 - "errors.ts"
Cohesion: 0.11
Nodes (23): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.16
Nodes (24): saveCompletedScan(), toPersistenceInput(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES, persistCandidate() (+16 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.18
Nodes (22): useCaneGuardDatabase(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+14 more)

### Community 26 - "record-details.tsx"
Cohesion: 0.10
Nodes (29): AutomaticSummaryCard(), InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt() (+21 more)

### Community 27 - "schema.ts"
Cohesion: 0.15
Nodes (15): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+7 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.13
Nodes (11): SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode, CaneGuardModelContext (+3 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (26): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+18 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "model-debug.tsx"
Cohesion: 0.11
Nodes (22): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+14 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.12
Nodes (20): QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle(), styles (+12 more)

### Community 34 - "saveCompletedScan.test.ts"
Cohesion: 0.24
Nodes (5): initialScanSessionState, completedResult, NOW, MANAGED_IMAGE, NOW

### Community 35 - "syncFieldReport.ts"
Cohesion: 0.14
Nodes (5): FieldReportSyncRepository, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions

### Community 36 - "analysis-result.tsx"
Cohesion: 0.13
Nodes (20): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+12 more)

### Community 37 - "useAuth"
Cohesion: 0.10
Nodes (28): AppNavigator(), styles, fieldReports, useAuth(), ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache() (+20 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.13
Nodes (18): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition() (+10 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "scan.test.tsx"
Cohesion: 0.14
Nodes (12): renderPreview(), mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan() (+4 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "scanRecordRepository.ts"
Cohesion: 0.10
Nodes (30): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+22 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "records.test.tsx"
Cohesion: 0.29
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 48 - "runInference.ts"
Cohesion: 0.18
Nodes (8): asInferenceError(), normalizeScores(), PostprocessedOutput, postprocessOutput(), InferenceRunner, runInference(), softmax(), DetectionResult

### Community 49 - "scanImageStorage.test.ts"
Cohesion: 0.19
Nodes (13): SaveCompletedScanOptions, assertManagedScanImageUri(), compensateManagedImageCopy(), deleteManagedScanImage(), isManagedScanImageUri(), isManagedScanImageUriForRecord(), isManagedSourceScanImageUriForRecord(), managedImageExists() (+5 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.32
Nodes (4): assessImageQuality(), ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "useTheme"
Cohesion: 0.10
Nodes (32): FilterKey, FILTERS, RecordsScreen(), StateCard(), styles, ClassCount(), getClassPresentation(), ReportsScreen() (+24 more)

### Community 52 - "detection/types.ts"
Cohesion: 0.17
Nodes (12): InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE (+4 more)

### Community 53 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 54 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 56 - "symptom-checklist.test.tsx"
Cohesion: 0.22
Nodes (8): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext, ScanSessionContextValue, ScanSessionAction

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 59 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 61 - "apiClient.ts"
Cohesion: 0.25
Nodes (10): ApiHttpError, apiRequest(), createAbortError(), DEFAULT_API_TIMEOUT_MS, normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+2 more)

### Community 63 - "syncPendingFieldReports.ts"
Cohesion: 0.14
Nodes (16): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch() (+8 more)

### Community 64 - "mobileReportStatusesApi.test.ts"
Cohesion: 0.25
Nodes (3): MOBILE_REPORT_STATUSES_V1_FIXTURE, ReportStatusesApiError, request

### Community 65 - "checklistConsistency.ts"
Cohesion: 0.29
Nodes (9): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity (+1 more)

## Knowledge Gaps
- **343 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `scan.tsx`, `home.tsx`, `online-map-picker.tsx`, `analysis-result.tsx`, `getStorageErrorMessage`, `theme.ts`, `Typography`, `AuthProvider.tsx`, `field-report.tsx`, `errors.ts`, `record-details.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `home.tsx`, `getStorageErrorMessage`, `theme.ts`, `reportRepository.ts`, `scanRecordRepository.ts`, `AuthProvider.tsx`, `field-report.tsx`, `fieldReportValidation.ts`, `useTheme`, `toStorageError`, `fieldReportSyncRepository.ts`, `record-details.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `getStorageErrorMessage`, `useAuth`, `reportRepository.ts`, `scanRecordRepository.ts`, `field-report.tsx`, `scanImageStorage.test.ts`, `detection/types.ts`, `scanImageStorage.ts`, `errors.ts`, `submissionImageStorage.ts`, `fieldReportSyncRepository.ts`, `record-details.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07005649717514124 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._
- **Should `Typography` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._