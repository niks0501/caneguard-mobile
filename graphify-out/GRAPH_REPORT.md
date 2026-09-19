# Graph Report - caneguard-mobile  (2026-09-20)

## Corpus Check
- 305 files · ~157,306 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1990 nodes · 5925 edges · 85 communities (81 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98793354`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- refreshAuthorityReviewStatus.ts
- global.d.ts
- schema.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- use-theme.ts
- useMobileNotifications.ts
- assessImageQuality.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- activity.test.tsx
- fieldReportRepository.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- SyncProvider.tsx
- migrations.test.ts
- scanImageStorage.ts
- apiClient.ts
- mobileNotificationsApi.ts
- localDataLifecycle.ts
- submissionImageStorage.ts
- DatabaseProvider.tsx
- scan.test.tsx
- phase1LifecycleAcceptance.test.ts
- ThemePreferenceProvider.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- useSaveCompletedScan.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- analysis-result.tsx
- mobileFieldValidationAssignmentsApi.test.ts
- field-report.tsx
- syncErrors.ts
- repositoryContracts.ts
- field-report.test.tsx
- AccountSecurityScreen.tsx
- modelContract.ts
- ActivityScreen.tsx
- needsAttention.ts
- mobileReportStatusesV1.ts
- model-debug.tsx
- biometricAuth.ts
- deviceIdentity.ts
- fieldReportSyncRepository.ts
- reportReviewTypes.ts
- image-preview.test.tsx
- theme.ts
- analysis-result.test.tsx
- HomeAttentionCard.tsx
- model-smoke-test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- fieldValidationCompletionValidation.ts
- MockFile
- captureGpsLocation.ts
- resolveNotificationDestination.ts
- v1Qa.ts
- fieldValidationPhotoStorage.ts
- toStorageError
- record-details.test.tsx
- record-details.tsx
- useAuth
- syncFieldReport.ts
- scanRecordRepository.ts
- mobileReportStatusesApi.ts
- useLocalReport.ts
- recordTypes.ts
- mobileReportStatusesApi.test.ts
- env.ts
- ImagePreviewScreen
- Spacing
- MockFile
- FieldValidationCompletionSyncRepository
- useFieldValidationAssignments.ts
- useCaneGuardDatabase
- records.test.tsx
- detection/types.ts
- useCaneGuardModel.web.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 134 edges
2. `toStorageError()` - 98 edges
3. `StorageError` - 83 edges
4. `useAuth()` - 68 edges
5. `Typography` - 49 edges
6. `Spacing` - 47 edges
7. `requireOwnerIdentity()` - 41 edges
8. `Radius` - 38 edges
9. `CaneGuardDatabase` - 38 edges
10. `useCaneGuardDatabase()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `SectionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `DetailRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/analysis-result.tsx → src/hooks/use-theme.ts
- `MeasurementChoice()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `ReadyToSubmitChecklist()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (85 total, 4 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (42): ForgotPasswordScreen(), RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric() (+34 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (58): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+50 more)

### Community 2 - "useTheme"
Cohesion: 0.11
Nodes (28): CompletionActions(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), styles, SubmittedCaseEvidence(), VisitContext() (+20 more)

### Community 3 - "refreshAuthorityReviewStatus.ts"
Cohesion: 0.20
Nodes (13): applyAuthorityReviewUpdates(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), ActiveRefresh, activeRefreshes, AuthorityReviewRefreshResult, executeRefresh(), getOverlappedUpdatedAfter() (+5 more)

### Community 5 - "schema.ts"
Cohesion: 0.05
Nodes (47): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, createCaneGuardDatabaseResources(), useDatabaseState(), STORAGE_ERROR_CODES, StorageErrorCode, USER_MESSAGES, LEGACY_UNASSIGNED_OWNER_IDENTITY (+39 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "use-theme.ts"
Cohesion: 0.10
Nodes (24): styles, styles, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, DevelopmentStorageDebugScreen(), DiagnosticRow() (+16 more)

### Community 8 - "useMobileNotifications.ts"
Cohesion: 0.08
Nodes (41): MobileAttentionLifecycle(), applyConfirmedRead(), ConfirmedReadMap, confirmedReads, listCachedMobileNotifications(), markAllCachedMobileNotificationsRead(), markCachedMobileNotificationRead(), rememberConfirmedRead() (+33 more)

### Community 10 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 11 - "preprocessImage.ts"
Cohesion: 0.13
Nodes (26): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), LetterboxGeometry, letterboxRgbPixels() (+18 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.27
Nodes (15): getChecklistConsistency(), LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+7 more)

### Community 14 - "activity.test.tsx"
Cohesion: 0.11
Nodes (16): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+8 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.09
Nodes (48): FieldReportFormValues, FieldReportAuthoringState, GpsCaptureOutcome, LOCATION_UNAVAILABLE_REASONS, LocationUnavailableReason, MeasurementProvenance, MobileUserRole, toSubmissionPreparationInput() (+40 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.10
Nodes (18): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_OBSERVATIONS, ChecklistObservation (+10 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "SyncProvider.tsx"
Cohesion: 0.19
Nodes (17): resetStaleSyncingFieldValidationCompletions(), syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), findLastSuccessfulFieldReportSyncAt(), resetStaleSyncingFieldReports(), ApiReachability, getSessionKey(), inferApiReachability() (+9 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (15): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration2 (+7 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.09
Nodes (42): concernValueForChoice(), FieldReportScreen(), getReporterConcernChoice(), isStepIncomplete(), isSafeOwnerIdentity(), assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy() (+34 more)

### Community 21 - "apiClient.ts"
Cohesion: 0.26
Nodes (13): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+5 more)

### Community 22 - "mobileNotificationsApi.ts"
Cohesion: 0.12
Nodes (35): MOBILE_NOTIFICATIONS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed() (+27 more)

### Community 23 - "localDataLifecycle.ts"
Cohesion: 0.07
Nodes (29): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), fieldValidationAssignments (+21 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.08
Nodes (43): persistSubmissionImageMetadata(), saveCompletedScan(), toPersistenceInput(), getManagedScanImageDirectory(), getSubmissionImageUri(), ManagedImage, readManagedImageMetadata(), copyLegacySourceToCanonical() (+35 more)

### Community 25 - "DatabaseProvider.tsx"
Cohesion: 0.12
Nodes (17): AppNavigator(), styles, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+9 more)

### Community 26 - "scan.test.tsx"
Cohesion: 0.15
Nodes (11): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, mockRouterReplace, renderScan() (+3 more)

### Community 27 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.33
Nodes (3): createStatementAdapter(), prepareSync(), request

### Community 28 - "ThemePreferenceProvider.tsx"
Cohesion: 0.25
Nodes (6): isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "useSaveCompletedScan.ts"
Cohesion: 0.16
Nodes (11): initialScanSessionState, completedResult, ScanSessionState, NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE (+3 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.11
Nodes (36): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+28 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.13
Nodes (24): AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock(), AuthActionResponse (+16 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.15
Nodes (26): complete, state, FieldValidationCompletionRow, markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), updateCachedAssignmentState(), countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository() (+18 more)

### Community 35 - "analysis-result.tsx"
Cohesion: 0.08
Nodes (37): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), formatThreshold(), ScoreRow(), SectionCard(), styles (+29 more)

### Community 36 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 37 - "field-report.tsx"
Cohesion: 0.08
Nodes (31): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), FieldReportScreenProps, FinalizedReportSummary(), FinalizeFieldReportFormValues, formatLocationSummary() (+23 more)

### Community 38 - "syncErrors.ts"
Cohesion: 0.09
Nodes (32): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+24 more)

### Community 39 - "repositoryContracts.ts"
Cohesion: 0.21
Nodes (6): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, SaveCompletedScanInput, LocalReportOptions

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (45): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockDiscardDraft, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh (+37 more)

### Community 41 - "AccountSecurityScreen.tsx"
Cohesion: 0.25
Nodes (7): AccountSecurityScreen(), biometricCapabilityMessage(), formatExpiry(), SecuritySection(), SecuritySectionProps, styles, SESSION

### Community 42 - "modelContract.ts"
Cohesion: 0.20
Nodes (12): isBelowV1ConfidenceCautionThreshold(), V1_CONFIDENCE_CAUTION_THRESHOLD, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 43 - "ActivityScreen.tsx"
Cohesion: 0.14
Nodes (19): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), styles, ACTIVITY_FILTERS, ActivityFilter (+11 more)

