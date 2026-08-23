# Graph Report - caneguard-mobile  (2026-08-24)

## Corpus Check
- 205 files · ~94,190 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1233 nodes · 3524 edges · 59 communities (57 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5fd98f3b`
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
- ComponentTokens
- fieldReportSyncRepository.ts
- preprocessImage.ts
- mobileReportStatusesApi.ts
- recordValidation.ts
- field-report.tsx
- fieldReportValidation.ts
- model-debug.tsx
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncPendingFieldReports.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- toStorageError
- scanRecordRepository.ts
- useAuth.ts
- SyncProvider.tsx
- record-details.tsx
- schema.ts
- inferenceErrors.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- use-theme.ts
- online-map-picker.tsx
- home.tsx
- saveCompletedScan.test.ts
- fieldReportTypes.ts
- analysis-result.tsx
- CaneGuardDatabase
- captureGpsLocation.ts
- reportRepository.ts
- analysis-result.test.tsx
- scan.test.tsx
- useCaneGuardModel.tsx
- field-report.test.tsx
- image-preview.test.tsx
- useCaneGuardDatabase
- compareParityReference.ts
- records.test.tsx
- postprocessOutput.ts
- scanRecordWriteRepository.ts
- recordTypes.ts
- useTheme
- useSaveCompletedScan.ts
- reportReviewTypes.ts
- ScanSessionProvider.tsx
- record-details.test.tsx
- symptom-checklist.test.tsx
- reportMultipartMapper.test.ts
- fieldReportValidation.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 117 edges
2. `toStorageError()` - 61 edges
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

## Communities (59 total, 2 thin omitted)

### Community 0 - "DatabaseProvider.tsx"
Cohesion: 0.14
Nodes (16): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext, DatabaseInitializationStatus (+8 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (57): toPersistenceInput(), generateSubmissionDerivative(), getDimensionCandidates(), PreparedSubmissionImage, prepareSubmissionImage(), readPersistedArtifact(), readPositiveFileSize(), removeDestination() (+49 more)

### Community 2 - "_layout.tsx"
Cohesion: 0.16
Nodes (9): AppNavigator(), styles, SettingsScreen(), mockLogout, ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), ThemeScheme (+1 more)

### Community 3 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+14 more)

### Community 5 - "useAuth"
Cohesion: 0.21
Nodes (15): FieldReportScreen(), getStorageErrorMessage(), useAuth(), buildConditions(), buildFieldReportJoinCondition(), listScanRecords(), MAX_RECORD_PAGE_SIZE, mockDatabase (+7 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.12
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "ComponentTokens"
Cohesion: 0.12
Nodes (14): DiseaseBadge(), DiseaseBadgeProps, styles, CHIP_CONFIG, StatusChip(), StatusChipProps, StatusVariant, styles (+6 more)

### Community 10 - "fieldReportSyncRepository.ts"
Cohesion: 0.21
Nodes (16): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed() (+8 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.17
Nodes (17): MODEL_INPUT, createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), PreprocessingResult (+9 more)

### Community 12 - "mobileReportStatusesApi.ts"
Cohesion: 0.06
Nodes (54): apiBaseUrl, parseApiBaseUrl(), CurrentUserResponse, isAbortError(), isMobileUser(), loginMobile(), LoginResponse, logoutMobile() (+46 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.32
Nodes (14): getChecklistConsistency(), MODEL_LABELS, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores() (+6 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.14
Nodes (19): AuthorityReviewSection(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatTimestamp() (+11 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.24
Nodes (21): coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported(), normalizeOptionalAffectedArea() (+13 more)

### Community 16 - "model-debug.tsx"
Cohesion: 0.13
Nodes (17): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+9 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncPendingFieldReports.ts"
Cohesion: 0.07
Nodes (26): FieldReportSyncRepository, SYNC_RETRY_COOLDOWN_MS, AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode (+18 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.15
Nodes (8): migration0, migration1, migration2, migration3, migration4, migration5, migration6, migration7

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.08
Nodes (32): assertManagedScanImageUri(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME, findOrphanedManagedImages() (+24 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.19
Nodes (11): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION, ModelMetadata (+3 more)

### Community 22 - "toStorageError"
Cohesion: 0.14
Nodes (30): toStorageError(), persistSubmissionImageMetadata(), deleteManagedScanImage(), getSubmissionImageUri(), removeExistingDerivative(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport() (+22 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.16
Nodes (15): createCaneGuardDatabaseResources(), STORAGE_ERROR_CODES, StorageError, USER_MESSAGES, mockOpenDatabaseSync, createScanRecordRepository(), deleteScanRecordById(), findScanRecordById() (+7 more)

### Community 24 - "useAuth.ts"
Cohesion: 0.18
Nodes (11): ReportsScreen(), mockRefresh, mockRouterPush, SUMMARY, LocalReportSummary, DATABASE, mockGetLocalReportSummary, mockUser (+3 more)

### Community 25 - "SyncProvider.tsx"
Cohesion: 0.22
Nodes (11): ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), SyncContext, SyncProvider(), OFFLINE (+3 more)

### Community 26 - "record-details.tsx"
Cohesion: 0.10
Nodes (29): AutomaticSummaryCard(), InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt() (+21 more)

### Community 27 - "schema.ts"
Cohesion: 0.13
Nodes (18): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, GPS_CAPTURE_OUTCOMES, NewFieldReportRow, NewScanClassScoreRow, NewScanQualityWarningRow, NewScanRecordRow (+10 more)

### Community 28 - "inferenceErrors.ts"
Cohesion: 0.11
Nodes (13): getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage() (+5 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.12
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "use-theme.ts"
Cohesion: 0.07
Nodes (42): MetadataRow(), styles, SplashScreen(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, RegisterScreen() (+34 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (28): mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), styles, viewportPointFromPressEvent() (+20 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 34 - "saveCompletedScan.test.ts"
Cohesion: 0.23
Nodes (7): initialScanSessionState, completedResult, ScanSessionState, NOW, ManagedImage, MANAGED_IMAGE, NOW

### Community 35 - "fieldReportTypes.ts"
Cohesion: 0.15
Nodes (17): FieldReportAuthoringState, FieldReportLocationSource, GpsCaptureOutcome, SyncStatus, MobileUserRole, ScanRecordListItem, PaginatedQueryState, FieldReportUploadRecord (+9 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.16
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+8 more)

### Community 37 - "CaneGuardDatabase"
Cohesion: 0.16
Nodes (19): CaneGuardDatabase, DatabaseContextValue, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew() (+11 more)

### Community 38 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 39 - "reportRepository.ts"
Cohesion: 0.13
Nodes (15): fieldReports, scanRecords, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, SaveCompletedScanInput, ScanRecordQuery (+7 more)

### Community 40 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 41 - "scan.test.tsx"
Cohesion: 0.18
Nodes (8): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, supportedImageFormats, unsupportedImageFormats

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.12
Nodes (17): ImagePreviewScreen(), ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun (+9 more)

### Community 43 - "field-report.test.tsx"
Cohesion: 0.13
Nodes (12): FormValues, mockCaptureLocation, mockFinalize, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave, mockSaveManualLocation (+4 more)

### Community 44 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (10): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, selectedState (+2 more)

### Community 45 - "useCaneGuardDatabase"
Cohesion: 0.24
Nodes (10): useCaneGuardDatabase(), ReportStatusesApiError, database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState (+2 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.39
Nodes (6): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison

### Community 47 - "records.test.tsx"
Cohesion: 0.25
Nodes (7): RecordsScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 48 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 49 - "scanRecordWriteRepository.ts"
Cohesion: 0.26
Nodes (8): insertScanRecord(), isDuplicateRecordError(), SaveCompletedScanOptions, compensateManagedImageCopy(), emitSyncRecordsChanged(), getSyncRecordsRevision(), Listener, listeners

### Community 50 - "recordTypes.ts"
Cohesion: 0.15
Nodes (19): ChecklistConsistency, ChecklistObservationId, MATRIX, MatrixCase, ModelLabel, ClassScore, InferenceTimings, ReportedSeverity (+11 more)

### Community 51 - "useTheme"
Cohesion: 0.10
Nodes (30): FilterKey, FILTERS, StateCard(), styles, ClassCount(), getClassPresentation(), SectionLabel(), StateCard() (+22 more)

### Community 52 - "useSaveCompletedScan.ts"
Cohesion: 0.21
Nodes (9): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), saveCompletedScan() (+1 more)

### Community 53 - "reportReviewTypes.ts"
Cohesion: 0.29
Nodes (8): AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus(), KnownAuthorityReviewStatus, toAuthorityReviewSnapshot()

### Community 54 - "ScanSessionProvider.tsx"
Cohesion: 0.28
Nodes (7): renderPreview(), renderScan(), ScanSessionContextValue, ScanSessionProvider(), scanSessionReducer(), SessionProbe(), ScanSessionAction

### Community 55 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 56 - "symptom-checklist.test.tsx"
Cohesion: 0.25
Nodes (6): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, ScanSessionContext

### Community 57 - "reportMultipartMapper.test.ts"
Cohesion: 0.40
Nodes (3): REPORT, SCAN, TestFormData

## Knowledge Gaps
- **340 isolated node(s):** `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState`, `mockRouterBack`, `mockRouterPush` (+335 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `DatabaseProvider.tsx`, `home.tsx`, `_layout.tsx`, `online-map-picker.tsx`, `analysis-result.tsx`, `useAuth`, `theme.ts`, `ComponentTokens`, `useCaneGuardModel.tsx`, `field-report.tsx`, `records.test.tsx`, `model-debug.tsx`, `useAuth.ts`, `record-details.tsx`, `use-theme.ts`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `DatabaseProvider.tsx`, `reportMultipartMapper.ts`, `useAuth`, `CaneGuardDatabase`, `reportRepository.ts`, `fieldReportSyncRepository.ts`, `field-report.tsx`, `scanRecordWriteRepository.ts`, `useSaveCompletedScan.ts`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `useAuth.ts`, `record-details.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `StorageError` connect `scanRecordRepository.ts` to `DatabaseProvider.tsx`, `reportMultipartMapper.ts`, `saveCompletedScan.test.ts`, `CaneGuardDatabase`, `fieldReportSyncRepository.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `scanRecordWriteRepository.ts`, `useSaveCompletedScan.ts`, `scanImageStorage.ts`, `toStorageError`, `fieldReportValidation.test.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `mockDispatch`, `mockSaveRecord`, `mockSaveRecordState` to the rest of the system?**
  _340 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06086956521739131 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.contract.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._