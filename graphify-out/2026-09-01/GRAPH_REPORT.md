# Graph Report - caneguard-mobile  (2026-09-01)

## Corpus Check
- 272 files · ~126,773 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1752 nodes · 5092 edges · 70 communities (68 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b31e577`
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
- theme.ts
- image-preview.tsx
- recordTypes.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- field-report.tsx
- fieldReportRepository.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- model-debug.tsx
- syncErrors.ts
- fieldValidationCompletionValidation.ts
- StorageError
- apiClient.ts
- RecordCard.tsx
- schema.ts
- detection/types.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncFieldValidationCompletion.ts
- online-map-picker.tsx
- home.tsx
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- SyncProvider.tsx
- AuthProvider.tsx
- reportReviewTypes.ts
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- model-smoke-test.tsx
- record-details.tsx
- mobileFieldValidationAssignmentsApi.ts
- notificationCacheRepository.ts
- compareParityReference.ts
- toStorageError
- useFieldValidationAssignment.ts
- deviceIdentity.ts
- saveCompletedScan.ts
- reset-password.tsx
- FieldReportSyncRepository
- activity.test.tsx
- phase1LifecycleAcceptance.test.ts
- _layout.tsx
- inferenceErrors.ts
- Typography
- submissionImageStorage.test.ts
- MockFile
- records.test.tsx
- CaneGuardDatabase
- biometricAuth.ts
- ActivityScreen.tsx
- useFieldReportDraft.test.tsx
- useMobileNotifications.test.tsx
- SyncStatusPanel.tsx
- AccountSecurityScreen.tsx
- mobileNotificationsApi.test.ts
- notificationCacheRepository.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 56 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `Radius` - 35 edges
8. `CaneGuardDatabase` - 35 edges
9. `useCaneGuardDatabase()` - 32 edges
10. `getStorageErrorMessage()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedHomeRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/__tests__/auth-bootstrap.test.tsx → src/features/auth/hooks/useAuth.ts
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (70 total, 2 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.13
Nodes (37): RegisterScreen(), styles, AUTH_ERROR_MESSAGES, AuthRequestKind, changeEmail(), changePassword(), disableBiometric(), enrollMobileDevice() (+29 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (55): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+47 more)

### Community 2 - "useTheme"
Cohesion: 0.06
Nodes (35): EvidenceRow(), ReporterMismatchSection(), EvidenceForm(), Row(), MetadataRow(), DebugRow(), MetadataRow(), CenteredState() (+27 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.07
Nodes (45): fieldReports, MOBILE_REPORT_STATUSES_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord() (+37 more)

### Community 5 - "errors.ts"
Cohesion: 0.11
Nodes (23): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.08
Nodes (25): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+17 more)

### Community 8 - "image-preview.tsx"
Cohesion: 0.22
Nodes (10): AnalysisResultScreen(), ImagePreviewScreen(), styles, AppCard(), AppCardProps, styles, getSessionStateErrorMessage(), SessionStateError (+2 more)

### Community 10 - "recordTypes.ts"
Cohesion: 0.10
Nodes (30): scanQualityWarnings, SyncStatus, QualityWarning, ScanRecordRepository, ScanRecordWriteRepository, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+22 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.19
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingStage() (+6 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.15
Nodes (27): AuthProvider(), AuthenticatedHomeRoute(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearMobileSession() (+19 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.30
Nodes (14): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.16
Nodes (18): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatTimestamp() (+10 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.11
Nodes (41): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, createOrGetFieldReportDraft(), finalizeFieldReport(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation() (+33 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.08
Nodes (28): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+20 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.22
Nodes (15): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (36): SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), copyScanImageToManagedStorage(), DeleteManagedImageResult, deleteManagedScanImage(), ensureManagedScanImageDirectory() (+28 more)

### Community 21 - "model-debug.tsx"
Cohesion: 0.10
Nodes (24): DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), styles (+16 more)

### Community 22 - "syncErrors.ts"
Cohesion: 0.09
Nodes (32): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+24 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.17
Nodes (21): FIELD_VALIDATION_GPS_OUTCOMES, FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+13 more)

### Community 24 - "StorageError"
Cohesion: 0.11
Nodes (32): DatabaseMigrationGate(), StorageError, persistSubmissionImageMetadata(), SaveRecordState, DeleteScanRecordResult, CompensationCleanupResult, getSubmissionImageUri(), readManagedImageMetadata() (+24 more)

### Community 25 - "apiClient.ts"
Cohesion: 0.17
Nodes (17): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+9 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.12
Nodes (20): InheritedScanEvidence(), DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, formatSavedAt(), getResultLabel() (+12 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (24): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+16 more)

### Community 28 - "detection/types.ts"
Cohesion: 0.06
Nodes (44): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+36 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.11
Nodes (31): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION (+23 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (20): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+12 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.13
Nodes (31): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), OnlineMapPicker(), onMapPress(), pan(), selectAtEventLocation() (+23 more)

### Community 33 - "home.tsx"
Cohesion: 0.11
Nodes (16): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+8 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.22
Nodes (20): markCachedFieldValidationAssignmentCompleted(), countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed() (+12 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 36 - "SyncProvider.tsx"
Cohesion: 0.16
Nodes (18): syncPendingFieldValidationCompletions(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), getSessionKey(), inferApiReachability(), isNetworkOnline(), isSameSession(), latestTimestamp() (+10 more)

### Community 37 - "AuthProvider.tsx"
Cohesion: 0.11
Nodes (27): AuthenticatedHomeRoute(), fetchMock, mockSession, AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError() (+19 more)

### Community 38 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.17
Nodes (15): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+7 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (46): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+38 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.08
Nodes (38): CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, AssignmentSummary(), CompletionStatus() (+30 more)

### Community 42 - "model-smoke-test.tsx"
Cohesion: 0.10
Nodes (24): DevelopmentModelSmokeTestScreen(), ModelSmokeTestScreen(), styles, mockRun, mockUseCaneGuardModel, IconSize, MODEL_OUTPUT, mockAsset (+16 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.10
Nodes (25): CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel(), RecordDetailsScreen(), styles (+17 more)

### Community 44 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.20
Nodes (26): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+18 more)

### Community 45 - "notificationCacheRepository.ts"
Cohesion: 0.19
Nodes (17): listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification, MobileNotificationsState, ActiveRefresh (+9 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "toStorageError"
Cohesion: 0.18
Nodes (24): FieldReportScreen(), useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError(), SESSION, useAuth(), usePaginatedScanRecords(), useScanRecordDetails() (+16 more)

### Community 48 - "useFieldValidationAssignment.ts"
Cohesion: 0.16
Nodes (12): FieldValidationScreen(), complete, state, CompleteFieldValidationInput, useFieldValidationAssignment(), captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult (+4 more)

### Community 49 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 50 - "saveCompletedScan.ts"
Cohesion: 0.24
Nodes (10): ScanSourceType, saveCompletedScan(), toPersistenceInput(), CopyScanImageInput, ManagedImage, MANAGED_IMAGE, NOW, save() (+2 more)

### Community 51 - "reset-password.tsx"
Cohesion: 0.11
Nodes (18): ForgotPasswordScreen(), styles, readParam(), ResetParams, ResetPasswordScreen(), styles, hasVerificationParams(), readParam() (+10 more)

### Community 53 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 54 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.17
Nodes (6): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, createStatementAdapter(), prepareSync(), request

### Community 55 - "_layout.tsx"
Cohesion: 0.19
Nodes (9): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme (+1 more)

### Community 56 - "inferenceErrors.ts"
Cohesion: 0.12
Nodes (15): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+7 more)

### Community 57 - "Typography"
Cohesion: 0.11
Nodes (18): SplashScreen(), styles, DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps (+10 more)

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (9): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES (+1 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 61 - "CaneGuardDatabase"
Cohesion: 0.13
Nodes (26): CaneGuardDatabase, DatabaseContextValue, FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments() (+18 more)

### Community 62 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 63 - "ActivityScreen.tsx"
Cohesion: 0.18
Nodes (14): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), openNotification(), StateCard(), styles (+6 more)

### Community 64 - "useFieldReportDraft.test.tsx"
Cohesion: 0.17
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 65 - "useMobileNotifications.test.tsx"
Cohesion: 0.21
Nodes (9): MobileAttentionLifecycle(), CACHED, database, listCache, markSessionExpired, Probe(), refreshService, useMobileNotifications() (+1 more)

### Community 66 - "SyncStatusPanel.tsx"
Cohesion: 0.24
Nodes (8): formatDate(), styles, SyncStatusPanel(), styles, SyncStatusRow(), SyncStatusRowProps, MockSyncState, ApiReachability

### Community 67 - "AccountSecurityScreen.tsx"
Cohesion: 0.31
Nodes (6): AccountSecurityScreen(), biometricCapabilityMessage(), formatExpiry(), SecuritySection(), SecuritySectionProps, styles

### Community 68 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 69 - "notificationCacheRepository.test.ts"
Cohesion: 0.29
Nodes (6): MobileNotificationsResult, createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration(), MobileNotificationUpdate

## Knowledge Gaps
- **447 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+442 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `errors.ts`, `theme.ts`, `image-preview.tsx`, `field-report.tsx`, `model-debug.tsx`, `RecordCard.tsx`, `online-map-picker.tsx`, `home.tsx`, `analysis-result.tsx`, `model-smoke-test.tsx`, `record-details.tsx`, `toStorageError`, `useFieldValidationAssignment.ts`, `reset-password.tsx`, `_layout.tsx`, `Typography`, `ActivityScreen.tsx`, `SyncStatusPanel.tsx`, `AccountSecurityScreen.tsx`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `mobileReportStatusesApi.ts`, `errors.ts`, `recordTypes.ts`, `field-report.tsx`, `fieldReportRepository.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `StorageError`, `fieldValidationCompletionRepository.ts`, `SyncProvider.tsx`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `notificationCacheRepository.ts`, `useFieldValidationAssignment.ts`, `saveCompletedScan.ts`, `CaneGuardDatabase`, `useMobileNotifications.test.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `fieldValidationCompletionRepository.ts`, `mobileReportStatusesApi.ts`, `errors.ts`, `recordTypes.ts`, `record-details.tsx`, `notificationCacheRepository.ts`, `recordValidation.ts`, `toStorageError`, `fieldReportRepository.ts`, `saveCompletedScan.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.test.ts`, `detection/types.ts`, `CaneGuardDatabase`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _447 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12560975609756098 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07062146892655367 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.0627177700348432 - nodes in this community are weakly interconnected._