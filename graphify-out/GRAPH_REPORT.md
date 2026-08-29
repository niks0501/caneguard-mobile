# Graph Report - caneguard-mobile  (2026-08-30)

## Corpus Check
- 259 files · ~116,836 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1642 nodes · 4725 edges · 65 communities (62 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `376cc5e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileNotificationsApi.ts
- reportMultipartMapper.ts
- useTheme
- fieldReportReviewRepository.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- Typography
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.tsx
- recordValidation.ts
- field-report.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldValidationCompletionRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- fieldValidationCompletionTypes.ts
- detection/types.ts
- submissionImageStorage.ts
- fieldReportRepository.ts
- RecordCard.tsx
- schema.ts
- image-preview.test.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncErrors.ts
- online-map-picker.tsx
- Radius
- analysis-result.test.tsx
- notificationCacheRepository.ts
- Spacing
- mobileReportStatusesApi.ts
- useFieldValidationAssignment.ts
- useAuth
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- apiClient.ts
- toStorageError
- compareParityReference.ts
- useCaneGuardDatabase
- runInference.ts
- DatabaseProvider.tsx
- recordTypes.ts
- ActivityScreen.tsx
- FieldReportSyncRepository
- activity.test.tsx
- ThemePreferenceProvider.tsx
- useAuthorityReviewStatus.test.tsx
- useCaneGuardModel.web.tsx
- settings.tsx
- MockFile
- MockFile
- phase1LifecycleAcceptance.test.ts
- mobileFieldValidationAssignmentsApi.ts
- assessImageQuality.ts
- env.ts
- model-debug.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 124 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 47 edges
5. `Typography` - 38 edges
6. `Spacing` - 35 edges
7. `CaneGuardDatabase` - 35 edges
8. `useCaneGuardDatabase()` - 32 edges
9. `Radius` - 31 edges
10. `getStorageErrorMessage()` - 26 edges

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

## Communities (65 total, 3 thin omitted)

### Community 0 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (56): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+48 more)

### Community 2 - "useTheme"
Cohesion: 0.15
Nodes (19): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, RegisterScreen() (+11 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.14
Nodes (18): fieldReports, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+10 more)

### Community 5 - "StorageError"
Cohesion: 0.14
Nodes (17): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, createCaneGuardDatabaseResources(), DatabaseContextValue, useDatabaseState(), STORAGE_ERROR_CODES, StorageError, StorageErrorCode (+9 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.10
Nodes (22): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+14 more)

### Community 8 - "Typography"
Cohesion: 0.09
Nodes (24): SplashScreen(), styles, DevelopmentModelSmokeTestScreen(), MetadataRow(), styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles (+16 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.08
Nodes (35): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, ReportRepository, ScanRecordRepository, ScanRecordWriteRepository (+27 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.10
Nodes (35): HomeScreen(), AuthenticatedHomeRoute(), fetchMock, mockSession, mockRouterPush, AuthRequestKind, CurrentUserResponse, isAbortError() (+27 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.30
Nodes (14): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.11
Nodes (25): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+17 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.12
Nodes (34): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FieldReportSubmissionEvidence (+26 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.11
Nodes (17): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ChecklistObservation, GUIDED_VALIDATION_MAX_QUESTIONS (+9 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.06
Nodes (73): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed() (+65 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.10
Nodes (35): useStorageDiagnostics(), SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage() (+27 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.15
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "fieldValidationCompletionTypes.ts"
Cohesion: 0.12
Nodes (8): FieldValidationGpsOutcome, SyncStatus, completion, Contract, TestFormData, FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState

### Community 23 - "detection/types.ts"
Cohesion: 0.19
Nodes (11): ChecklistObservationId, initialScanSessionState, completedResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW (+3 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.10
Nodes (33): toPersistenceInput(), getManagedScanImageDirectory(), readManagedImageMetadata(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource() (+25 more)

### Community 25 - "fieldReportRepository.ts"
Cohesion: 0.35
Nodes (10): persistSubmissionImageMetadata(), deleteManagedScanImage(), getSubmissionImageUri(), PreparedSubmissionImage, cleanupPreparedImage(), finalizeFieldReport(), FinalizeFieldReportDependencies, toSubmissionEvidence() (+2 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.09
Nodes (25): BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, DiseaseBadge(), DiseaseBadgeProps (+17 more)

### Community 27 - "schema.ts"
Cohesion: 0.05
Nodes (55): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FIELD_VALIDATION_ASSIGNMENT_STATES, FIELD_VALIDATION_GPS_OUTCOMES, FieldReportRow, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow (+47 more)

### Community 28 - "image-preview.test.tsx"
Cohesion: 0.08
Nodes (27): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+19 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncErrors.ts"
Cohesion: 0.13
Nodes (22): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion() (+14 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "Radius"
Cohesion: 0.10
Nodes (24): QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle(), styles (+16 more)

### Community 34 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 35 - "notificationCacheRepository.ts"
Cohesion: 0.09
Nodes (31): mobileNotifications, MobileNotificationsResult, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), createStatementAdapter() (+23 more)

### Community 36 - "Spacing"
Cohesion: 0.15
Nodes (17): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), styles (+9 more)

### Community 37 - "mobileReportStatusesApi.ts"
Cohesion: 0.16
Nodes (21): MOBILE_REPORT_STATUSES_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError() (+13 more)

### Community 38 - "useFieldValidationAssignment.ts"
Cohesion: 0.15
Nodes (12): complete, state, CompleteFieldValidationInput, useFieldValidationAssignment(), GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult (+4 more)

### Community 39 - "useAuth"
Cohesion: 0.14
Nodes (13): AppNavigator(), styles, useAuth(), MobileAttentionLifecycle(), useMobileNotifications(), mockDatabase, mockListScanRecords, DATABASE (+5 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (47): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+39 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.16
Nodes (16): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+8 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.11
Nodes (24): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+16 more)

### Community 44 - "apiClient.ts"
Cohesion: 0.14
Nodes (17): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS (+9 more)

### Community 45 - "toStorageError"
Cohesion: 0.16
Nodes (21): toStorageError(), createOrGetFieldReportDraft(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation(), toFieldReport() (+13 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "useCaneGuardDatabase"
Cohesion: 0.23
Nodes (14): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), useFieldValidationAssignments(), QueryState, usePaginatedScanRecords(), useScanRecordDetails(), useScanRecords() (+6 more)

### Community 48 - "runInference.ts"
Cohesion: 0.14
Nodes (14): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+6 more)

### Community 49 - "DatabaseProvider.tsx"
Cohesion: 0.19
Nodes (12): CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext, DatabaseInitializationStatus, DatabaseInitializationView() (+4 more)

### Community 50 - "recordTypes.ts"
Cohesion: 0.12
Nodes (22): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, ChecklistConsistency, MATRIX (+14 more)

### Community 51 - "ActivityScreen.tsx"
Cohesion: 0.12
Nodes (21): AppButton(), AppButtonProps, AppButtonVariant, styles, ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle() (+13 more)

### Community 53 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 54 - "ThemePreferenceProvider.tsx"
Cohesion: 0.25
Nodes (6): isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 55 - "useAuthorityReviewStatus.test.tsx"
Cohesion: 0.29
Nodes (9): hasStaleAuthorityReviewCache(), database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState, useAuthorityReviewStatus() (+1 more)

### Community 56 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 57 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.17
Nodes (6): createStatementAdapter(), prepareSync(), request, MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 61 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.09
Nodes (50): FieldValidationAssignmentState, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed() (+42 more)

### Community 62 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 63 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 64 - "model-debug.tsx"
Cohesion: 0.16
Nodes (13): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+5 more)

## Knowledge Gaps
- **426 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+421 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `model-debug.tsx`, `Radius`, `online-map-picker.tsx`, `Spacing`, `theme.ts`, `Typography`, `analysis-result.tsx`, `record-details.tsx`, `AuthProvider.tsx`, `field-report.tsx`, `useCaneGuardDatabase`, `DatabaseProvider.tsx`, `ActivityScreen.tsx`, `settings.tsx`, `RecordCard.tsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `notificationCacheRepository.ts`, `fieldReportReviewRepository.ts`, `StorageError`, `useFieldValidationAssignment.ts`, `useAuth`, `possibleMatch.ts`, `scanRecordRepository.ts`, `record-details.tsx`, `field-report.tsx`, `useCaneGuardDatabase`, `DatabaseProvider.tsx`, `fieldValidationCompletionRepository.ts`, `scanImageStorage.ts`, `useAuthorityReviewStatus.test.tsx`, `submissionImageStorage.ts`, `fieldReportRepository.ts`, `schema.ts`, `mobileFieldValidationAssignmentsApi.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `notificationCacheRepository.ts`, `fieldReportReviewRepository.ts`, `scanRecordRepository.ts`, `toStorageError`, `recordValidation.ts`, `useCaneGuardDatabase`, `fieldReportValidation.ts`, `DatabaseProvider.tsx`, `fieldValidationCompletionRepository.ts`, `scanImageStorage.ts`, `detection/types.ts`, `submissionImageStorage.ts`, `fieldReportRepository.ts`, `schema.ts`, `mobileFieldValidationAssignmentsApi.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _426 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06885245901639345 - nodes in this community are weakly interconnected._
- **Should `fieldReportReviewRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `StorageError` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._