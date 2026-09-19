# Graph Report - caneguard-mobile  (2026-09-18)

## Corpus Check
- 299 files · ~151,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1964 nodes · 5807 edges · 82 communities (76 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a2b66fbe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- mobileReportStatusesApi.ts
- global.d.ts
- errors.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- fieldValidationPhotoStorage.ts
- useMobileNotifications.test.tsx
- recordTypes.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- useAuth
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
- saveCompletedScan.ts
- manualMap.ts
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- possibleMatchRepository.test.ts
- phase1LifecycleAcceptance.test.ts
- field-report.tsx
- syncErrors.ts
- fieldReportSyncRepository.ts
- field-report.test.tsx
- home.tsx
- modelContract.ts
- ActivityScreen.tsx
- activity.test.tsx
- mobileReportStatusesV1.ts
- needsAttention.ts
- biometricAuth.ts
- deviceIdentity.ts
- resolveNotificationDestination.ts
- assessImageQuality.ts
- image-preview.test.tsx
- image-preview.tsx
- analysis-result.test.tsx
- AssignmentCard.tsx
- detection/types.ts
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- fieldValidationCompletionValidation.ts
- MockFile
- captureGpsLocation.ts
- assignmentCacheRepository.ts
- v1Qa.ts
- fieldValidationPhotoStorage.test.ts
- toStorageError
- fieldReportTypes.ts
- record-details.tsx
- theme.ts
- FieldReportSyncRepository
- useCaneGuardDatabase
- FieldValidationCompletionSyncRepository
- useCaneGuardModel.web.tsx
- useLocalReport.ts
- StorageError
- useFieldReportDraft.test.tsx
- env.ts
- inferenceErrors.ts
- auth-bootstrap.test.tsx
- MockFile
- records.test.tsx
- record-details.test.tsx
- fieldReportValidation.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 130 edges
2. `toStorageError()` - 97 edges
3. `StorageError` - 83 edges
4. `useAuth()` - 68 edges
5. `Typography` - 47 edges
6. `Spacing` - 45 edges
7. `requireOwnerIdentity()` - 40 edges
8. `CaneGuardDatabase` - 38 edges
9. `Radius` - 36 edges
10. `useCaneGuardDatabase()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `MeasurementChoice()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `ReadyToSubmitChecklist()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `MetadataRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/image-preview.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (82 total, 6 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.11
Nodes (41): RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric(), enrollMobileDevice() (+33 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.10
Nodes (41): toPersistenceInput(), canReuseSourceAsSubmissionImage(), isValidSubmissionImageMetadata(), MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, normalizeMobileReportImageMimeType(), appendMismatchReported(), appendNumber() (+33 more)

### Community 2 - "useTheme"
Cohesion: 0.09
Nodes (31): CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, CompletionActions(), CompletionStatus() (+23 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.05
Nodes (58): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, MOBILE_REPORT_STATUSES_V2_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses() (+50 more)

### Community 5 - "errors.ts"
Cohesion: 0.10
Nodes (26): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+18 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.13
Nodes (16): createStatementAdapter(), insertCompletion(), MIGRATIONS, openTestDatabase(), readMigration(), deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput (+8 more)

### Community 8 - "useMobileNotifications.test.tsx"
Cohesion: 0.09
Nodes (29): MobileAttentionLifecycle(), listCachedMobileNotifications(), toNotification(), MobileNotification, MobileNotificationAdvisory, MobileNotificationAdvisoryStatus, CACHED, database (+21 more)

### Community 10 - "recordTypes.ts"
Cohesion: 0.15
Nodes (22): FieldReportRow, ScanClassScoreRow, ScanQualityWarningRow, ScanRecordRow, ScanSymptomRow, SyncStatus, ChecklistConsistency, ModelLabel (+14 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.12
Nodes (25): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), letterboxRgbPixels(), roundTiesToEven() (+17 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.35
Nodes (12): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+4 more)

### Community 14 - "useAuth"
Cohesion: 0.07
Nodes (29): ForgotPasswordScreen(), SplashScreen(), InputRow(), InputRowProps, LoginScreen(), styles, firstParam(), getInitialCenter() (+21 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.20
Nodes (26): coordinatesAreValid(), getMissingSubmissionRequirements(), hasCompleteClassScores(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeLocationUnavailableReason() (+18 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.14
Nodes (13): ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SMUT_OBSERVATION (+5 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "SyncProvider.tsx"
Cohesion: 0.19
Nodes (18): findLastSuccessfulFieldValidationCompletionSyncAt(), resetStaleSyncingFieldValidationCompletions(), syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey() (+10 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (15): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration2 (+7 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (34): isSafeOwnerIdentity(), SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, EXTENSION_TO_MIME (+26 more)

### Community 21 - "apiClient.ts"
Cohesion: 0.15
Nodes (19): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request, ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS (+11 more)

### Community 22 - "mobileNotificationsApi.ts"
Cohesion: 0.17
Nodes (31): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+23 more)

### Community 23 - "scanRecordRepository.ts"
Cohesion: 0.10
Nodes (36): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), requireOwnerIdentity() (+28 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.09
Nodes (34): insertScan(), persistSubmissionImageMetadata(), ensureManagedScanImageDirectory(), getManagedScanImageDirectory(), getSubmissionImageUri(), readManagedImageMetadata(), copyLegacySourceToCanonical(), generateSubmissionDerivative() (+26 more)

### Community 25 - "useCaneGuardModel.tsx"
Cohesion: 0.08
Nodes (26): formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), ModelSmokeTestScreen(), mockModelRun, mockPreprocessImage, mockRunInference (+18 more)

### Community 26 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.14
Nodes (23): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV2(), findCanonicalField(), formFromParts() (+15 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (18): LEGACY_UNASSIGNED_OWNER_IDENTITY, FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldValidationAssignmentRow, FieldValidationCompletionRow, GPS_CAPTURE_OUTCOMES, LOCATION_UNAVAILABLE_REASONS, MEASUREMENT_PROVENANCES (+10 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "saveCompletedScan.ts"
Cohesion: 0.15
Nodes (13): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), save() (+5 more)

### Community 32 - "manualMap.ts"
Cohesion: 0.12
Nodes (31): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), OnlineMapPicker(), onMapPress(), pan(), selectAtEventLocation() (+23 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.13
Nodes (24): AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock(), AuthActionResponse (+16 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.17
Nodes (22): complete, state, countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), markFieldValidationCompletionFailed() (+14 more)

### Community 35 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 36 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.17
Nodes (6): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, createStatementAdapter(), prepareSync(), request

### Community 37 - "field-report.tsx"
Cohesion: 0.08
Nodes (35): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), concernValueForChoice(), FieldReportScreen(), FieldReportScreenProps, FinalizedReportSummary() (+27 more)

### Community 38 - "syncErrors.ts"
Cohesion: 0.09
Nodes (32): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+24 more)

### Community 39 - "fieldReportSyncRepository.ts"
Cohesion: 0.21
Nodes (16): findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending(), markFieldReportSynced() (+8 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (45): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh (+37 more)

### Community 41 - "home.tsx"
Cohesion: 0.18
Nodes (9): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceClass, ReferenceTone, SectionTitle(), styles (+1 more)

### Community 42 - "modelContract.ts"
Cohesion: 0.18
Nodes (13): V1_CONFIDENCE_CAUTION_THRESHOLD, LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256 (+5 more)

### Community 43 - "ActivityScreen.tsx"
Cohesion: 0.08
Nodes (33): formatDate(), styles, SyncStatusPanel(), styles, SyncStatusRow(), SyncStatusRowProps, MockSyncState, ActivityScreen() (+25 more)

### Community 44 - "activity.test.tsx"
Cohesion: 0.11
Nodes (16): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+8 more)

### Community 46 - "needsAttention.ts"
Cohesion: 0.20
Nodes (12): ACTIVE_ASSIGNMENT_STATES, assignmentItems(), assignmentMeta(), buildNeedsAttention(), compareNullableDates(), NEEDS_ATTENTION_ROW_LIMIT, NeedsAttentionKind, NeedsAttentionSummary (+4 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "resolveNotificationDestination.ts"
Cohesion: 0.23
Nodes (12): findCachedFieldValidationAssignment(), EMPTY_DESTINATIONS, useNotificationDestinations(), notificationDestinationRoute(), resolveNotificationDestination(), database, findAssignment, findLocal (+4 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.40
Nodes (4): ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "image-preview.test.tsx"
Cohesion: 0.12
Nodes (18): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+10 more)

### Community 52 - "image-preview.tsx"
Cohesion: 0.07
Nodes (37): DiseaseReferenceScreen(), REFERENCE_ITEMS, ReferenceItem, styles, MetadataRow(), styles, ActiveOperation, clearPendingSource() (+29 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "AssignmentCard.tsx"
Cohesion: 0.07
Nodes (32): AppCard, Card(), CardProps, CardVariant, styles, ConfirmDialog(), ConfirmDialogProps, styles (+24 more)

### Community 55 - "detection/types.ts"
Cohesion: 0.10
Nodes (25): mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, supportedImageFormats, unsupportedImageFormats, completedResult (+17 more)

### Community 56 - "runInference.ts"
Cohesion: 0.16
Nodes (11): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, asInferenceError(), InferenceError, normalizeScores(), PostprocessedOutput, postprocessOutput() (+3 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.20
Nodes (26): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+18 more)

### Community 58 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.12
Nodes (25): FIELD_VALIDATION_GPS_OUTCOMES, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+17 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.13
Nodes (24): fieldValidationAssignments, FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner() (+16 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.16
Nodes (16): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+8 more)

### Community 63 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 64 - "toStorageError"
Cohesion: 0.26
Nodes (22): toStorageError(), LocationUnavailableReason, compensateManagedImageCopy(), deleteManagedScanImage(), cleanupPreparedImage(), clearLocationUnavailable(), createOrGetFieldReportDraft(), finalizeFieldReport() (+14 more)

### Community 65 - "fieldReportTypes.ts"
Cohesion: 0.13
Nodes (17): FieldReportFormValues, FieldReportAuthoringState, GpsCaptureOutcome, MeasurementProvenance, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS (+9 more)

### Community 66 - "record-details.tsx"
Cohesion: 0.13
Nodes (23): InheritedScanEvidence(), SubmittedCaseEvidence(), CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+15 more)

### Community 67 - "theme.ts"
Cohesion: 0.08
Nodes (44): styles, styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, HEALTHY_FIXTURE (+36 more)

### Community 69 - "useCaneGuardDatabase"
Cohesion: 0.24
Nodes (13): useCaneGuardDatabase(), getStorageErrorMessage(), useFieldValidationAssignments(), MAX_RECORD_PAGE_SIZE, mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+5 more)

### Community 70 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.14
Nodes (5): FieldValidationGpsOutcome, FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState, COMPLETION

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 72 - "useLocalReport.ts"
Cohesion: 0.13
Nodes (12): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, LocalReportOptions, DATABASE (+4 more)

### Community 73 - "StorageError"
Cohesion: 0.18
Nodes (16): DatabaseMigrationGate(), StorageError, mobileNotifications, applyConfirmedRead(), ConfirmedReadMap, confirmedReads, markAllCachedMobileNotificationsRead(), markCachedMobileNotificationRead() (+8 more)

### Community 74 - "useFieldReportDraft.test.tsx"
Cohesion: 0.15
Nodes (10): DATABASE, mockCaptureGpsLocation, mockClearLocationUnavailable, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft (+2 more)

### Community 75 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 76 - "inferenceErrors.ts"
Cohesion: 0.16
Nodes (12): AnalysisResultScreen(), formatThreshold(), ImagePreviewScreen(), isBelowV1ConfidenceCautionThreshold(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError (+4 more)

### Community 79 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 80 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

## Knowledge Gaps
- **502 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+497 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `manualMap.ts`, `record-details.tsx`, `theme.ts`, `field-report.tsx`, `errors.ts`, `home.tsx`, `ActivityScreen.tsx`, `inferenceErrors.ts`, `useAuth`, `image-preview.tsx`, `AssignmentCard.tsx`, `useCaneGuardModel.tsx`, `v1Qa.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileReportStatusesApi.ts`, `errors.ts`, `useMobileNotifications.test.tsx`, `AuthProvider.test.tsx`, `SyncProvider.tsx`, `_layout.tsx`, `saveCompletedScan.ts`, `fieldValidationCompletionRepository.ts`, `field-report.tsx`, `field-report.test.tsx`, `home.tsx`, `ActivityScreen.tsx`, `resolveNotificationDestination.ts`, `assignmentCacheRepository.ts`, `toStorageError`, `record-details.tsx`, `theme.ts`, `useCaneGuardDatabase`, `useLocalReport.ts`, `useFieldReportDraft.test.tsx`, `auth-bootstrap.test.tsx`, `record-details.test.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `mobileReportStatusesApi.ts`, `errors.ts`, `fieldValidationPhotoStorage.ts`, `useMobileNotifications.test.tsx`, `SyncProvider.tsx`, `scanImageStorage.ts`, `scanRecordRepository.ts`, `submissionImageStorage.ts`, `saveCompletedScan.ts`, `fieldValidationCompletionRepository.ts`, `field-report.tsx`, `fieldReportSyncRepository.ts`, `field-report.test.tsx`, `resolveNotificationDestination.ts`, `assignmentCacheRepository.ts`, `record-details.tsx`, `useCaneGuardDatabase`, `useLocalReport.ts`, `StorageError`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10823311748381129 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10202020202020202 - nodes in this community are weakly interconnected._