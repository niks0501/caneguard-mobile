# Graph Report - caneguard-mobile  (2026-09-20)

## Corpus Check
- 312 files · ~159,870 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2034 nodes · 6098 edges · 85 communities (81 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cdb7427`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- ComponentTokens
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- use-theme.ts
- phase1LifecycleAcceptance.test.ts
- schema.ts
- preprocessImage.ts
- tokenStore.ts
- recordValidation.ts
- activity.test.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- mobileNotificationsApi.ts
- useFieldReportDraft.test.tsx
- theme.ts
- submissionImageStorage.ts
- DatabaseProvider.tsx
- saveCompletedScan.ts
- reportMultipartMapper.contract.test.ts
- _layout.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- modelContract.ts
- online-map-picker.tsx
- AuthProvider.tsx
- toStorageError
- image-preview.tsx
- analysis-result.tsx
- field-report.tsx
- syncPendingFieldReports.ts
- recordTypes.ts
- field-report.test.tsx
- reportRepository.ts
- mobileReportStatusesApi.ts
- refreshAll.ts
- needsAttention.ts
- mobileReportStatusesV1.ts
- model-debug.tsx
- AuthProvider.test.tsx
- deviceIdentity.ts
- apiClient.ts
- reportReviewTypes.ts
- detection/types.ts
- fieldReportTypes.ts
- analysis-result.test.tsx
- home.tsx
- model-smoke-test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- mobileFieldValidationCompletionMapper.ts
- MockFile
- manual-map.tsx
- assignmentCacheRepository.ts
- v1Qa.ts
- fieldValidationCompletionValidation.ts
- fieldReportRepository.ts
- syncErrors.ts
- scan.test.tsx
- ActivityScreen.tsx
- FieldReportSyncRepository
- useAuth
- fieldReportReviewRepository.ts
- record-details.test.tsx
- assessImageQuality.ts
- ImagePreviewScreen
- mobileReportStatusesApi.test.ts
- possibleMatchRepository.test.ts
- RecordCard.tsx
- submissionImageStorage.test.ts
- FieldValidationAssignment
- mobileNotificationsApi.test.ts
- env.ts
- records.test.tsx
- reportMultipartMapper.test.ts
- useCaneGuardModel.web.tsx

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
Cohesion: 0.09
Nodes (43): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail() (+35 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.15
Nodes (31): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+23 more)

### Community 2 - "useTheme"
Cohesion: 0.08
Nodes (42): InheritedScanEvidence(), CompletionActions(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), styles, SubmittedCaseEvidence() (+34 more)

### Community 3 - "ComponentTokens"
Cohesion: 0.12
Nodes (16): ComponentTokens, FIELD_VALIDATION_FOLLOW_UP_OUTCOMES, FollowUpOutcomeControl(), formatDate(), OUTCOME_COLORS, OUTCOME_LABELS, styles, BarangayOption() (+8 more)

### Community 5 - "StorageError"
Cohesion: 0.08
Nodes (40): CaneGuardDatabase, DatabaseContextValue, DatabaseMigrationGate(), STORAGE_ERROR_CODES, StorageError, StorageErrorCode, USER_MESSAGES, cleanupImages() (+32 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "use-theme.ts"
Cohesion: 0.08
Nodes (33): styles, SplashScreen(), styles, styles, ResetParams, styles, DevelopmentStorageDebugScreen(), DiagnosticRow() (+25 more)

### Community 8 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.07
Nodes (39): createStatementAdapter(), prepareSync(), request, applyConfirmedRead(), ConfirmedReadMap, confirmedReads, listCachedMobileNotifications(), markAllCachedMobileNotificationsRead() (+31 more)

### Community 10 - "schema.ts"
Cohesion: 0.10
Nodes (23): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, GPS_CAPTURE_OUTCOMES, LOCATION_UNAVAILABLE_REASONS, MEASUREMENT_PROVENANCES (+15 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.13
Nodes (26): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), LetterboxGeometry, letterboxRgbPixels() (+18 more)

### Community 12 - "tokenStore.ts"
Cohesion: 0.16
Nodes (25): AuthProvider(), SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession(), clearMobileSessionBestEffort() (+17 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.27
Nodes (15): getChecklistConsistency(), LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+7 more)

### Community 14 - "activity.test.tsx"
Cohesion: 0.11
Nodes (16): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+8 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.17
Nodes (27): FieldReportSubmissionEvidence, coordinatesAreValid(), getMissingSubmissionRequirements(), hasCompleteClassScores(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput() (+19 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.10
Nodes (18): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_OBSERVATIONS, ChecklistObservation (+10 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.16
Nodes (25): syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed() (+17 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.09
Nodes (17): LEGACY_UNASSIGNED_OWNER_IDENTITY, migration0, migration1, migration10, migration11, migration12, migration13, migration14 (+9 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.09
Nodes (39): useDatabaseState(), isSafeOwnerIdentity(), scanClassScores, scanQualityWarnings, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), collectManagedScanImageFiles() (+31 more)

### Community 21 - "mobileNotificationsApi.ts"
Cohesion: 0.16
Nodes (32): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+24 more)

### Community 22 - "useFieldReportDraft.test.tsx"
Cohesion: 0.09
Nodes (19): GpsCaptureUnavailableReason, DATABASE, mockCaptureGpsLocation, mockClearLocationUnavailable, mockCreateOrGetFieldReportDraft, mockDeleteFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId (+11 more)

### Community 23 - "theme.ts"
Cohesion: 0.11
Nodes (18): SectionHeading(), SectionHeadingProps, styles, Status(), STATUS_MAP, StatusKind, StatusProps, styles (+10 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.13
Nodes (30): insertScan(), persistSubmissionImageMetadata(), ensureManagedScanImageDirectory(), getManagedScanImageDirectory(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates() (+22 more)

### Community 25 - "DatabaseProvider.tsx"
Cohesion: 0.16
Nodes (15): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+7 more)

### Community 26 - "saveCompletedScan.ts"
Cohesion: 0.22
Nodes (11): saveCompletedScan(), SaveCompletedScanOptions, toPersistenceInput(), compensateManagedImageCopy(), copyScanImageToManagedStorage(), ManagedImage, validateCopyInput(), MANAGED_IMAGE (+3 more)

### Community 27 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV2(), findCanonicalField(), formFromParts() (+14 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.16
Nodes (9): AppNavigator(), styles, MobileAttentionLifecycle(), isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference() (+1 more)

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "modelContract.ts"
Cohesion: 0.20
Nodes (12): isBelowV1ConfidenceCautionThreshold(), V1_CONFIDENCE_CAUTION_THRESHOLD, MODEL_FILENAME, MODEL_INPUT, MODEL_LABELS, MODEL_OUTPUT, MODEL_SHA256, MODEL_VERSION (+4 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.11
Nodes (36): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+28 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.10
Nodes (28): fetchMock, LOCAL_SESSION_MAX_AGE_MS, AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError() (+20 more)

### Community 34 - "toStorageError"
Cohesion: 0.18
Nodes (27): complete, state, toStorageError(), FieldValidationFollowUpOutcome, countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById() (+19 more)

### Community 35 - "image-preview.tsx"
Cohesion: 0.12
Nodes (24): styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource() (+16 more)

### Community 36 - "analysis-result.tsx"
Cohesion: 0.13
Nodes (15): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), formatThreshold(), ScoreRow(), SectionCard(), styles (+7 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.08
Nodes (35): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), concernValueForChoice(), FieldReportScreen(), FieldReportScreenProps, FinalizedReportSummary() (+27 more)

### Community 38 - "syncPendingFieldReports.ts"
Cohesion: 0.12
Nodes (17): SYNC_RETRY_COOLDOWN_MS, SyncContextValue, RETRY_DELAYS_MS, syncFieldReport(), SyncResult, activeRuns, DatabaseRunState, DEFAULT_SYNC_BATCH_SIZE (+9 more)

### Community 39 - "recordTypes.ts"
Cohesion: 0.15
Nodes (18): SyncStatus, ChecklistConsistency, MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType (+10 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (46): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockDiscardDraft, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh (+38 more)

### Community 41 - "reportRepository.ts"
Cohesion: 0.18
Nodes (14): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+6 more)

### Community 42 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 43 - "refreshAll.ts"
Cohesion: 0.42
Nodes (6): describeRefreshAllResult(), REFRESH_ALL_TARGET_LABELS, RefreshAllResult, RefreshAllTarget, runRefreshAll(), useRefreshAll()

### Community 44 - "needsAttention.ts"
Cohesion: 0.09
Nodes (29): mockAttentionItems, mockMarkRead, mockRouterPush, TodayScreen(), assignmentItems(), buildNeedsAttention(), HOME_ATTENTION_ROW_LIMIT, NEEDS_ATTENTION_ROW_LIMIT (+21 more)

### Community 46 - "model-debug.tsx"
Cohesion: 0.09
Nodes (26): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+18 more)

### Community 47 - "AuthProvider.test.tsx"
Cohesion: 0.26
Nodes (7): SESSION, authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability()

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "apiClient.ts"
Cohesion: 0.14
Nodes (20): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request, ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS (+12 more)

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.19
Nodes (12): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewSnapshot, AuthorityReviewStatusKind (+4 more)

### Community 51 - "detection/types.ts"
Cohesion: 0.09
Nodes (29): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+21 more)

### Community 52 - "fieldReportTypes.ts"
Cohesion: 0.16
Nodes (18): FieldReportFormValues, FieldReportAuthoringState, GpsCaptureOutcome, LocationUnavailableReason, MeasurementProvenance, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput (+10 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "home.tsx"
Cohesion: 0.07
Nodes (33): DiseaseReferenceScreen(), styles, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, BUCKET_LABELS (+25 more)

### Community 55 - "model-smoke-test.tsx"
Cohesion: 0.13
Nodes (14): HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), ModelSmokeTestScreen(), SmokeVerification, styles, mockPreprocessImage, mockRun (+6 more)

### Community 56 - "runInference.ts"
Cohesion: 0.13
Nodes (15): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode (+7 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.19
Nodes (27): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+19 more)

### Community 58 - "mobileFieldValidationCompletionMapper.ts"
Cohesion: 0.17
Nodes (16): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion() (+8 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "manual-map.tsx"
Cohesion: 0.19
Nodes (12): firstParam(), getInitialCenter(), ManualMapScreen(), styles, formatDate(), styles, SyncStatusPanel(), styles (+4 more)

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.09
Nodes (37): EMPTY_DATABASE, fieldValidationAssignments, mockUseAssignments, mockUseDestinations, mockUseNotifications, useHomeAttention(), findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments() (+29 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.18
Nodes (15): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+7 more)

### Community 63 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.07
Nodes (34): FIELD_VALIDATION_GPS_OUTCOMES, createStatementAdapter(), insertCompletion(), MIGRATIONS, openTestDatabase(), readMigration(), FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid() (+26 more)

### Community 64 - "fieldReportRepository.ts"
Cohesion: 0.19
Nodes (26): requireOwnerIdentity(), cleanupPreparedImage(), clearLocationUnavailable(), createOrGetFieldReportDraft(), deleteFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId() (+18 more)

### Community 65 - "syncErrors.ts"
Cohesion: 0.16
Nodes (15): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+7 more)

### Community 66 - "scan.test.tsx"
Cohesion: 0.15
Nodes (11): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, mockRouterReplace, renderScan() (+3 more)

### Community 67 - "ActivityScreen.tsx"
Cohesion: 0.14
Nodes (16): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), styles, TodayEntry(), ACTIVITY_FILTERS (+8 more)

### Community 69 - "useAuth"
Cohesion: 0.21
Nodes (17): useCaneGuardDatabase(), getStorageErrorMessage(), useAuth(), AuthenticatedHomeRoute(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+9 more)

### Community 70 - "fieldReportReviewRepository.ts"
Cohesion: 0.09
Nodes (31): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+23 more)

### Community 71 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 72 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 73 - "ImagePreviewScreen"
Cohesion: 0.27
Nodes (6): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 76 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 77 - "RecordCard.tsx"
Cohesion: 0.15
Nodes (16): DiseasePill(), DiseasePillProps, DiseasePillVariant, VARIANT_MAP, Pill(), formatSavedAt(), RecordCard(), RecordCardProps (+8 more)

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (9): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES (+1 more)

### Community 79 - "FieldValidationAssignment"
Cohesion: 0.11
Nodes (15): FieldValidationAssignmentState, FieldValidationGpsOutcome, FieldValidationCompletionSyncRepository, FieldValidationAssignment, FieldValidationCompletion, compareCandidates(), farmKey(), normalizeFarmPart() (+7 more)

### Community 80 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 81 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 82 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 83 - "reportMultipartMapper.test.ts"
Cohesion: 0.33
Nodes (4): map(), REPORT, SCAN, TestFormData

### Community 84 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

## Knowledge Gaps
- **516 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `image-preview.tsx`, `analysis-result.tsx`, `field-report.tsx`, `ActivityScreen.tsx`, `use-theme.ts`, `ComponentTokens`, `ImagePreviewScreen`, `needsAttention.ts`, `RecordCard.tsx`, `model-debug.tsx`, `theme.ts`, `home.tsx`, `model-smoke-test.tsx`, `DatabaseProvider.tsx`, `manual-map.tsx`, `v1Qa.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `useTheme`, `use-theme.ts`, `phase1LifecycleAcceptance.test.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `useFieldReportDraft.test.tsx`, `_layout.tsx`, `AuthProvider.tsx`, `toStorageError`, `analysis-result.tsx`, `field-report.tsx`, `field-report.test.tsx`, `reportRepository.ts`, `needsAttention.ts`, `AuthProvider.test.tsx`, `home.tsx`, `manual-map.tsx`, `assignmentCacheRepository.ts`, `fieldReportRepository.ts`, `fieldReportReviewRepository.ts`, `record-details.test.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldReportRepository.ts`, `useTheme`, `StorageError`, `field-report.tsx`, `useAuth`, `phase1LifecycleAcceptance.test.ts`, `fieldReportReviewRepository.ts`, `field-report.test.tsx`, `reportRepository.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `submissionImageStorage.ts`, `DatabaseProvider.tsx`, `saveCompletedScan.ts`, `assignmentCacheRepository.ts`, `fieldValidationCompletionValidation.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09361393323657474 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.07607843137254902 - nodes in this community are weakly interconnected._