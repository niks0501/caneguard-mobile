# Graph Report - caneguard-mobile  (2026-09-19)

## Corpus Check
- 305 files · ~154,542 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1984 nodes · 5896 edges · 80 communities (75 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41e15f9d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mapAuthError
- reportMultipartMapper.ts
- useTheme
- mobileReportStatusesApi.ts
- global.d.ts
- DatabaseProvider.tsx
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- localDataLifecycle.test.ts
- useMobileNotifications.ts
- recordTypes.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- login.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- apiClient.ts
- mobileNotificationsApi.ts
- StorageError
- submissionImageStorage.ts
- useCaneGuardModel.tsx
- mobileAuthApi.ts
- schema.ts
- _layout.tsx
- referenceDataService.ts
- readPickerOutcome.ts
- saveCompletedScan.test.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- possibleMatchRepository.test.ts
- phase1LifecycleAcceptance.test.ts
- field-report.tsx
- syncErrors.ts
- fieldValidationCompletionValidation.ts
- field-report.test.tsx
- home.tsx
- modelContract.ts
- ActivityScreen.tsx
- activity.test.tsx
- mobileReportStatusesV1.ts
- model-debug.tsx
- biometricAuth.ts
- deviceIdentity.ts
- resolveNotificationDestination.ts
- reportReviewTypes.ts
- image-preview.test.tsx
- use-theme.ts
- analysis-result.test.tsx
- Spacing
- model-smoke-test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- syncFieldValidationCompletion.ts
- scanImageStorage.test.ts
- captureGpsLocation.ts
- useFieldValidationAssignment.ts
- v1Qa.ts
- fieldValidationPhotoStorage.test.ts
- toStorageError
- fieldReportTypes.ts
- record-details.tsx
- theme.ts
- FieldReportSyncRepository
- useAuth.ts
- mobileNotificationsApi.test.ts
- useCaneGuardModel.web.tsx
- ScanRecordListItem
- mobileReportStatusesApi.test.ts
- env.ts
- AnalysisResultScreen
- submissionImageStorage.test.ts
- record-details.test.tsx
- fieldReportValidation.test.ts

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
- `MeasurementChoice()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `ReadyToSubmitChecklist()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `InputRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/login.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (80 total, 5 thin omitted)

### Community 0 - "mapAuthError"
Cohesion: 0.10
Nodes (25): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), authError(), changeEmail(), changePassword(), disableBiometric() (+17 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (57): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+49 more)

### Community 2 - "useTheme"
Cohesion: 0.08
Nodes (34): CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, CompletionActions(), CompletionStatus() (+26 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (45): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+37 more)

### Community 5 - "DatabaseProvider.tsx"
Cohesion: 0.14
Nodes (16): CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext, DatabaseContextValue (+8 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "localDataLifecycle.test.ts"
Cohesion: 0.16
Nodes (10): createStatementAdapter(), insertScan(), MIGRATIONS, openTestDatabase(), readMigration(), getManagedScanImageDirectory(), copyLegacySourceToCanonical(), isCanonicalManagedSourceUri() (+2 more)

### Community 8 - "useMobileNotifications.ts"
Cohesion: 0.08
Nodes (41): MobileAttentionLifecycle(), applyConfirmedRead(), ConfirmedReadMap, confirmedReads, listCachedMobileNotifications(), markAllCachedMobileNotificationsRead(), markCachedMobileNotificationRead(), rememberConfirmedRead() (+33 more)

### Community 10 - "recordTypes.ts"
Cohesion: 0.19
Nodes (17): ChecklistConsistency, ModelLabel, ClassScore, InferenceTimings, ReportedSeverity, ScanSessionStatus, ScanSourceType, ImageQualityAssessment (+9 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.12
Nodes (26): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), LetterboxGeometry, letterboxRgbPixels() (+18 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.33
Nodes (13): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "login.tsx"
Cohesion: 0.25
Nodes (6): InputRow(), InputRowProps, LoginScreen(), styles, mockUseAuth, Shadows

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.19
Nodes (25): coordinatesAreValid(), getMissingSubmissionRequirements(), hasCompleteClassScores(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeLocationUnavailableReason(), normalizeMeasurementProvenance() (+17 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.09
Nodes (21): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, CHECKLIST_OBSERVATIONS, ChecklistObservation (+13 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.15
Nodes (27): purgeExpiredLocalData(), resetStaleSyncingFieldValidationCompletions(), syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt() (+19 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (15): migration0, migration1, migration10, migration11, migration12, migration13, migration14, migration2 (+7 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.12
Nodes (34): isSafeOwnerIdentity(), assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory() (+26 more)

### Community 21 - "apiClient.ts"
Cohesion: 0.21
Nodes (16): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+8 more)

### Community 22 - "mobileNotificationsApi.ts"
Cohesion: 0.16
Nodes (32): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+24 more)

### Community 23 - "StorageError"
Cohesion: 0.08
Nodes (50): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, useDatabaseState(), STORAGE_ERROR_CODES, StorageError, StorageErrorCode, USER_MESSAGES, cleanupImages() (+42 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.13
Nodes (26): saveCompletedScan(), toPersistenceInput(), ManagedImage, generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES (+18 more)

### Community 25 - "useCaneGuardModel.tsx"
Cohesion: 0.10
Nodes (24): ModelSmokeTestScreen(), mockPreprocessImage, mockRun, mockRunInference, mockUseCaneGuardModel, MODEL_INPUT, MODEL_OUTPUT, mockAsset (+16 more)

### Community 26 - "mobileAuthApi.ts"
Cohesion: 0.13
Nodes (29): AUTH_ERROR_MESSAGES, AuthRequestKind, invalidResponseError(), isFutureIsoDate(), isMobileUser(), isRecord(), isRegistrationUser(), isValidSessionExpiry() (+21 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (25): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, GPS_CAPTURE_OUTCOMES, LOCATION_UNAVAILABLE_REASONS, MEASUREMENT_PROVENANCES (+17 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.18
Nodes (8): AppNavigator(), styles, isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 29 - "referenceDataService.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "saveCompletedScan.test.ts"
Cohesion: 0.18
Nodes (9): initialScanSessionState, completedResult, ScanSessionState, NOW, mockDatabase, mockRandomUUID, mockSaveCompletedScan, MANAGED_IMAGE (+1 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (34): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+26 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.16
Nodes (15): fetchMock, LOCAL_SESSION_MAX_AGE_MS, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError() (+7 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.25
Nodes (17): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+9 more)

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
Cohesion: 0.08
Nodes (34): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+26 more)

### Community 39 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.19
Nodes (18): FIELD_VALIDATION_GPS_OUTCOMES, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput(), validateRequiredText() (+10 more)

### Community 40 - "field-report.test.tsx"
Cohesion: 0.07
Nodes (45): FormValues, mockCaptureLocation, mockClearLocationUnavailable, mockFinalize, mockMarkLocationUnavailable, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh (+37 more)

### Community 41 - "home.tsx"
Cohesion: 0.09
Nodes (27): DiseaseReferenceScreen(), styles, HomeScreen(), QuickAction, QuickActionCard(), SectionTitle(), styles, firstParam() (+19 more)

### Community 42 - "modelContract.ts"
Cohesion: 0.20
Nodes (11): isBelowV1ConfidenceCautionThreshold(), V1_CONFIDENCE_CAUTION_THRESHOLD, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, MODEL_FILENAME (+3 more)

### Community 43 - "ActivityScreen.tsx"
Cohesion: 0.10
Nodes (25): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), styles, KIND_ICONS, NeedsAttentionPanel() (+17 more)

### Community 44 - "activity.test.tsx"
Cohesion: 0.06
Nodes (32): ASSIGNMENT, mockAssignmentsState, mockDestinations, mockLoadMore, mockMarkAllRead, mockMarkRead, mockNotificationsState, mockRecordsState (+24 more)

### Community 46 - "model-debug.tsx"
Cohesion: 0.16
Nodes (13): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+5 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "resolveNotificationDestination.ts"
Cohesion: 0.14
Nodes (18): mockUseAssignments, mockUseDestinations, mockUseNotifications, HomeAttention, useHomeAttention(), useFieldValidationAssignments(), EMPTY_DESTINATIONS, useNotificationDestinations() (+10 more)

### Community 50 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 51 - "image-preview.test.tsx"
Cohesion: 0.08
Nodes (28): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+20 more)

### Community 52 - "use-theme.ts"
Cohesion: 0.09
Nodes (29): styles, ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource() (+21 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.15
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "Spacing"
Cohesion: 0.06
Nodes (39): AppCard, Card(), CardProps, CardVariant, styles, ConfirmDialog(), ConfirmDialogProps, styles (+31 more)

### Community 55 - "model-smoke-test.tsx"
Cohesion: 0.20
Nodes (9): HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), SmokeVerification, styles, BrandedScreenHeaderProps, ScreenHeader(), ScreenHeaderProps (+1 more)

### Community 56 - "runInference.ts"
Cohesion: 0.16
Nodes (12): asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores(), PostprocessedOutput, postprocessOutput() (+4 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.18
Nodes (28): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+20 more)

### Community 58 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (21): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+13 more)

### Community 59 - "scanImageStorage.test.ts"
Cohesion: 0.10
Nodes (10): SaveCompletedScanOptions, compensateManagedImageCopy(), deleteManagedScanImage(), joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry (+2 more)

### Community 60 - "captureGpsLocation.ts"
Cohesion: 0.23
Nodes (7): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, NOW

### Community 61 - "useFieldValidationAssignment.ts"
Cohesion: 0.13
Nodes (25): FieldValidationAssignmentState, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment() (+17 more)

### Community 62 - "v1Qa.ts"
Cohesion: 0.18
Nodes (15): DevelopmentModelSmokeTestScreen(), compareV1QaOutput(), expectedOutputByFixture, getV1QaExpectedOutput(), V1_QA_EXPECTED_OUTPUTS, V1_QA_FIXTURE_IDS, V1_QA_MODEL_SHA256, V1QaExpectedOutput (+7 more)

### Community 63 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.14
Nodes (9): insertCompletion(), getFieldValidationPhotoDirectory(), isManagedFieldValidationPhotoUri(), joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry (+1 more)

### Community 64 - "toStorageError"
Cohesion: 0.09
Nodes (52): useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError(), LocationUnavailableReason, useAuth(), AuthenticatedHomeRoute(), QueryState, usePaginatedScanRecords() (+44 more)

### Community 65 - "fieldReportTypes.ts"
Cohesion: 0.15
Nodes (16): FieldReportFormValues, FieldReportAuthoringState, GpsCaptureOutcome, MeasurementProvenance, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS (+8 more)

### Community 66 - "record-details.tsx"
Cohesion: 0.13
Nodes (22): InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+14 more)

### Community 67 - "theme.ts"
Cohesion: 0.07
Nodes (38): styles, SplashScreen(), styles, styles, ResetParams, styles, DevelopmentStorageDebugScreen(), DiagnosticRow() (+30 more)

### Community 69 - "useAuth.ts"
Cohesion: 0.12
Nodes (10): SESSION, AuthContext, mockDatabase, mockListScanRecords, INITIAL_STATE, SaveRecordState, SaveRecordStatus, DATABASE (+2 more)

### Community 70 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 72 - "ScanRecordListItem"
Cohesion: 0.09
Nodes (18): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, SyncStatus, ReportRepository (+10 more)

### Community 75 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 76 - "AnalysisResultScreen"
Cohesion: 0.23
Nodes (8): AnalysisResultScreen(), formatThreshold(), ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 80 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

## Knowledge Gaps
- **508 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+503 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mapAuthError`, `online-map-picker.tsx`, `record-details.tsx`, `theme.ts`, `field-report.tsx`, `DatabaseProvider.tsx`, `home.tsx`, `ActivityScreen.tsx`, `AnalysisResultScreen`, `login.tsx`, `model-debug.tsx`, `use-theme.ts`, `Spacing`, `model-smoke-test.tsx`, `v1Qa.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `record-details.tsx`, `fieldValidationCompletionRepository.ts`, `mobileReportStatusesApi.ts`, `DatabaseProvider.tsx`, `field-report.tsx`, `fieldValidationCompletionValidation.ts`, `useMobileNotifications.ts`, `useAuth.ts`, `field-report.test.tsx`, `resolveNotificationDestination.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `StorageError`, `submissionImageStorage.ts`, `scanImageStorage.test.ts`, `useFieldValidationAssignment.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `toStorageError` to `mapAuthError`, `mobileReportStatusesApi.ts`, `useMobileNotifications.ts`, `AuthProvider.test.tsx`, `login.tsx`, `fieldReportSyncRepository.ts`, `StorageError`, `_layout.tsx`, `AuthProvider.tsx`, `field-report.tsx`, `field-report.test.tsx`, `home.tsx`, `resolveNotificationDestination.ts`, `use-theme.ts`, `useFieldValidationAssignment.ts`, `record-details.tsx`, `theme.ts`, `useAuth.ts`, `record-details.test.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _508 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mapAuthError` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06821787414066631 - nodes in this community are weakly interconnected._