### Community 44 - "needsAttention.ts"
Cohesion: 0.13
Nodes (15): mockAttentionItems, mockMarkRead, mockRouterPush, ACTIVE_ASSIGNMENT_STATES, assignmentItems(), assignmentMeta(), buildNeedsAttention(), compareNullableDates() (+7 more)

### Community 46 - "model-debug.tsx"
Cohesion: 0.09
Nodes (26): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+18 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "fieldReportSyncRepository.ts"
Cohesion: 0.20
Nodes (17): findFieldReportById(), createFieldReportSyncRepository(), FieldReportUploadRecord, findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+9 more)

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 51 - "image-preview.test.tsx"
Cohesion: 0.13
Nodes (18): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+10 more)

### Community 52 - "theme.ts"
Cohesion: 0.16
Nodes (12): contrastRatio(), relLuminance(), base, Colors, Fonts, Typography, KIND_ICONS, NeedsAttentionPanel() (+4 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "HomeAttentionCard.tsx"
Cohesion: 0.17
Nodes (12): AppCard, Card(), CardProps, CardVariant, styles, EmptyState(), EmptyStateProps, styles (+4 more)

### Community 55 - "model-smoke-test.tsx"
Cohesion: 0.13
Nodes (14): HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), ModelSmokeTestScreen(), SmokeVerification, styles, mockPreprocessImage, mockRun (+6 more)

### Community 56 - "runInference.ts"
Cohesion: 0.14
Nodes (14): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode (+6 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.18
Nodes (28): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+20 more)

