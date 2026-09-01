# Graph Report - caneguard-mobile  (2026-09-01)

## Corpus Check
- 274 files · ~127,767 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1761 nodes · 5102 edges · 82 communities (79 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a434f12b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.contract.test.ts
- Typography
- fieldReportReviewRepository.ts
- global.d.ts
- errors.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- reportMultipartMapper.ts
- inferenceErrors.ts
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- ActivityScreen
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncFieldValidationCompletion.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- SyncProvider.tsx
- fieldValidationPhotoStorage.ts
- submissionImageStorage.ts
- detection/types.ts
- RecordCard.tsx
- schema.ts
- useTheme
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncErrors.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- recordTypes.ts
- field-report.tsx
- fieldReportSyncRepository.ts
- useLocalReport.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- apiClient.ts
- notificationCacheRepository.ts
- assessImageQuality.ts
- biometricAuth.ts
- deviceIdentity.ts
- useAuth
- saveCompletedScan.ts
- useFieldValidationAssignment.ts
- mobileReportStatusesApi.ts
- analysis-result.test.tsx
- theme.ts
- _layout.tsx
- runInference.ts
- syncFieldReport.ts
- FieldValidationCompletionSyncRepository
- MockFile
- useCaneGuardDatabase
- mobileFieldValidationAssignmentsApi.ts
- compareParityReference.ts
- activity.test.tsx
- toStorageError
- reportReviewTypes.ts
- home.tsx
- use-theme.ts
- syncPendingFieldReports.ts
- fieldValidationCompletionValidation.ts
- notificationCacheRepository.test.ts
- useCaneGuardModel.web.tsx
- useAuthorityReviewStatus.test.tsx
- mapFieldReportToMultipart
- postprocessOutput.ts
- record-details.test.tsx
- activityTypes.ts
- mobileNotificationsApi.test.ts
- MockFile
- phase1LifecycleAcceptance.test.ts
- mobileReportStatusesApi.test.ts
- env.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 59 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `Radius` - 35 edges
8. `CaneGuardDatabase` - 35 edges
9. `useCaneGuardDatabase()` - 32 edges
10. `getStorageErrorMessage()` - 26 edges

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

## Communities (82 total, 3 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (41): RegisterScreen(), readParam(), ResetPasswordScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword() (+33 more)

### Community 1 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.14
Nodes (23): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+15 more)

### Community 2 - "Typography"
Cohesion: 0.08
Nodes (32): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+24 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.14
Nodes (18): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+10 more)

### Community 5 - "errors.ts"
Cohesion: 0.11
Nodes (22): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+14 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "reportMultipartMapper.ts"
Cohesion: 0.20
Nodes (24): IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES, MultipartMapperDependencies, QUALITY_WARNING_KEYS, REPORTED_SEVERITIES (+16 more)

