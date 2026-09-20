# Graph Report - caneguard-mobile  (2026-09-20)

## Corpus Check
- 313 files · ~160,342 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2043 nodes · 6126 edges · 81 communities (75 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `229b32ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mapAuthError
- reportMultipartMapper.ts
- useTheme
- manual-map.tsx
- global.d.ts
- scanRecordRepository.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- use-theme.ts
- useMobileNotifications.ts
- schema.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- activity.test.tsx
- fieldReportValidation.ts
- Spacing
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- mobileNotificationsApi.ts
- captureGpsLocation.ts
- theme.ts
- submissionImageStorage.ts
- DatabaseProvider.tsx
- StorageError
- mobileAuthApi.ts
- ThemePreferenceProvider.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- resolveNotificationDestination.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- Typography
- record-details.tsx
- field-report.tsx
- syncPendingFieldReports.ts
- ScanRecordListItem
- field-report.test.tsx
- reportRepository.ts
- phase1LifecycleAcceptance.test.ts
- refreshAll.ts
- needsAttention.ts
- mobileReportStatusesV1.ts
- useCaneGuardModel.tsx
- biometricAuth.ts
- deviceIdentity.ts
- apiClient.ts
- reportReviewTypes.ts
- detection/types.ts
- recordTypes.ts
- fieldValidationCompletionValidation.ts
- Radius
- model-debug.tsx
- inferenceErrors.ts
- mobileFieldValidationAssignmentsApi.ts
- mobileFieldValidationCompletionMapper.ts
- MockFile
- localDataLifecycle.test.ts
- assignmentCacheRepository.ts
- modelContract.ts
- fieldValidationPhotoStorage.ts
- toStorageError
- syncErrors.ts
- FieldValidationCompletionSyncRepository
- ActivityScreen.tsx
- localDataLifecycle.ts
- useAuth
- mobileReportStatusesApi.ts
- syncPendingFieldValidationCompletions.ts
- assessImageQuality.ts
- home.test.tsx
- mobileReportStatusesApi.test.ts
- field-validation.test.tsx
- today.tsx
- MockFile
- useFieldValidationAssignment.ts
- mobileNotificationsApi.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 140 edges
2. `toStorageError()` - 100 edges
3. `StorageError` - 83 edges
4. `useAuth()` - 70 edges
5. `Typography` - 51 edges
6. `Spacing` - 49 edges
7. `requireOwnerIdentity()` - 41 edges
8. `Radius` - 39 edges
9. `CaneGuardDatabase` - 38 edges
10. `useCaneGuardDatabase()` - 37 edges

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

## Communities (81 total, 6 thin omitted)

### Community 0 - "mapAuthError"
Cohesion: 0.10
Nodes (25): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), authError(), changeEmail(), changePassword(), disableBiometric() (+17 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (59): FieldReportUploadRecord, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange() (+51 more)

### Community 2 - "useTheme"
Cohesion: 0.11
Nodes (26): CompletionActions(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), styles, VisitContext(), Row() (+18 more)

### Community 3 - "manual-map.tsx"
Cohesion: 0.21
Nodes (9): firstParam(), getInitialCenter(), ManualMapScreen(), styles, ComponentTokens, BarangayOption(), BarangayPicker(), filterBarangayOptions() (+1 more)

### Community 5 - "scanRecordRepository.ts"
Cohesion: 0.14
Nodes (23): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), createScanRecordRepository() (+15 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "use-theme.ts"
Cohesion: 0.07
Nodes (37): styles, SplashScreen(), styles, styles, ResetParams, styles, SettingsScreen(), styles (+29 more)

### Community 8 - "useMobileNotifications.ts"
Cohesion: 0.08
Nodes (42): mobileNotifications, MobileAttentionLifecycle(), applyConfirmedRead(), ConfirmedReadMap, confirmedReads, listCachedMobileNotifications(), markAllCachedMobileNotificationsRead(), markCachedMobileNotificationRead() (+34 more)

### Community 10 - "schema.ts"
Cohesion: 0.09
Nodes (24): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES, LOCATION_UNAVAILABLE_REASONS (+16 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.13
Nodes (26): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), LetterboxGeometry, letterboxRgbPixels() (+18 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.11
Nodes (27): ChecklistObservation, getChecklistConsistency(), GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SMUT_OBSERVATION (+19 more)

### Community 14 - "activity.test.tsx"
Cohesion: 0.11
Nodes (16): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+8 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.07
Nodes (44): FieldReportAuthoringState, GpsCaptureOutcome, LocationUnavailableReason, MeasurementProvenance, MobileUserRole, FieldReportSyncRepository, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS (+36 more)

### Community 16 - "Spacing"
Cohesion: 0.09
Nodes (25): AppCard, Card(), CardProps, CardVariant, styles, DiseasePill(), DiseasePillProps, VARIANT_MAP (+17 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.16
Nodes (24): markFieldValidationCompletionPending(), syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed() (+16 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.09
Nodes (17): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration15 (+9 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.10
Nodes (41): isSafeOwnerIdentity(), LEGACY_UNASSIGNED_OWNER_IDENTITY, SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), CompensationCleanupResult, copyScanImageToManagedStorage() (+33 more)

### Community 21 - "mobileNotificationsApi.ts"
Cohesion: 0.16
Nodes (32): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+24 more)

### Community 22 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 23 - "theme.ts"
Cohesion: 0.12
Nodes (15): InputRow(), InputRowProps, LoginScreen(), styles, STATUS_MAP, StatusKind, StatusProps, styles (+7 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.10
Nodes (34): persistSubmissionImageMetadata(), getManagedScanImageDirectory(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri(), isLegacyUnsupportedSource() (+26 more)

### Community 25 - "DatabaseProvider.tsx"
Cohesion: 0.14
Nodes (14): AppNavigator(), styles, clearCaneGuardDatabaseResourcesForRetry(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext, DatabaseInitializationStatus (+6 more)

### Community 26 - "StorageError"
Cohesion: 0.14
Nodes (18): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, createCaneGuardDatabaseResources(), DatabaseContextValue, STORAGE_ERROR_CODES, StorageError, StorageErrorCode (+10 more)

### Community 27 - "mobileAuthApi.ts"
Cohesion: 0.13
Nodes (29): AUTH_ERROR_MESSAGES, AuthRequestKind, invalidResponseError(), isFutureIsoDate(), isMobileUser(), isRecord(), isRegistrationUser(), isValidSessionExpiry() (+21 more)

### Community 28 - "ThemePreferenceProvider.tsx"
Cohesion: 0.25
Nodes (6): isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.11
Nodes (30): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), ReferenceDataState, NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA (+22 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "resolveNotificationDestination.ts"
Cohesion: 0.22
Nodes (13): NeedsAttentionItem, mockUseAssignments, mockUseDestinations, mockUseNotifications, HomeAttention, useHomeAttention(), EMPTY_DESTINATIONS, useNotificationDestinations() (+5 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.11
Nodes (36): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+28 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.16
Nodes (15): fetchMock, LOCAL_SESSION_MAX_AGE_MS, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError() (+7 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.21
Nodes (20): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), listFieldValidationCompletions(), listFieldValidationCompletionSummaries() (+12 more)

### Community 35 - "Typography"
Cohesion: 0.10
Nodes (31): CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, MetadataRow(), styles (+23 more)

### Community 36 - "record-details.tsx"
Cohesion: 0.12
Nodes (24): InheritedScanEvidence(), SubmittedCaseEvidence(), CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+16 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.07
Nodes (39): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), concernValueForChoice(), FieldReportFormValues, FieldReportScreen(), FieldReportScreenProps (+31 more)

### Community 38 - "syncPendingFieldReports.ts"
Cohesion: 0.15
Nodes (15): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE, executeBatch(), MAX_SYNC_REPORTS_PER_RUN (+7 more)

### Community 39 - "ScanRecordListItem"
Cohesion: 0.12
Nodes (12): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, SyncStatus, ScanRecordRepository (+4 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (50): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockDiscardDraft, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh (+42 more)

### Community 41 - "reportRepository.ts"
Cohesion: 0.18
Nodes (15): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+7 more)

### Community 42 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.17
Nodes (6): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, createStatementAdapter(), prepareSync(), request

### Community 43 - "refreshAll.ts"
Cohesion: 0.42
Nodes (6): describeRefreshAllResult(), REFRESH_ALL_TARGET_LABELS, RefreshAllResult, RefreshAllTarget, runRefreshAll(), useRefreshAll()

### Community 44 - "needsAttention.ts"
Cohesion: 0.13
Nodes (20): assignmentItems(), buildNeedsAttention(), HOME_ATTENTION_ROW_LIMIT, NEEDS_ATTENTION_ROW_LIMIT, NeedsAttentionKind, NeedsAttentionSummary, unreadNotificationItems(), uploadItems() (+12 more)

### Community 46 - "useCaneGuardModel.tsx"
Cohesion: 0.10
Nodes (23): ModelSmokeTestScreen(), mockPreprocessImage, mockRun, mockRunInference, mockUseCaneGuardModel, MODEL_OUTPUT, mockAsset, mockAssetDownloadAsync (+15 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "apiClient.ts"
Cohesion: 0.19
Nodes (18): ApiHttpError, apiRequest(), buildApiUrl(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath() (+10 more)

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 51 - "detection/types.ts"
Cohesion: 0.04
Nodes (60): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+52 more)

### Community 52 - "recordTypes.ts"
Cohesion: 0.29
Nodes (12): ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, CompletedScanDraft, DEFAULT_RECORD_PAGE_SIZE (+4 more)

### Community 53 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.35
Nodes (10): FIELD_VALIDATION_GPS_OUTCOMES, invalid(), isFollowUpOutcome(), isGpsOutcome(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput(), validateRequiredText() (+2 more)

### Community 54 - "Radius"
Cohesion: 0.23
Nodes (8): DiseaseReferenceScreen(), styles, ReferenceMedia(), ReferenceMediaProps, styles, Radius, referenceMedia, ReferenceMediaEntry

### Community 55 - "model-debug.tsx"
Cohesion: 0.13
Nodes (16): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+8 more)

### Community 56 - "inferenceErrors.ts"
Cohesion: 0.09
Nodes (22): AnalysisResultScreen(), formatThreshold(), ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage (+14 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.19
Nodes (29): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), buildMobilePreviousEvidencePhotoPath(), buildMobilePreviousEvidencePhotoUrl(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord() (+21 more)

### Community 58 - "mobileFieldValidationCompletionMapper.ts"
Cohesion: 0.15
Nodes (17): FIELD_VALIDATION_FOLLOW_UP_OUTCOMES, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+9 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "localDataLifecycle.test.ts"
Cohesion: 0.18
Nodes (6): createStatementAdapter(), insertCompletion(), insertScan(), MIGRATIONS, openTestDatabase(), readMigration()

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.12
Nodes (24): fieldValidationAssignments, MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), parsePreviousVisit(), replaceCachedFieldValidationAssignments() (+16 more)

### Community 62 - "modelContract.ts"
Cohesion: 0.09
Nodes (32): DevelopmentModelSmokeTestScreen(), HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), SmokeVerification, styles, IconSize, isBelowV1ConfidenceCautionThreshold() (+24 more)

### Community 63 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.12
Nodes (17): deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput, getFieldValidationPhotoDirectory(), isLegacyFieldValidationPhotoUri(), isManagedFieldValidationPhotoUri(), MIME_TO_EXTENSION, persistFieldValidationPhoto() (+9 more)

### Community 64 - "toStorageError"
Cohesion: 0.12
Nodes (39): toStorageError(), requireOwnerIdentity(), clearLocationUnavailable(), createOrGetFieldReportDraft(), deleteFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId() (+31 more)

### Community 65 - "syncErrors.ts"
Cohesion: 0.18
Nodes (12): RETRY_DELAYS_MS, syncFieldValidationCompletion(), COMPLETION, AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncError (+4 more)

### Community 67 - "ActivityScreen.tsx"
Cohesion: 0.08
Nodes (30): HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, formatDate(), styles, SyncStatusPanel() (+22 more)

### Community 68 - "localDataLifecycle.ts"
Cohesion: 0.36
Nodes (7): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets()

### Community 69 - "useAuth"
Cohesion: 0.08
Nodes (37): mockReplace, mockUseAuth, mockUseAuth, DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush (+29 more)

### Community 70 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (46): fieldReports, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError() (+38 more)

### Community 71 - "syncPendingFieldValidationCompletions.ts"
Cohesion: 0.29
Nodes (7): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, ActiveRun, activeRuns, DatabaseRunState, FieldValidationCompletionSyncBatchResult, SyncHaltReason

### Community 72 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 73 - "home.test.tsx"
Cohesion: 0.40
Nodes (3): mockAttentionItems, mockMarkRead, mockRouterPush

### Community 77 - "today.tsx"
Cohesion: 0.13
Nodes (16): BUCKET_LABELS, styles, TodayScreen(), BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab (+8 more)

### Community 79 - "useFieldValidationAssignment.ts"
Cohesion: 0.21
Nodes (17): FieldValidationAssignmentState, FieldValidationFollowUpOutcome, FieldValidationGpsOutcome, FieldValidationAssignment, FieldValidationCompletion, SaveFieldValidationCompletionInput, compareCandidates(), farmKey() (+9 more)

### Community 80 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

## Knowledge Gaps
- **518 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+513 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mapAuthError`, `online-map-picker.tsx`, `Typography`, `record-details.tsx`, `field-report.tsx`, `ActivityScreen.tsx`, `use-theme.ts`, `manual-map.tsx`, `today.tsx`, `Spacing`, `model-debug.tsx`, `Radius`, `theme.ts`, `inferenceErrors.ts`, `DatabaseProvider.tsx`, `modelContract.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `toStorageError`, `fieldValidationCompletionRepository.ts`, `localDataLifecycle.ts`, `scanRecordRepository.ts`, `useAuth`, `mobileReportStatusesApi.ts`, `useMobileNotifications.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `fieldReportSyncRepository.ts`, `detection/types.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `DatabaseProvider.tsx`, `assignmentCacheRepository.ts`, `fieldValidationPhotoStorage.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldValidationCompletionRepository.ts`, `record-details.tsx`, `field-report.tsx`, `localDataLifecycle.ts`, `useAuth`, `useMobileNotifications.ts`, `scanRecordRepository.ts`, `mobileReportStatusesApi.ts`, `field-report.test.tsx`, `reportRepository.ts`, `useFieldValidationAssignment.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `submissionImageStorage.ts`, `DatabaseProvider.tsx`, `StorageError`, `assignmentCacheRepository.ts`, `fieldValidationPhotoStorage.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _518 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mapAuthError` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06498015873015874 - nodes in this community are weakly interconnected._