### Community 58 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.12
Nodes (27): FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid() (+19 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 61 - "resolveNotificationDestination.ts"
Cohesion: 0.19
Nodes (15): NeedsAttentionItem, mockUseAssignments, mockUseDestinations, mockUseNotifications, HomeAttention, useHomeAttention(), findCachedFieldValidationAssignment(), useFieldValidationAssignments() (+7 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.16
Nodes (16): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+8 more)

### Community 63 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.12
Nodes (17): deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput, getFieldValidationPhotoDirectory(), isLegacyFieldValidationPhotoUri(), isManagedFieldValidationPhotoUri(), MIME_TO_EXTENSION, persistFieldValidationPhoto() (+9 more)

### Community 64 - "toStorageError"
Cohesion: 0.11
Nodes (42): getStorageErrorMessage(), StorageError, toStorageError(), requireOwnerIdentity(), createScanRecordRepository(), deleteScanRecordById(), findScanRecordById(), listManagedImageUris() (+34 more)

### Community 65 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 66 - "record-details.tsx"
Cohesion: 0.14
Nodes (21): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+13 more)

### Community 67 - "useAuth"
Cohesion: 0.07
Nodes (35): HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, SplashScreen(), styles, InputRow() (+27 more)

### Community 68 - "syncFieldReport.ts"
Cohesion: 0.14
Nodes (6): FieldReportSyncRepository, MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions

### Community 69 - "scanRecordRepository.ts"
Cohesion: 0.18
Nodes (15): SyncStatus, buildConditions(), buildFieldReportJoinCondition(), listScanRecords(), mapScanRecordDetails(), mapScanRecordListItem(), MAX_RECORD_PAGE_SIZE, ScanRecordListItem (+7 more)

### Community 70 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 71 - "useLocalReport.ts"
Cohesion: 0.20
Nodes (11): LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), getLocalReportSummary(), DATABASE, mockGetLocalReportSummary, mockUser (+3 more)

### Community 72 - "recordTypes.ts"
Cohesion: 0.20
Nodes (15): FieldReportRow, ScanClassScoreRow, ScanQualityWarningRow, ScanRecordRow, ScanSymptomRow, ChecklistConsistency, ReportedSeverity, ScanSourceType (+7 more)

### Community 75 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 76 - "ImagePreviewScreen"
Cohesion: 0.27
Nodes (6): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 77 - "Spacing"
Cohesion: 0.07
Nodes (31): DiseaseReferenceScreen(), styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, VARIANT_MAP, Pill(), PillProps (+23 more)

### Community 79 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.18
Nodes (3): FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState

### Community 80 - "useFieldValidationAssignments.ts"
Cohesion: 0.25
Nodes (11): FieldValidationAssignmentState, listCachedFieldValidationAssignments(), toAssignment(), FieldValidationAssignment, AssignmentState, ActiveRefresh, activeRefreshes, executeRefresh() (+3 more)

### Community 81 - "useCaneGuardDatabase"
Cohesion: 0.29
Nodes (9): useCaneGuardDatabase(), hasStaleAuthorityReviewCache(), database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState (+1 more)

### Community 82 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 83 - "detection/types.ts"
Cohesion: 0.27
Nodes (8): ChecklistObservationId, MATRIX, MatrixCase, ModelLabel, ClassScore, DetectionResult, InferenceTimings, ScanSessionStatus

### Community 84 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

## Knowledge Gaps
- **511 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+506 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `record-details.tsx`, `analysis-result.tsx`, `useAuth`, `field-report.tsx`, `use-theme.ts`, `AccountSecurityScreen.tsx`, `ActivityScreen.tsx`, `ImagePreviewScreen`, `Spacing`, `model-debug.tsx`, `scanImageStorage.ts`, `theme.ts`, `HomeAttentionCard.tsx`, `model-smoke-test.tsx`, `DatabaseProvider.tsx`, `v1Qa.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `StorageError` connect `toStorageError` to `fieldValidationCompletionRepository.ts`, `refreshAuthorityReviewStatus.ts`, `schema.ts`, `scanRecordRepository.ts`, `useMobileNotifications.ts`, `recordValidation.ts`, `fieldReportRepository.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `localDataLifecycle.ts`, `submissionImageStorage.ts`, `DatabaseProvider.tsx`, `fieldValidationCompletionValidation.ts`, `useSaveCompletedScan.ts`, `fieldValidationPhotoStorage.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `schema.ts`, `use-theme.ts`, `useMobileNotifications.ts`, `AuthProvider.test.tsx`, `SyncProvider.tsx`, `scanImageStorage.ts`, `DatabaseProvider.tsx`, `useSaveCompletedScan.ts`, `fieldValidationCompletionRepository.ts`, `field-report.tsx`, `field-report.test.tsx`, `AccountSecurityScreen.tsx`, `resolveNotificationDestination.ts`, `toStorageError`, `record-details.test.tsx`, `record-details.tsx`, `scanRecordRepository.ts`, `useLocalReport.ts`, `useFieldValidationAssignments.ts`, `useCaneGuardDatabase`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _511 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10040816326530612 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06656426011264721 - nodes in this community are weakly interconnected._