### Community 8 - "inferenceErrors.ts"
Cohesion: 0.19
Nodes (9): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceErrorMessage(), getInferenceStage() (+1 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.10
Nodes (32): fieldReports, scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition() (+24 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.18
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.26
Nodes (14): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 14 - "ActivityScreen"
Cohesion: 0.12
Nodes (12): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, ActivityScreen(), formatActivityCount() (+4 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.13
Nodes (33): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FieldReportSubmissionEvidence (+25 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.11
Nodes (17): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ChecklistObservation, GUIDED_VALIDATION_MAX_QUESTIONS (+9 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncFieldValidationCompletion.ts"
Cohesion: 0.15
Nodes (17): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion() (+9 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (34): collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME, findOrphanedManagedImages(), getManagedImageRootDirectory() (+26 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.18
Nodes (12): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+4 more)

### Community 22 - "SyncProvider.tsx"
Cohesion: 0.22
Nodes (14): syncPendingFieldValidationCompletions(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), latestTimestamp(), mergeSyncBatchResults() (+6 more)

### Community 23 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.31
Nodes (10): deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput, getFieldValidationPhotoDirectory(), isManagedFieldValidationPhotoUri(), MIME_TO_EXTENSION, persistFieldValidationPhoto(), removePhoto() (+2 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.10
Nodes (33): persistSubmissionImageMetadata(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES (+25 more)

### Community 25 - "detection/types.ts"
Cohesion: 0.07
Nodes (37): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+29 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.16
Nodes (16): DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), RecordCard(), RecordCardProps (+8 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (22): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES, MobileNotificationRow (+14 more)

### Community 28 - "useTheme"
Cohesion: 0.09
Nodes (29): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, DisabledRow() (+21 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncErrors.ts"
Cohesion: 0.17
Nodes (16): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+8 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.13
Nodes (24): AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock(), AuthActionResponse (+16 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.24
Nodes (18): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+10 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 36 - "recordTypes.ts"
Cohesion: 0.12
Nodes (22): ChecklistConsistency, MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning (+14 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.11
Nodes (25): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+17 more)

### Community 38 - "fieldReportSyncRepository.ts"
Cohesion: 0.15
Nodes (19): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed() (+11 more)

### Community 39 - "useLocalReport.ts"
Cohesion: 0.28
Nodes (6): LocalReportSummary, DATABASE, mockGetLocalReportSummary, mockUser, LocalReportInput, LocalReportState

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (47): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+39 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.09
Nodes (29): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+21 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (18): InferenceError, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController (+10 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.19
Nodes (15): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+7 more)

### Community 44 - "apiClient.ts"
Cohesion: 0.15
Nodes (19): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS (+11 more)

### Community 45 - "notificationCacheRepository.ts"
Cohesion: 0.13
Nodes (24): mobileNotifications, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification, CACHED (+16 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.50
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "useAuth"
Cohesion: 0.12
Nodes (12): ForgotPasswordScreen(), LoginScreen(), fetchMock, mockReplace, mockUseAuth, mockUseAuth, SESSION, useAuth() (+4 more)

### Community 50 - "saveCompletedScan.ts"
Cohesion: 0.18
Nodes (12): INITIAL_STATE, SaveRecordState, SaveRecordStatus, saveCompletedScan(), SaveCompletedScanOptions, toPersistenceInput(), compensateManagedImageCopy(), ManagedImage (+4 more)

### Community 51 - "useFieldValidationAssignment.ts"
Cohesion: 0.15
Nodes (13): complete, state, markCachedFieldValidationAssignmentInProgress(), CompleteFieldValidationInput, useFieldValidationAssignment(), GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient (+5 more)

### Community 52 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "theme.ts"
Cohesion: 0.13
Nodes (15): InputRow(), InputRowProps, styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps (+7 more)

### Community 55 - "_layout.tsx"
Cohesion: 0.15
Nodes (11): AppNavigator(), styles, MobileAttentionLifecycle(), Probe(), useMobileNotifications(), isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue (+3 more)

### Community 56 - "runInference.ts"
Cohesion: 0.18
Nodes (9): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, asInferenceError(), InferenceRunner, runInference() (+1 more)

### Community 57 - "syncFieldReport.ts"
Cohesion: 0.13
Nodes (4): FieldReportSyncRepository, RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 58 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.14
Nodes (5): SyncStatus, FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState, COMPLETION

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useCaneGuardDatabase"
Cohesion: 0.30
Nodes (13): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), MAX_RECORD_PAGE_SIZE, QueryState, usePaginatedScanRecords(), useScanRecordDetails(), useScanRecords() (+5 more)

### Community 61 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.09
Nodes (51): fieldValidationAssignments, FieldValidationAssignmentState, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord() (+43 more)

### Community 62 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 63 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 64 - "toStorageError"
Cohesion: 0.14
Nodes (29): createCaneGuardDatabaseResources(), StorageError, toStorageError(), assertManagedScanImageUri(), deleteManagedScanImage(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport() (+21 more)

### Community 65 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 66 - "home.tsx"
Cohesion: 0.08
Nodes (28): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+20 more)

### Community 67 - "use-theme.ts"
Cohesion: 0.08
Nodes (34): styles, SplashScreen(), styles, styles, ResetParams, styles, hasVerificationParams(), readParam() (+26 more)

### Community 68 - "syncPendingFieldReports.ts"
Cohesion: 0.20
Nodes (12): SYNC_RETRY_COOLDOWN_MS, syncFieldReport(), activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch(), MAX_SYNC_REPORTS_PER_RUN, syncPendingFieldReports() (+4 more)

### Community 69 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.32
Nodes (11): FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationGpsOutcome, SaveFieldValidationCompletionInput, FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid(), isGpsOutcome(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+3 more)

### Community 70 - "notificationCacheRepository.test.ts"
Cohesion: 0.29
Nodes (6): MobileNotificationsResult, createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration(), MobileNotificationUpdate

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 72 - "useAuthorityReviewStatus.test.tsx"
Cohesion: 0.29
Nodes (8): database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState, useAuthorityReviewStatus(), refreshAuthorityReviewStatus()

### Community 73 - "mapFieldReportToMultipart"
Cohesion: 0.22
Nodes (8): appendMismatchReported(), appendNumber(), appendOptionalText(), mapFieldReportToMultipart(), map(), REPORT, SCAN, TestFormData

### Community 74 - "postprocessOutput.ts"
Cohesion: 0.36
Nodes (4): normalizeScores(), PostprocessedOutput, postprocessOutput(), softmax()

### Community 75 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 76 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 77 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 79 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.33
Nodes (3): createStatementAdapter(), prepareSync(), request

### Community 81 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

## Knowledge Gaps
- **449 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+444 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `home.tsx`, `use-theme.ts`, `Typography`, `field-report.tsx`, `errors.ts`, `inferenceErrors.ts`, `analysis-result.tsx`, `record-details.tsx`, `ActivityScreen`, `useAuth`, `theme.ts`, `RecordCard.tsx`, `useCaneGuardDatabase`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `StorageError` connect `toStorageError` to `fieldValidationCompletionRepository.ts`, `fieldReportReviewRepository.ts`, `fieldValidationCompletionValidation.ts`, `errors.ts`, `fieldReportSyncRepository.ts`, `scanRecordRepository.ts`, `notificationCacheRepository.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `saveCompletedScan.ts`, `scanImageStorage.ts`, `fieldValidationPhotoStorage.ts`, `submissionImageStorage.ts`, `detection/types.ts`, `useCaneGuardDatabase`, `mobileFieldValidationAssignmentsApi.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `AuthProvider.test.tsx`, `SyncProvider.tsx`, `useTheme`, `field-report.tsx`, `fieldReportSyncRepository.ts`, `useLocalReport.ts`, `possibleMatch.ts`, `record-details.tsx`, `notificationCacheRepository.ts`, `useFieldValidationAssignment.ts`, `theme.ts`, `_layout.tsx`, `useCaneGuardDatabase`, `mobileFieldValidationAssignmentsApi.ts`, `toStorageError`, `home.tsx`, `use-theme.ts`, `useAuthorityReviewStatus.test.tsx`, `record-details.test.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _449 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10204081632653061 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.contract.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._