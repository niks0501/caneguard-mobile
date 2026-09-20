# Graph Report - caneguard-mobile  (2026-09-20)

## Corpus Check
- 313 files · ~160,435 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2038 nodes · 6121 edges · 86 communities (81 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `035a5a07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- manual-map.tsx
- global.d.ts
- scanRecordRepository.ts
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- mobileNotificationsApi.ts
- schema.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- activity.test.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- fieldValidationCompletionValidation.ts
- useFieldReportDraft.test.tsx
- localDataLifecycle.test.ts
- submissionImageStorage.ts
- errors.ts
- saveCompletedScan.ts
- reportMultipartMapper.contract.test.ts
- ThemePreferenceProvider.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- modelContract.ts
- online-map-picker.tsx
- AuthProvider.tsx
- toStorageError
- analysis-result.tsx
- resolveNotificationDestination.ts
- field-report.tsx
- CaneGuardDatabase
- ScanRecordListItem
- field-report.test.tsx
- auth-bootstrap.test.tsx
- mobileReportStatusesApi.ts
- refreshAll.ts
- needsAttention.ts
- mobileReportStatusesV1.ts
- model-debug.tsx
- biometricAuth.ts
- deviceIdentity.ts
- apiClient.ts
- reportReviewTypes.ts
- image-preview.test.tsx
- fieldReportTypes.ts
- analysis-result.test.tsx
- Radius
- model-smoke-test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- mobileFieldValidationCompletionMapper.ts
- MockFile
- FieldValidationCompletionSyncRepository
- useFieldValidationAssignments.ts
- v1Qa.ts
- fieldValidationPhotoStorage.ts
- StorageError
- syncPendingFieldValidationCompletions.ts
- record-details.tsx
- ActivityScreen.tsx
- FieldReportSyncRepository
- useAuth
- fieldReportReviewRepository.ts
- record-details.test.tsx
- recordTypes.ts
- mobileFieldValidationAssignmentsApi.test.ts
- mobileReportStatusesApi.test.ts
- syncEvents.ts
- Spacing
- submissionImageStorage.test.ts
- useFieldValidationAssignment.ts
- phase1LifecycleAcceptance.test.ts
- env.ts
- records.test.tsx
- reportMultipartMapper.test.ts
- useCaneGuardModel.web.tsx
- mobileFieldValidationCompletion.contract.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 142 edges
2. `toStorageError()` - 100 edges
3. `StorageError` - 83 edges
4. `useAuth()` - 70 edges
5. `Typography` - 52 edges
6. `Spacing` - 50 edges
7. `requireOwnerIdentity()` - 41 edges
8. `Radius` - 40 edges
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

## Communities (86 total, 5 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (41): ForgotPasswordScreen(), RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric() (+33 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.15
Nodes (31): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+23 more)

### Community 2 - "useTheme"
Cohesion: 0.09
Nodes (31): CompletionActions(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), styles, VisitContext(), SplashScreen() (+23 more)

### Community 3 - "manual-map.tsx"
Cohesion: 0.09
Nodes (27): firstParam(), getInitialCenter(), ManualMapScreen(), styles, SettingsScreen(), styles, ToggleRow(), ToggleRowProps (+19 more)

### Community 5 - "scanRecordRepository.ts"
Cohesion: 0.11
Nodes (27): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), buildConditions(), buildFieldReportJoinCondition() (+19 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.08
Nodes (38): styles, styles, InputRow(), InputRowProps, LoginScreen(), styles, styles, ResetParams (+30 more)

### Community 8 - "mobileNotificationsApi.ts"
Cohesion: 0.05
Nodes (74): MOBILE_NOTIFICATIONS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed() (+66 more)

### Community 10 - "schema.ts"
Cohesion: 0.07
Nodes (34): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, readCleanupTargets(), LEGACY_UNASSIGNED_OWNER_IDENTITY, FIELD_REPORT_AUTHORING_STATES (+26 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.12
Nodes (25): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), letterboxRgbPixels(), roundTiesToEven() (+17 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.13
Nodes (27): AuthProvider(), AuthenticatedHomeRoute(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession() (+19 more)

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
Cohesion: 0.09
Nodes (22): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_OBSERVATIONS, ChecklistObservation (+14 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.14
Nodes (29): purgeExpiredLocalData(), syncPendingFieldValidationCompletions(), findScanRecordById(), findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord() (+21 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (16): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration15 (+8 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (36): isSafeOwnerIdentity(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+28 more)

### Community 21 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.32
Nodes (11): FIELD_VALIDATION_GPS_OUTCOMES, invalid(), isFollowUpOutcome(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+3 more)

### Community 22 - "useFieldReportDraft.test.tsx"
Cohesion: 0.09
Nodes (19): GpsCaptureUnavailableReason, DATABASE, mockCaptureGpsLocation, mockClearLocationUnavailable, mockCreateOrGetFieldReportDraft, mockDeleteFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId (+11 more)

### Community 23 - "localDataLifecycle.test.ts"
Cohesion: 0.18
Nodes (6): createStatementAdapter(), insertCompletion(), insertScan(), MIGRATIONS, openTestDatabase(), readMigration()

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.13
Nodes (31): persistSubmissionImageMetadata(), toPersistenceInput(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS (+23 more)

### Community 25 - "errors.ts"
Cohesion: 0.13
Nodes (19): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+11 more)

### Community 26 - "saveCompletedScan.ts"
Cohesion: 0.15
Nodes (14): initialScanSessionState, completedResult, ScanSessionState, NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan, saveCompletedScan() (+6 more)

### Community 27 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV2(), findCanonicalField(), formFromParts() (+14 more)

### Community 28 - "ThemePreferenceProvider.tsx"
Cohesion: 0.25
Nodes (6): isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

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
Cohesion: 0.12
Nodes (26): LOCAL_SESSION_MAX_AGE_MS, AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError() (+18 more)

### Community 34 - "toStorageError"
Cohesion: 0.24
Nodes (21): toStorageError(), countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), listFieldValidationCompletions() (+13 more)

### Community 35 - "analysis-result.tsx"
Cohesion: 0.08
Nodes (33): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), formatThreshold(), ScoreRow(), SectionCard(), styles (+25 more)

### Community 36 - "resolveNotificationDestination.ts"
Cohesion: 0.43
Nodes (5): resolveNotificationDestination(), database, findAssignment, findLocal, findScanRecordIdForCase()

### Community 37 - "field-report.tsx"
Cohesion: 0.08
Nodes (35): ALL_REQUIREMENT_GROUPS, AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), concernValueForChoice(), FieldReportScreen(), FieldReportScreenProps, FinalizedReportSummary() (+27 more)

### Community 38 - "CaneGuardDatabase"
Cohesion: 0.11
Nodes (24): CaneGuardDatabase, DatabaseContextValue, AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncErrorCode, toSyncError() (+16 more)

### Community 39 - "ScanRecordListItem"
Cohesion: 0.14
Nodes (12): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, ScanRecordListItem, ScanRecordQuery (+4 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.06
Nodes (50): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockDiscardDraft, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh (+42 more)

### Community 42 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 43 - "refreshAll.ts"
Cohesion: 0.42
Nodes (6): describeRefreshAllResult(), REFRESH_ALL_TARGET_LABELS, RefreshAllResult, RefreshAllTarget, runRefreshAll(), useRefreshAll()

### Community 44 - "needsAttention.ts"
Cohesion: 0.10
Nodes (24): mockAttentionItems, mockMarkRead, mockRouterPush, assignmentItems(), buildNeedsAttention(), HOME_ATTENTION_ROW_LIMIT, NEEDS_ATTENTION_ROW_LIMIT, NeedsAttentionKind (+16 more)

### Community 46 - "model-debug.tsx"
Cohesion: 0.09
Nodes (26): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+18 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "apiClient.ts"
Cohesion: 0.21
Nodes (16): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+8 more)

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 51 - "image-preview.test.tsx"
Cohesion: 0.08
Nodes (29): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+21 more)

### Community 52 - "fieldReportTypes.ts"
Cohesion: 0.14
Nodes (18): FieldReportFormValues, FieldReportAuthoringState, GpsCaptureOutcome, MeasurementProvenance, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS (+10 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "Radius"
Cohesion: 0.12
Nodes (18): DiseaseReferenceScreen(), styles, AppCard, Card(), CardProps, CardVariant, styles, PillVariant (+10 more)

### Community 55 - "model-smoke-test.tsx"
Cohesion: 0.13
Nodes (14): HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), ModelSmokeTestScreen(), SmokeVerification, styles, mockPreprocessImage, mockRun (+6 more)

### Community 56 - "runInference.ts"
Cohesion: 0.11
Nodes (17): ImagePreviewScreen(), diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage() (+9 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.20
Nodes (26): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+18 more)

### Community 58 - "mobileFieldValidationCompletionMapper.ts"
Cohesion: 0.20
Nodes (15): FIELD_VALIDATION_FOLLOW_UP_OUTCOMES, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+7 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 61 - "useFieldValidationAssignments.ts"
Cohesion: 0.15
Nodes (20): EMPTY_DATABASE, FieldValidationAssignmentState, mockUseAssignments, mockUseDestinations, mockUseNotifications, HomeAttention, useHomeAttention(), FieldValidationAssignment (+12 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.16
Nodes (16): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+8 more)

### Community 63 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.12
Nodes (17): deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput, getFieldValidationPhotoDirectory(), isLegacyFieldValidationPhotoUri(), isManagedFieldValidationPhotoUri(), MIME_TO_EXTENSION, persistFieldValidationPhoto() (+9 more)

### Community 64 - "StorageError"
Cohesion: 0.16
Nodes (31): DatabaseMigrationGate(), StorageError, requireOwnerIdentity(), LocationUnavailableReason, SaveRecordState, assertManagedScanImageUri(), deleteManagedScanImage(), validateCopyInput() (+23 more)

### Community 65 - "syncPendingFieldValidationCompletions.ts"
Cohesion: 0.24
Nodes (9): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+1 more)

### Community 66 - "record-details.tsx"
Cohesion: 0.11
Nodes (24): InheritedScanEvidence(), SubmittedCaseEvidence(), CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+16 more)

### Community 67 - "ActivityScreen.tsx"
Cohesion: 0.08
Nodes (31): HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, formatDate(), styles, SyncStatusPanel() (+23 more)

### Community 68 - "FieldReportSyncRepository"
Cohesion: 0.14
Nodes (3): FieldReportSyncRepository, SyncFieldReportOptions, REPORT

### Community 69 - "useAuth"
Cohesion: 0.07
Nodes (38): AppNavigator(), styles, readParam(), ResetPasswordScreen(), mockReplace, mockUseAuth, mockUseAuth, useCaneGuardDatabase() (+30 more)

### Community 70 - "fieldReportReviewRepository.ts"
Cohesion: 0.15
Nodes (18): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase(), readMigration() (+10 more)

### Community 71 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 72 - "recordTypes.ts"
Cohesion: 0.21
Nodes (16): ChecklistConsistency, ModelLabel, ClassScore, DetectionResult, InferenceTimings, ReportedSeverity, ScanSessionStatus, ScanSourceType (+8 more)

### Community 73 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 76 - "syncEvents.ts"
Cohesion: 0.48
Nodes (5): useSyncRecordsRevision(), getSyncRecordsRevision(), Listener, listeners, subscribeSyncRecords()

### Community 77 - "Spacing"
Cohesion: 0.09
Nodes (27): DiseasePill(), DiseasePillProps, DiseasePillVariant, VARIANT_MAP, EmptyState(), EmptyStateProps, styles, Pill() (+19 more)

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.13
Nodes (6): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata

### Community 79 - "useFieldValidationAssignment.ts"
Cohesion: 0.20
Nodes (15): complete, state, FieldValidationFollowUpOutcome, FieldValidationGpsOutcome, SyncStatus, FieldValidationCompletion, SaveFieldValidationCompletionInput, compareCandidates() (+7 more)

### Community 80 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.14
Nodes (19): MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment() (+11 more)

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

### Community 85 - "mobileFieldValidationCompletion.contract.test.ts"
Cohesion: 0.40
Nodes (3): completion, Contract, TestFormData

## Knowledge Gaps
- **517 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+512 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `record-details.tsx`, `analysis-result.tsx`, `ActivityScreen.tsx`, `field-report.tsx`, `manual-map.tsx`, `theme.ts`, `useAuth`, `Spacing`, `model-debug.tsx`, `Radius`, `model-smoke-test.tsx`, `runInference.ts`, `errors.ts`, `v1Qa.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `useTheme`, `manual-map.tsx`, `scanRecordRepository.ts`, `theme.ts`, `mobileNotificationsApi.ts`, `AuthProvider.test.tsx`, `fieldReportSyncRepository.ts`, `useFieldReportDraft.test.tsx`, `field-report.tsx`, `field-report.test.tsx`, `auth-bootstrap.test.tsx`, `useFieldValidationAssignments.ts`, `StorageError`, `record-details.tsx`, `ActivityScreen.tsx`, `record-details.test.tsx`, `useFieldValidationAssignment.ts`, `phase1LifecycleAcceptance.test.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `scanRecordRepository.ts`, `mobileNotificationsApi.ts`, `schema.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `submissionImageStorage.ts`, `errors.ts`, `saveCompletedScan.ts`, `resolveNotificationDestination.ts`, `field-report.tsx`, `field-report.test.tsx`, `useFieldValidationAssignments.ts`, `fieldValidationPhotoStorage.ts`, `StorageError`, `record-details.tsx`, `useAuth`, `fieldReportReviewRepository.ts`, `useFieldValidationAssignment.ts`, `phase1LifecycleAcceptance.test.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _517 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10374149659863946 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.09103840682788052 - nodes in this community are weakly interconnected._