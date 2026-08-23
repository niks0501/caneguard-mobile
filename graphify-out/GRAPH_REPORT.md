# Graph Report - caneguard-mobile  (2026-08-24)

## Corpus Check
- 204 files · ~92,730 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1202 nodes · 3446 edges · 62 communities (60 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5fd98f3b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseProvider.tsx
- reportMultipartMapper.ts
- settings.tsx
- RecordCard.tsx
- global.d.ts
- toStorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- ComponentTokens
- apiClient.ts
- preprocessImage.ts
- useAuth.ts
- recordValidation.ts
- useTheme
- fieldReportValidation.ts
- sessionErrors.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncPendingFieldReports.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- CaneGuardDatabase
- scanRecordRepository.ts
- reportRepository.ts
- SyncProvider.tsx
- errors.ts
- schema.ts
- runInference.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- image-preview.tsx
- online-map-picker.tsx
- home.tsx
- symptom-checklist.tsx
- FieldReportSyncRepository
- analysis-result.tsx
- mobileReportStatusesApi.ts
- captureGpsLocation.ts
- ScanRecordListItem
- analysis-result.test.tsx
- detection/types.ts
- useCaneGuardModel.tsx
- Spacing
- submissionImageStorage.test.ts
- syncErrors.ts
- compareParityReference.ts
- submissionImageStorage.ts
- postprocessOutput.ts
- fieldReportSyncRepository.ts
- assessImageQuality.ts
- reports.tsx
- fieldReportRepository.ts
- recordTypes.ts
- scan.tsx
- syncFieldReport.ts
- field-report.test.tsx
- MockFile
- register.tsx
- saveCompletedScan.test.ts
- saveCompletedScan.ts
- useCaneGuardModel.web.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 59 edges
3. `CaneGuardDatabase` - 47 edges
4. `Typography` - 35 edges
5. `Spacing` - 32 edges
6. `StorageError` - 32 edges
7. `useAuth()` - 32 edges
8. `Radius` - 28 edges
9. `ComponentTokens` - 23 edges
10. `FieldReport` - 23 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `ReferenceCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (62 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.14
Nodes (16): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+8 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.18
Nodes (16): persistSubmissionImageMetadata(), getSubmissionImageUri(), isValidSubmissionImageMetadata(), appendMismatchReported(), appendNumber(), appendOptionalText(), invalid(), isProbability() (+8 more)

### Community 2 - "settings.tsx"
Cohesion: 0.25
Nodes (7): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout

### Community 3 - "RecordCard.tsx"
Cohesion: 0.20
Nodes (12): InheritedScanEvidence(), DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), getResultLabel() (+4 more)

### Community 5 - "toStorageError"
Cohesion: 0.23
Nodes (18): FieldReportScreen(), formatClassLabel(), formatDuration(), formatSavedAt(), RecordDetailsScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError() (+10 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.13
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "ComponentTokens"
Cohesion: 0.18
Nodes (9): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+1 more)

### Community 10 - "apiClient.ts"
Cohesion: 0.18
Nodes (9): apiBaseUrl, parseApiBaseUrl(), MOBILE_REPORT_STATUSES_V1_FIXTURE, request, apiRequest(), normalizePath(), parseRetryAfter(), readResponseBody() (+1 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+6 more)

### Community 12 - "useAuth.ts"
Cohesion: 0.10
Nodes (30): AppNavigator(), styles, CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+22 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.37
Nodes (13): MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "useTheme"
Cohesion: 0.10
Nodes (34): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+26 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.20
Nodes (22): FieldReportSubmissionEvidence, coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported() (+14 more)

### Community 16 - "sessionErrors.ts"
Cohesion: 0.29
Nodes (5): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncPendingFieldReports.ts"
Cohesion: 0.20
Nodes (11): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, MAX_SYNC_REPORTS_PER_RUN, SyncBatchResult (+3 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (34): assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+26 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.17
Nodes (15): MetadataRow(), ModelSmokeTestScreen(), styles, mockRun, mockUseCaneGuardModel, IconSize, MODEL_FILENAME, MODEL_INPUT (+7 more)

### Community 22 - "CaneGuardDatabase"
Cohesion: 0.14
Nodes (24): CaneGuardDatabase, cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture() (+16 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.20
Nodes (15): buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris(), listScanRecords(), insertScanRecord() (+7 more)

### Community 24 - "reportRepository.ts"
Cohesion: 0.13
Nodes (18): mockRefresh, mockRouterPush, SUMMARY, ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition() (+10 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.21
Nodes (14): countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession() (+6 more)

### Community 26 - "errors.ts"
Cohesion: 0.13
Nodes (16): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, DatabaseContextValue (+8 more)

### Community 27 - "schema.ts"
Cohesion: 0.11
Nodes (22): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, fieldReports, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow (+14 more)

### Community 28 - "runInference.ts"
Cohesion: 0.22
Nodes (8): ImagePreviewScreen(), asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, InferenceRunner, runInference()

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "image-preview.tsx"
Cohesion: 0.11
Nodes (21): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+13 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 34 - "symptom-checklist.tsx"
Cohesion: 0.16
Nodes (13): getObservationLabel(), SEVERITIES, styles, SymptomChecklistScreen(), completedResult, completedState, mockDispatch, mockRouterPush (+5 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.19
Nodes (12): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, diseaseCatalog (+4 more)

### Community 37 - "mobileReportStatusesApi.ts"
Cohesion: 0.06
Nodes (55): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+47 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "ScanRecordListItem"
Cohesion: 0.11
Nodes (15): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, SyncStatus (+7 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "detection/types.ts"
Cohesion: 0.08
Nodes (32): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+24 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.11
Nodes (19): ModelDebugRoute(), DevelopmentModelSmokeTestScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync (+11 more)

### Community 43 - "Spacing"
Cohesion: 0.22
Nodes (8): styles, SymptomChecklistItem(), SymptomChecklistItemProps, Spacing, BarangayOption(), BarangayPicker(), filterBarangayOptions(), styles

### Community 44 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (9): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES (+1 more)

### Community 45 - "syncErrors.ts"
Cohesion: 0.20
Nodes (11): AUTO_RETRYABLE_SYNC_ERROR_CODES, getSyncErrorMessage(), isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode, toSyncError() (+3 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "submissionImageStorage.ts"
Cohesion: 0.20
Nodes (18): getManagedScanImageDirectory(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES (+10 more)

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 49 - "fieldReportSyncRepository.ts"
Cohesion: 0.24
Nodes (13): findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+5 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.32
Nodes (4): assessImageQuality(), ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "reports.tsx"
Cohesion: 0.09
Nodes (26): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), ReportsScreen(), SectionLabel() (+18 more)

### Community 52 - "fieldReportRepository.ts"
Cohesion: 0.21
Nodes (15): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, MobileUserRole, PreparedSubmissionImage, SubmissionImagePreparationInput, FieldReportUploadRecord, CreateFieldReportDraftInput (+7 more)

### Community 53 - "recordTypes.ts"
Cohesion: 0.24
Nodes (14): ChecklistConsistency, ChecklistObservationId, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity (+6 more)

### Community 54 - "scan.tsx"
Cohesion: 0.17
Nodes (13): SplashScreen(), styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles (+5 more)

### Community 55 - "syncFieldReport.ts"
Cohesion: 0.18
Nodes (9): ApiHttpError, MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, syncFieldReport(), SyncFieldReportOptions, executeBatch() (+1 more)

### Community 56 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 57 - "MockFile"
Cohesion: 0.13
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 58 - "register.tsx"
Cohesion: 0.19
Nodes (9): RegisterScreen(), styles, ScreenContainer(), ScreenContainerProps, styles, styles, TextField(), TextFieldProps (+1 more)

### Community 59 - "saveCompletedScan.test.ts"
Cohesion: 0.20
Nodes (7): mockDatabase, mockRandomUUID, mockSaveCompletedScan, saveCompletedScan(), MANAGED_IMAGE, NOW, save()

### Community 60 - "saveCompletedScan.ts"
Cohesion: 0.29
Nodes (10): SaveCompletedScanOptions, toPersistenceInput(), compensateManagedImageCopy(), ManagedImage, prepareSubmissionImage(), readPersistedArtifact(), validatePreparationInput(), FinalizeFieldReportDependencies (+2 more)

### Community 61 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

## Knowledge Gaps
- **327 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `settings.tsx`, `RecordCard.tsx`, `toStorageError`, `theme.ts`, `ComponentTokens`, `useAuth.ts`, `modelContract.ts`, `runInference.ts`, `image-preview.tsx`, `online-map-picker.tsx`, `home.tsx`, `symptom-checklist.tsx`, `analysis-result.tsx`, `ScanRecordListItem`, `useCaneGuardModel.tsx`, `Spacing`, `reports.tsx`, `scan.tsx`, `register.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `reportMultipartMapper.ts`, `mobileReportStatusesApi.ts`, `saveCompletedScan.test.ts`, `useTheme`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `fieldReportRepository.ts`, `CaneGuardDatabase`, `scanRecordRepository.ts`, `reportRepository.ts`, `SyncProvider.tsx`, `errors.ts`, `schema.ts`, `saveCompletedScan.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `toStorageError` to `home.tsx`, `settings.tsx`, `mobileReportStatusesApi.ts`, `theme.ts`, `useAuth.ts`, `useTheme`, `CaneGuardDatabase`, `reportRepository.ts`, `SyncProvider.tsx`, `errors.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._
- **Should `theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `useAuth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10241545893719807 - nodes in this community are weakly interconnected._