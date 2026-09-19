# Graph Report - caneguard-mobile  (2026-09-20)

## Corpus Check
- 305 files · ~155,452 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1986 nodes · 5902 edges · 87 communities (81 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03ab67f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- fieldReportReviewRepository.ts
- global.d.ts
- errors.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- fieldValidationPhotoStorage.ts
- useMobileNotifications.ts
- recordMappers.ts
- preprocessImage.ts
- tokenStore.ts
- recordValidation.ts
- activity.test.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- SyncProvider.tsx
- migrations.test.ts
- scanImageStorage.ts
- apiClient.ts
- mobileNotificationsApi.ts
- scanRecordRepository.ts
- submissionImageStorage.ts
- useCaneGuardModel.tsx
- reportMultipartMapper.contract.test.ts
- schema.ts
- _layout.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- detection/types.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- analysis-result.tsx
- mobileFieldValidationAssignmentsApi.test.ts
- field-report.tsx
- syncErrors.ts
- fieldValidationCompletionValidation.ts
- field-report.test.tsx
- home.tsx
- modelContract.ts
- refreshAll.ts
- needsAttention.ts
- mobileReportStatusesV1.ts
- model-debug.tsx
- AuthProvider.test.tsx
- deviceIdentity.ts
- fieldReportSyncRepository.ts
- reportReviewTypes.ts
- image-preview.test.tsx
- ActivityScreen.tsx
- analysis-result.test.tsx
- consolidated-components.test.tsx
- model-smoke-test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- syncFieldValidationCompletion.ts
- MockFile
- captureGpsLocation.ts
- useFieldValidationAssignment.ts
- v1Qa.ts
- fieldValidationPhotoStorage.test.ts
- toStorageError
- fieldReportTypes.ts
- record-details.tsx
- useAuth
- FieldReportSyncRepository
- useCaneGuardDatabase
- mobileReportStatusesApi.ts
- reportRepository.ts
- recordTypes.ts
- mobileReportStatusesApi.test.ts
- env.ts
- ImagePreviewScreen
- RecordCard.tsx
- submissionImageStorage.test.ts
- FieldValidationCompletionSyncRepository
- useFieldValidationAssignments.ts
- fieldReportValidation.test.ts
- records.test.tsx
- activityTypes.ts
- reportMultipartMapper.test.ts
- designGuards.test.ts
- auth-bootstrap.test.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 134 edges
2. `toStorageError()` - 97 edges
3. `StorageError` - 82 edges
4. `useAuth()` - 68 edges
5. `Typography` - 49 edges
6. `Spacing` - 47 edges
7. `requireOwnerIdentity()` - 40 edges
8. `Radius` - 38 edges
9. `CaneGuardDatabase` - 38 edges
10. `useCaneGuardDatabase()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `FieldReportFormValues` --references--> `MeasurementProvenance`  [EXTRACTED]
  src/app/field-report.tsx → src/database/schema.ts
- `MeasurementChoice()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `ReadyToSubmitChecklist()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (87 total, 6 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.12
Nodes (39): RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric(), enrollMobileDevice() (+31 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.15
Nodes (32): FieldReportUploadRecord, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+24 more)

### Community 2 - "useTheme"
Cohesion: 0.11
Nodes (23): CompletionActions(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), VisitContext(), MetadataRow(), SettingsScreen() (+15 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.11
Nodes (26): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+18 more)

### Community 5 - "errors.ts"
Cohesion: 0.10
Nodes (28): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+20 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.13
Nodes (16): createStatementAdapter(), insertCompletion(), MIGRATIONS, openTestDatabase(), readMigration(), deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput (+8 more)

### Community 8 - "useMobileNotifications.ts"
Cohesion: 0.08
Nodes (42): MobileAttentionLifecycle(), applyConfirmedRead(), ConfirmedReadMap, confirmedReads, listCachedMobileNotifications(), markAllCachedMobileNotificationsRead(), markCachedMobileNotificationRead(), rememberConfirmedRead() (+34 more)

### Community 10 - "recordMappers.ts"
Cohesion: 0.15
Nodes (12): FieldReportRow, ScanClassScoreRow, ScanQualityWarningRow, ScanRecordRow, ScanSymptomRow, ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES (+4 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.12
Nodes (25): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), letterboxRgbPixels(), roundTiesToEven() (+17 more)

### Community 12 - "tokenStore.ts"
Cohesion: 0.16
Nodes (25): AuthProvider(), SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession(), clearMobileSessionBestEffort() (+17 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.33
Nodes (13): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "activity.test.tsx"
Cohesion: 0.08
Nodes (21): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+13 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.20
Nodes (26): coordinatesAreValid(), getMissingSubmissionRequirements(), hasCompleteClassScores(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeLocationUnavailableReason() (+18 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.09
Nodes (21): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_OBSERVATIONS, ChecklistObservation (+13 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "SyncProvider.tsx"
Cohesion: 0.20
Nodes (15): syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey(), inferApiReachability(), isNetworkOnline() (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (15): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration2 (+7 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (35): isSafeOwnerIdentity(), assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+27 more)

### Community 21 - "apiClient.ts"
Cohesion: 0.20
Nodes (17): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+9 more)

### Community 22 - "mobileNotificationsApi.ts"
Cohesion: 0.13
Nodes (34): MOBILE_NOTIFICATIONS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed() (+26 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.13
Nodes (24): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), requireOwnerIdentity() (+16 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.14
Nodes (28): insertScan(), toPersistenceInput(), getManagedScanImageDirectory(), readManagedImageMetadata(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri() (+20 more)

### Community 25 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (16): MODEL_OUTPUT, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+8 more)

### Community 26 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV2(), findCanonicalField(), formFromParts() (+14 more)

### Community 27 - "schema.ts"
Cohesion: 0.07
Nodes (24): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FIELD_VALIDATION_ASSIGNMENT_STATES, FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationAssignmentRow, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+16 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "detection/types.ts"
Cohesion: 0.15
Nodes (13): initialScanSessionState, completedResult, InferenceTimings, ScanSessionState, ScanSessionStatus, NOW, mockDatabase, mockRandomUUID (+5 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.11
Nodes (36): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+28 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.12
Nodes (26): LOCAL_SESSION_MAX_AGE_MS, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock() (+18 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.24
Nodes (18): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+10 more)

### Community 35 - "analysis-result.tsx"
Cohesion: 0.14
Nodes (19): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), formatThreshold(), ScoreRow(), SectionCard(), styles (+11 more)

### Community 36 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 37 - "field-report.tsx"
Cohesion: 0.08
Nodes (38): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), concernValueForChoice(), FieldReportFormValues, FieldReportScreen(), FieldReportScreenProps (+30 more)

### Community 38 - "syncErrors.ts"
Cohesion: 0.09
Nodes (34): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+26 more)

### Community 39 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.35
Nodes (10): FieldValidationGpsOutcome, SaveFieldValidationCompletionInput, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), validateFieldValidationCompletionInput(), validateRequiredText() (+2 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (48): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh (+40 more)

### Community 41 - "home.tsx"
Cohesion: 0.09
Nodes (24): HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, firstParam(), getInitialCenter(), ManualMapScreen() (+16 more)

### Community 42 - "modelContract.ts"
Cohesion: 0.18
Nodes (12): isBelowV1ConfidenceCautionThreshold(), V1_CONFIDENCE_CAUTION_THRESHOLD, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, MODEL_FILENAME (+4 more)

### Community 43 - "refreshAll.ts"
Cohesion: 0.42
Nodes (6): describeRefreshAllResult(), REFRESH_ALL_TARGET_LABELS, RefreshAllResult, RefreshAllTarget, runRefreshAll(), useRefreshAll()

### Community 44 - "needsAttention.ts"
Cohesion: 0.10
Nodes (27): mockAttentionItems, mockMarkRead, mockRouterPush, EMPTY_DATABASE, ACTIVE_ASSIGNMENT_STATES, assignmentItems(), assignmentMeta(), buildNeedsAttention() (+19 more)

### Community 46 - "model-debug.tsx"
Cohesion: 0.15
Nodes (15): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+7 more)

### Community 47 - "AuthProvider.test.tsx"
Cohesion: 0.26
Nodes (7): SESSION, authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability()

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "fieldReportSyncRepository.ts"
Cohesion: 0.18
Nodes (18): LEGACY_UNASSIGNED_OWNER_IDENTITY, findFieldReportById(), findScanRecordIdForCase(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed() (+10 more)

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.23
Nodes (10): contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation(), isKnownAuthorityReviewStatus() (+2 more)

### Community 51 - "image-preview.test.tsx"
Cohesion: 0.08
Nodes (28): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+20 more)

### Community 52 - "ActivityScreen.tsx"
Cohesion: 0.09
Nodes (40): DiseaseReferenceScreen(), styles, styles, styles, styles, styles, BottomNav(), BottomNavProps (+32 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "consolidated-components.test.tsx"
Cohesion: 0.08
Nodes (27): AppCard, Card(), CardProps, CardVariant, styles, ConfirmDialog(), ConfirmDialogProps, styles (+19 more)

### Community 55 - "model-smoke-test.tsx"
Cohesion: 0.13
Nodes (14): HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), ModelSmokeTestScreen(), SmokeVerification, styles, mockPreprocessImage, mockRun (+6 more)

### Community 56 - "runInference.ts"
Cohesion: 0.10
Nodes (18): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+10 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.18
Nodes (28): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+20 more)

### Community 58 - "syncFieldValidationCompletion.ts"
Cohesion: 0.16
Nodes (16): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion() (+8 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 61 - "useFieldValidationAssignment.ts"
Cohesion: 0.12
Nodes (22): complete, state, fieldValidationAssignments, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments() (+14 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.16
Nodes (16): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+8 more)

### Community 63 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 64 - "toStorageError"
Cohesion: 0.14
Nodes (34): StorageError, toStorageError(), scanRecords, persistSubmissionImageMetadata(), deleteManagedScanImage(), getSubmissionImageUri(), validatePreparationInput(), cleanupPreparedImage() (+26 more)

### Community 65 - "fieldReportTypes.ts"
Cohesion: 0.11
Nodes (25): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, FieldReportAuthoringState (+17 more)

### Community 66 - "record-details.tsx"
Cohesion: 0.19
Nodes (14): CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel(), ObservationList() (+6 more)

### Community 67 - "useAuth"
Cohesion: 0.06
Nodes (46): ForgotPasswordScreen(), styles, SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles (+38 more)

### Community 69 - "useCaneGuardDatabase"
Cohesion: 0.13
Nodes (22): useCaneGuardDatabase(), getStorageErrorMessage(), buildConditions(), buildFieldReportJoinCondition(), listScanRecords(), MAX_RECORD_PAGE_SIZE, mockDatabase, mockListScanRecords (+14 more)

### Community 70 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 71 - "reportRepository.ts"
Cohesion: 0.18
Nodes (15): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+7 more)

### Community 72 - "recordTypes.ts"
Cohesion: 0.16
Nodes (17): ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, ScanRecordRepository, ScanRecordWriteRepository (+9 more)

### Community 75 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 76 - "ImagePreviewScreen"
Cohesion: 0.43
Nodes (4): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode

### Community 77 - "RecordCard.tsx"
Cohesion: 0.17
Nodes (14): DiseasePill(), DiseasePillProps, DiseasePillVariant, VARIANT_MAP, formatSavedAt(), RecordCard(), RecordCardProps, styles (+6 more)

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (9): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES (+1 more)

### Community 79 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.17
Nodes (4): SyncStatus, FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState

### Community 80 - "useFieldValidationAssignments.ts"
Cohesion: 0.29
Nodes (9): FieldValidationAssignmentState, FieldValidationAssignment, AssignmentState, ActiveRefresh, activeRefreshes, executeRefresh(), FieldValidationAssignmentsRefreshResult, refreshFieldValidationAssignments() (+1 more)

### Community 82 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 83 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 84 - "reportMultipartMapper.test.ts"
Cohesion: 0.33
Nodes (4): map(), REPORT, SCAN, TestFormData

### Community 85 - "designGuards.test.ts"
Cohesion: 0.50
Nodes (3): contrastRatio(), relLuminance(), Colors

## Knowledge Gaps
- **508 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+503 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `record-details.tsx`, `useAuth`, `analysis-result.tsx`, `field-report.tsx`, `errors.ts`, `home.tsx`, `ImagePreviewScreen`, `RecordCard.tsx`, `model-debug.tsx`, `activity.test.tsx`, `ActivityScreen.tsx`, `consolidated-components.test.tsx`, `model-smoke-test.tsx`, `v1Qa.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `record-details.tsx`, `fieldValidationCompletionRepository.ts`, `fieldReportReviewRepository.ts`, `errors.ts`, `field-report.tsx`, `fieldValidationPhotoStorage.ts`, `useMobileNotifications.ts`, `useCaneGuardDatabase`, `field-report.test.tsx`, `reportRepository.ts`, `needsAttention.ts`, `useFieldValidationAssignments.ts`, `fieldReportSyncRepository.ts`, `SyncProvider.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `useFieldValidationAssignment.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `useTheme`, `fieldReportReviewRepository.ts`, `errors.ts`, `useMobileNotifications.ts`, `SyncProvider.tsx`, `_layout.tsx`, `field-report.tsx`, `field-report.test.tsx`, `home.tsx`, `needsAttention.ts`, `AuthProvider.test.tsx`, `ActivityScreen.tsx`, `useFieldValidationAssignment.ts`, `toStorageError`, `fieldReportTypes.ts`, `record-details.tsx`, `useCaneGuardDatabase`, `reportRepository.ts`, `useFieldValidationAssignments.ts`, `auth-bootstrap.test.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _508 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12427409988385599 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14583333333333334 - nodes in this community are weakly interconnected._