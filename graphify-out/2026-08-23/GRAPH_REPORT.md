# Graph Report - caneguard-mobile  (2026-08-22)

## Corpus Check
- 200 files · ~86,828 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1127 nodes · 3225 edges · 52 communities (49 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5c295c62`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- settings.tsx
- useTheme
- global.d.ts
- record-details.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- ComponentTokens
- apiClient.ts
- preprocessImage.ts
- mobileAuthApi.ts
- recordValidation.ts
- field-report.tsx
- fieldReportValidation.ts
- runInference.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncPendingFieldReports.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- fieldReportSyncRepository.ts
- fieldReportTypes.ts
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- saveCompletedScan.test.ts
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
- field-report.test.tsx
- useCaneGuardModel.tsx
- Typography
- Spacing
- useFieldReportDraft.test.tsx
- compareParityReference.ts
- reportReviewTypes.ts
- postprocessOutput.ts
- env.ts
- diseaseCatalog.ts
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

## Communities (52 total, 3 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.09
Nodes (29): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+21 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.21
Nodes (13): appendMismatchReported(), appendNumber(), appendOptionalText(), invalid(), isProbability(), mapFieldReportToMultipart(), MultipartMapperDependencies, validateMismatchFields() (+5 more)

### Community 2 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 3 - "useTheme"
Cohesion: 0.10
Nodes (30): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel() (+22 more)

### Community 5 - "record-details.tsx"
Cohesion: 0.05
Nodes (61): FieldReportScreen(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+53 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "ComponentTokens"
Cohesion: 0.12
Nodes (14): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+6 more)

### Community 10 - "apiClient.ts"
Cohesion: 0.16
Nodes (12): MOBILE_REPORT_STATUSES_V1_FIXTURE, request, ApiHttpError, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody(), readServerMessage() (+4 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (29): AppNavigator(), styles, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+21 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.13
Nodes (22): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+14 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.24
Nodes (21): coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported(), normalizeOptionalAffectedArea() (+13 more)

### Community 16 - "runInference.ts"
Cohesion: 0.18
Nodes (9): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), InferenceRunner, runInference() (+1 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncPendingFieldReports.ts"
Cohesion: 0.11
Nodes (24): AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError(), SyncContextValue (+16 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.17
Nodes (7): migration0, migration1, migration2, migration3, migration4, migration5, migration6

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.08
Nodes (29): assertManagedScanImageUri(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME, findOrphanedManagedImages() (+21 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.21
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, MODEL_FILENAME, MODEL_INPUT, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 22 - "toStorageError"
Cohesion: 0.24
Nodes (18): toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture() (+10 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.11
Nodes (28): useDatabaseState(), fieldReports, scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics() (+20 more)

### Community 24 - "mobileReportStatusesApi.ts"
Cohesion: 0.21
Nodes (18): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+10 more)

### Community 25 - "fieldReportSyncRepository.ts"
Cohesion: 0.19
Nodes (20): countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+12 more)

### Community 26 - "fieldReportTypes.ts"
Cohesion: 0.17
Nodes (13): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport (+5 more)

### Community 27 - "schema.ts"
Cohesion: 0.12
Nodes (18): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+10 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.13
Nodes (11): SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceStage(), InferenceError, InferenceErrorCode, CaneGuardModelContext (+3 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "saveCompletedScan.test.ts"
Cohesion: 0.12
Nodes (11): PickerOutcome, readPickerOutcome(), ScanSourceType, mockDatabase, mockRandomUUID, mockSaveCompletedScan, useSaveCompletedScan(), ManagedImage (+3 more)

### Community 31 - "model-debug.tsx"
Cohesion: 0.10
Nodes (23): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+15 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.10
Nodes (23): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+15 more)

### Community 34 - "detection/types.ts"
Cohesion: 0.08
Nodes (36): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+28 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.17
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+8 more)

### Community 37 - "CaneGuardDatabase"
Cohesion: 0.13
Nodes (23): CaneGuardDatabase, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), openTestDatabase() (+15 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "recordTypes.ts"
Cohesion: 0.13
Nodes (17): SyncStatus, ReportedSeverity, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE (+9 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.13
Nodes (19): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+11 more)

### Community 41 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "Typography"
Cohesion: 0.14
Nodes (14): SEVERITIES, styles, SymptomChecklistScreen(), BrandedScreenHeaderProps, styles, ProgressBarProps, styles, styles (+6 more)

### Community 44 - "Spacing"
Cohesion: 0.16
Nodes (12): SplashScreen(), styles, RegisterScreen(), styles, ScreenContainer(), ScreenContainerProps, styles, styles (+4 more)

### Community 45 - "useFieldReportDraft.test.tsx"
Cohesion: 0.18
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 50 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 51 - "scan.tsx"
Cohesion: 0.21
Nodes (10): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), AppButtonProps (+2 more)

## Knowledge Gaps
- **314 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+309 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `settings.tsx`, `online-map-picker.tsx`, `analysis-result.tsx`, `record-details.tsx`, `theme.ts`, `ComponentTokens`, `Typography`, `Spacing`, `field-report.tsx`, `scan.tsx`, `model-debug.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `record-details.tsx`, `CaneGuardDatabase`, `field-report.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `fieldReportSyncRepository.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `record-details.tsx` to `home.tsx`, `settings.tsx`, `theme.ts`, `mobileAuthApi.ts`, `useFieldReportDraft.test.tsx`, `field-report.tsx`, `toStorageError`, `fieldReportSyncRepository.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _314 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09080841638981174 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._
- **Should `record-details.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._