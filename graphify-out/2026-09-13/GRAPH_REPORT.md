# Graph Report - 01M2DG4BRS96HKRJQ2B9TYZAJ5  (2026-09-13)

## Corpus Check
- 282 files · ~134,693 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1842 nodes · 5378 edges · 78 communities (76 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52aea5dc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mapAuthError
- reportMultipartMapper.ts
- useTheme
- mobileReportStatusesApi.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- localDataLifecycle.ts
- mobileNotificationsApi.ts
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- ActivityScreen
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- useCaneGuardModel.tsx
- recordTypes.ts
- useFieldValidationAssignment.ts
- submissionImageStorage.ts
- scan.test.tsx
- ComponentTokens
- schema.ts
- _layout.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- mobileAuthApi.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- notificationCacheRepository.ts
- fieldReportRepository.ts
- field-report.tsx
- SyncProvider.tsx
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- model-debug.test.tsx
- record-details.tsx
- activity.test.tsx
- fieldValidationPhotoStorage.test.ts
- modelContract.ts
- biometricAuth.ts
- deviceIdentity.ts
- possibleMatchRepository.test.ts
- recordMappers.ts
- useMobileNotifications.test.tsx
- ActivityScreen.tsx
- analysis-result.test.tsx
- theme.ts
- useAuth
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- syncFieldValidationCompletion.ts
- MockFile
- listScanRecords
- assignmentCacheRepository.ts
- v1Qa.ts
- scan.tsx
- toStorageError
- reportReviewTypes.ts
- home.tsx
- Typography
- syncErrors.ts
- record-details.test.tsx
- mobileNotificationsApi.test.ts
- useCaneGuardModel.web.tsx
- activityTypes.ts
- notificationCacheRepository.test.ts
- image-preview.test.tsx
- MockFile
- phase1LifecycleAcceptance.test.ts
- detection/types.ts

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
- `ReporterMismatchSection()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (78 total, 2 thin omitted)

### Community 0 - "mapAuthError"
Cohesion: 0.10
Nodes (25): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), authError(), changeEmail(), changePassword(), disableBiometric() (+17 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (62): toPersistenceInput(), canReuseSourceAsSubmissionImage(), isValidSubmissionImageMetadata(), MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, normalizeMobileReportImageMimeType(), appendMismatchReported(), appendNumber() (+54 more)

### Community 2 - "useTheme"
Cohesion: 0.08
Nodes (33): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, DebugRow() (+25 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (45): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+37 more)

### Community 5 - "StorageError"
Cohesion: 0.11
Nodes (25): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+17 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "localDataLifecycle.ts"
Cohesion: 0.13
Nodes (13): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), fieldReports (+5 more)

### Community 8 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.10
Nodes (27): CaneGuardDatabase, useDatabaseState(), requireOwnerIdentity(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics (+19 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.13
Nodes (24): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), letterboxRgbPixels(), getInitialResizeAction() (+16 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.24
Nodes (15): getChecklistConsistency(), createCompletedScanDraft(), invalid(), LEGACY_MODEL_LABELS, QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores() (+7 more)

### Community 14 - "ActivityScreen"
Cohesion: 0.12
Nodes (12): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, ActivityScreen(), formatActivityCount() (+4 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.06
Nodes (52): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FieldReportSubmissionEvidence (+44 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.10
Nodes (18): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_MODEL_LABELS, CHECKLIST_OBSERVATIONS (+10 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.18
Nodes (15): LEGACY_UNASSIGNED_OWNER_IDENTITY, findFieldReportById(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.11
Nodes (13): migration0, migration1, migration10, migration11, migration12, migration2, migration3, migration4 (+5 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (37): isSafeOwnerIdentity(), assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+29 more)

### Community 21 - "useCaneGuardModel.tsx"
Cohesion: 0.13
Nodes (17): ModelSmokeTestScreen(), mockPreprocessImage, mockRun, mockRunInference, mockUseCaneGuardModel, MODEL_OUTPUT, CaneGuardModelContext, CaneGuardModelController (+9 more)

### Community 22 - "recordTypes.ts"
Cohesion: 0.18
Nodes (13): SyncStatus, ChecklistConsistency, ScanRecordRepository, ScanRecordWriteRepository, DEFAULT_RECORD_PAGE_SIZE, MAX_RECORD_PAGE_SIZE, RecordsByLabel, ScanRecordDetails (+5 more)

### Community 23 - "useFieldValidationAssignment.ts"
Cohesion: 0.14
Nodes (26): complete, state, markCachedFieldValidationAssignmentInProgress(), FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid() (+18 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.09
Nodes (29): insertScan(), getManagedScanImageDirectory(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS (+21 more)

### Community 25 - "scan.test.tsx"
Cohesion: 0.14
Nodes (18): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanHarness() (+10 more)

### Community 26 - "ComponentTokens"
Cohesion: 0.15
Nodes (14): DiseaseBadge(), DiseaseBadgeProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP (+6 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (22): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FIELD_VALIDATION_GPS_OUTCOMES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+14 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "mobileAuthApi.ts"
Cohesion: 0.13
Nodes (29): AUTH_ERROR_MESSAGES, AuthRequestKind, invalidResponseError(), isFutureIsoDate(), isMobileUser(), isRecord(), isRegistrationUser(), isValidSessionExpiry() (+21 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (34): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+26 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.16
Nodes (15): fetchMock, LOCAL_SESSION_MAX_AGE_MS, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError() (+7 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.24
Nodes (18): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+10 more)

### Community 35 - "notificationCacheRepository.ts"
Cohesion: 0.16
Nodes (21): mobileNotifications, MobileNotificationsResult, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification (+13 more)

### Community 36 - "fieldReportRepository.ts"
Cohesion: 0.38
Nodes (9): persistSubmissionImageMetadata(), getSubmissionImageUri(), cleanupPreparedImage(), finalizeFieldReport(), FinalizeFieldReportDependencies, toSubmissionEvidence(), toSubmissionPreparationInput(), SaveFieldReportDraftInput (+1 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.09
Nodes (28): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+20 more)

### Community 38 - "SyncProvider.tsx"
Cohesion: 0.11
Nodes (26): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+18 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.17
Nodes (15): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+7 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.07
Nodes (43): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+35 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.14
Nodes (19): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+11 more)

### Community 42 - "model-debug.test.tsx"
Cohesion: 0.12
Nodes (14): formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel (+6 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.13
Nodes (23): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+15 more)

### Community 44 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 45 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 46 - "modelContract.ts"
Cohesion: 0.27
Nodes (8): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_SHA256, MODEL_VERSION

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 50 - "recordMappers.ts"
Cohesion: 0.21
Nodes (7): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, QualityWarning, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS, mapScanRecordDetails(), mapScanRecordListItem(), StoredClassScore

### Community 51 - "useMobileNotifications.test.tsx"
Cohesion: 0.22
Nodes (8): MobileAttentionLifecycle(), CACHED, database, listCache, markSessionExpired, Probe(), refreshService, useMobileNotifications()

### Community 52 - "ActivityScreen.tsx"
Cohesion: 0.10
Nodes (27): firstParam(), getInitialCenter(), ManualMapScreen(), styles, styles, SymptomChecklistScreen(), AppButton(), BottomNav() (+19 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "theme.ts"
Cohesion: 0.09
Nodes (23): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, ProgressBar(), ProgressBarProps, styles (+15 more)

### Community 55 - "useAuth"
Cohesion: 0.11
Nodes (20): SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles, mockReplace, mockUseAuth (+12 more)

### Community 56 - "runInference.ts"
Cohesion: 0.14
Nodes (13): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores(), PostprocessedOutput (+5 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.05
Nodes (54): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath() (+46 more)

### Community 58 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (19): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, mapFieldValidationCompletionToMultipart(), validateImage() (+11 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "listScanRecords"
Cohesion: 0.29
Nodes (6): buildConditions(), buildFieldReportJoinCondition(), listScanRecords(), mockDatabase, mockListScanRecords, usePaginatedScanRecords()

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.13
Nodes (25): fieldValidationAssignments, FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), replaceCachedFieldValidationAssignments(), requireOwner() (+17 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.15
Nodes (17): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+9 more)

### Community 63 - "scan.tsx"
Cohesion: 0.36
Nodes (7): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource()

### Community 64 - "toStorageError"
Cohesion: 0.16
Nodes (27): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError(), mockDatabase, mockRandomUUID, mockSaveCompletedScan, useScanRecordDetails() (+19 more)

### Community 65 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 66 - "home.tsx"
Cohesion: 0.12
Nodes (18): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+10 more)

### Community 67 - "Typography"
Cohesion: 0.12
Nodes (23): styles, styles, ResetParams, styles, DevelopmentStorageDebugScreen(), DiagnosticRow(), styles, hasVerificationParams() (+15 more)

### Community 68 - "syncErrors.ts"
Cohesion: 0.12
Nodes (24): invalid(), validateCompletion(), SYNC_RETRY_COOLDOWN_MS, AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError (+16 more)

### Community 69 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 70 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 72 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 73 - "notificationCacheRepository.test.ts"
Cohesion: 0.40
Nodes (4): createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration()

### Community 74 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (12): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+4 more)

### Community 79 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.33
Nodes (3): createStatementAdapter(), prepareSync(), request

### Community 80 - "detection/types.ts"
Cohesion: 0.22
Nodes (11): ChecklistObservationId, MATRIX, MatrixCase, ModelLabel, ClassScore, InferenceTimings, ReportedSeverity, ScanSessionStatus (+3 more)

## Knowledge Gaps
- **471 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+466 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `toStorageError`, `mapAuthError`, `home.tsx`, `Typography`, `online-map-picker.tsx`, `field-report.tsx`, `StorageError`, `analysis-result.tsx`, `model-debug.test.tsx`, `record-details.tsx`, `ActivityScreen`, `ActivityScreen.tsx`, `theme.ts`, `useAuth`, `ComponentTokens`, `v1Qa.ts`, `scan.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mapAuthError`, `useTheme`, `mobileReportStatusesApi.ts`, `scanRecordRepository.ts`, `AuthProvider.test.tsx`, `fieldReportValidation.ts`, `recordTypes.ts`, `useFieldValidationAssignment.ts`, `_layout.tsx`, `AuthProvider.tsx`, `notificationCacheRepository.ts`, `field-report.tsx`, `SyncProvider.tsx`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `useMobileNotifications.test.tsx`, `listScanRecords`, `assignmentCacheRepository.ts`, `toStorageError`, `home.tsx`, `Typography`, `record-details.test.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `toStorageError`, `fieldValidationCompletionRepository.ts`, `notificationCacheRepository.ts`, `fieldReportRepository.ts`, `mobileReportStatusesApi.ts`, `localDataLifecycle.ts`, `scanRecordRepository.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `useFieldValidationAssignment.ts`, `submissionImageStorage.ts`, `assignmentCacheRepository.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _471 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mapAuthError` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06277436347673397 - nodes in this community are weakly interconnected._