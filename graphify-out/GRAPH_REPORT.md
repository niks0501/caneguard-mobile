# Graph Report - 01M25BDXS6APYTHW11WBA8KF02  (2026-09-10)

## Corpus Check
- 277 files · ~131,719 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1793 nodes · 5259 edges · 79 communities (76 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `02a87bce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- use-theme.ts
- fieldReportReviewRepository.ts
- global.d.ts
- errors.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- localDataLifecycle.ts
- assignmentCacheRepository.ts
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- ActivityScreen.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- syncFieldValidationCompletion.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- mobileReportStatusesApi.ts
- fieldValidationCompletionValidation.ts
- submissionImageStorage.ts
- scan.test.tsx
- RecordCard.tsx
- schema.ts
- settings.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncErrors.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- saveCompletedScan.ts
- useTheme
- fieldReportSyncRepository.ts
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- apiClient.ts
- notificationCacheRepository.ts
- assessImageQuality.ts
- biometricAuth.ts
- deviceIdentity.ts
- auth-bootstrap.test.tsx
- detection/types.ts
- useFieldValidationAssignment.ts
- Radius
- analysis-result.test.tsx
- theme.ts
- _layout.tsx
- runInference.ts
- syncFieldReport.ts
- FieldValidationCompletionSyncRepository
- MockFile
- useRecords.ts
- mobileFieldValidationAssignmentsApi.ts
- compareParityReference.ts
- activity.test.tsx
- toStorageError
- reportReviewTypes.ts
- home.tsx
- useAuth
- syncPendingFieldReports.ts
- mobileReportStatusesApi.test.ts
- notificationCacheRepository.test.ts
- useCaneGuardModel.web.tsx
- model-debug.test.tsx
- env.ts
- image-preview.test.tsx
- submissionImageStorage.test.ts
- phase1LifecycleAcceptance.test.ts
- recordTypes.ts
- useMobileNotifications.test.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 92 edges
3. `StorageError` - 79 edges
4. `useAuth()` - 64 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `CaneGuardDatabase` - 37 edges
8. `requireOwnerIdentity()` - 37 edges
9. `Radius` - 35 edges
10. `useCaneGuardDatabase()` - 34 edges

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

## Communities (79 total, 3 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (41): ForgotPasswordScreen(), RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric() (+33 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (55): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+47 more)

### Community 2 - "use-theme.ts"
Cohesion: 0.13
Nodes (22): styles, DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+14 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.11
Nodes (26): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+18 more)

### Community 5 - "errors.ts"
Cohesion: 0.08
Nodes (36): FieldReportScreen(), CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider() (+28 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "localDataLifecycle.ts"
Cohesion: 0.09
Nodes (25): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), fieldReports (+17 more)

### Community 8 - "assignmentCacheRepository.ts"
Cohesion: 0.14
Nodes (23): fieldValidationAssignments, FieldValidationAssignmentState, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment() (+15 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.14
Nodes (20): scanClassScores, scanQualityWarnings, scanSymptoms, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository(), findScanRecordById(), listManagedImageUris() (+12 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.33
Nodes (13): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "ActivityScreen.tsx"
Cohesion: 0.14
Nodes (17): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), openNotification(), StateCard(), styles (+9 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.07
Nodes (42): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, FieldReportAuthoringState (+34 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.10
Nodes (19): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ChecklistObservation, ChecklistObservationId (+11 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncFieldValidationCompletion.ts"
Cohesion: 0.16
Nodes (15): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateImage() (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.11
Nodes (14): LEGACY_UNASSIGNED_OWNER_IDENTITY, migration0, migration1, migration10, migration11, migration12, migration2, migration3 (+6 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (37): isSafeOwnerIdentity(), assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory() (+29 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.16
Nodes (14): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+6 more)

### Community 22 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.31
Nodes (11): FIELD_VALIDATION_GPS_OUTCOMES, validateCompletion(), invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+3 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.16
Nodes (20): insertScan(), getManagedScanImageDirectory(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES (+12 more)

### Community 25 - "scan.test.tsx"
Cohesion: 0.15
Nodes (15): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanHarness() (+7 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.11
Nodes (21): InheritedScanEvidence(), DiseaseBadge(), DiseaseBadgeProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles (+13 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (22): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, GPS_CAPTURE_OUTCOMES, MobileNotificationRow, mobileNotifications (+14 more)

### Community 28 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncErrors.ts"
Cohesion: 0.26
Nodes (11): syncFieldValidationCompletion(), executeBatch(), AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError, SyncErrorCode (+3 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.10
Nodes (38): firstParam(), getInitialCenter(), ManualMapScreen(), draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl() (+30 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.13
Nodes (25): LOCAL_SESSION_MAX_AGE_MS, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock() (+17 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.25
Nodes (17): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending(), markFieldValidationCompletionSynced() (+9 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 36 - "saveCompletedScan.ts"
Cohesion: 0.32
Nodes (10): SaveCompletedScanOptions, toPersistenceInput(), compensateManagedImageCopy(), isLegacyUnsupportedSource(), prepareSubmissionImage(), readPersistedArtifact(), canReuseSourceAsSubmissionImage(), isValidSubmissionImageMetadata() (+2 more)

### Community 37 - "useTheme"
Cohesion: 0.07
Nodes (45): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+37 more)

### Community 38 - "fieldReportSyncRepository.ts"
Cohesion: 0.16
Nodes (27): findLastSuccessfulFieldValidationCompletionSyncAt(), resetStaleSyncingFieldValidationCompletions(), syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions (+19 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.17
Nodes (16): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+8 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (47): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+39 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.13
Nodes (20): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+12 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.14
Nodes (14): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+6 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.12
Nodes (24): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+16 more)

### Community 44 - "apiClient.ts"
Cohesion: 0.12
Nodes (19): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request, ApiHttpError, apiRequest() (+11 more)

### Community 45 - "notificationCacheRepository.ts"
Cohesion: 0.19
Nodes (17): listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification, MobileNotificationsState, ActiveRefresh (+9 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 50 - "detection/types.ts"
Cohesion: 0.14
Nodes (14): initialScanSessionState, completedResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW, mockDatabase (+6 more)

### Community 51 - "useFieldValidationAssignment.ts"
Cohesion: 0.15
Nodes (13): complete, state, markCachedFieldValidationAssignmentInProgress(), CompleteFieldValidationInput, useFieldValidationAssignment(), GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient (+5 more)

### Community 52 - "Radius"
Cohesion: 0.15
Nodes (14): styles, styles, SymptomChecklistScreen(), BrandedScreenHeaderProps, styles, ProgressBar(), ProgressBarProps, styles (+6 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "theme.ts"
Cohesion: 0.10
Nodes (18): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, CHIP_CONFIG, StatusChip(), StatusChipProps (+10 more)

### Community 55 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 56 - "runInference.ts"
Cohesion: 0.14
Nodes (14): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+6 more)

### Community 57 - "syncFieldReport.ts"
Cohesion: 0.36
Nodes (5): MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions

### Community 58 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.14
Nodes (5): FieldValidationGpsOutcome, FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState, COMPLETION

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useRecords.ts"
Cohesion: 0.13
Nodes (14): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, MAX_RECORD_PAGE_SIZE, mockDatabase (+6 more)

### Community 61 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.18
Nodes (28): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+20 more)

### Community 62 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 63 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 64 - "toStorageError"
Cohesion: 0.11
Nodes (39): StorageError, toStorageError(), requireOwnerIdentity(), scanRecords, persistSubmissionImageMetadata(), getSubmissionImageUri(), validatePreparationInput(), cleanupPreparedImage() (+31 more)

### Community 65 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 66 - "home.tsx"
Cohesion: 0.11
Nodes (16): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+8 more)

### Community 67 - "useAuth"
Cohesion: 0.07
Nodes (42): styles, SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles, styles (+34 more)

### Community 68 - "syncPendingFieldReports.ts"
Cohesion: 0.11
Nodes (20): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, ActiveRun, activeRuns, DatabaseRunState, FieldValidationCompletionSyncBatchResult, SYNC_RETRY_COOLDOWN_MS, SyncContextValue (+12 more)

### Community 70 - "notificationCacheRepository.test.ts"
Cohesion: 0.29
Nodes (6): MobileNotificationsResult, createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration(), MobileNotificationUpdate

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 72 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 73 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 74 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (12): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+4 more)

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 79 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.29
Nodes (4): createStatementAdapter(), prepareSync(), request, refreshMobileNotifications()

### Community 80 - "recordTypes.ts"
Cohesion: 0.17
Nodes (17): SyncStatus, ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, ScanRecordRepository (+9 more)

### Community 81 - "useMobileNotifications.test.tsx"
Cohesion: 0.22
Nodes (8): MobileAttentionLifecycle(), CACHED, database, listCache, markSessionExpired, Probe(), refreshService, useMobileNotifications()

## Knowledge Gaps
- **453 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `home.tsx`, `useAuth`, `use-theme.ts`, `errors.ts`, `analysis-result.tsx`, `record-details.tsx`, `ActivityScreen.tsx`, `Radius`, `theme.ts`, `RecordCard.tsx`, `settings.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `fieldReportReviewRepository.ts`, `errors.ts`, `assignmentCacheRepository.ts`, `AuthProvider.test.tsx`, `fieldReportValidation.ts`, `settings.tsx`, `useTheme`, `fieldReportSyncRepository.ts`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `notificationCacheRepository.ts`, `auth-bootstrap.test.tsx`, `useFieldValidationAssignment.ts`, `_layout.tsx`, `useRecords.ts`, `toStorageError`, `home.tsx`, `useMobileNotifications.test.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldValidationCompletionRepository.ts`, `fieldReportReviewRepository.ts`, `saveCompletedScan.ts`, `errors.ts`, `useTheme`, `localDataLifecycle.ts`, `assignmentCacheRepository.ts`, `fieldReportSyncRepository.ts`, `scanRecordRepository.ts`, `record-details.tsx`, `possibleMatch.ts`, `notificationCacheRepository.ts`, `reportRepository.ts`, `useMobileNotifications.test.tsx`, `useFieldValidationAssignment.ts`, `scanImageStorage.ts`, `useRecords.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10374149659863946 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07062146892655367 - nodes in this community are weakly interconnected._