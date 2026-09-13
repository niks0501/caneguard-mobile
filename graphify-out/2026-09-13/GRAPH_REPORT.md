# Graph Report - 01M2D2VCA4C4435F1RQ9Q2SJ20  (2026-09-13)

## Corpus Check
- 278 files · ~132,199 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1807 nodes · 5283 edges · 77 communities (75 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d648a078`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mapAuthError
- reportMultipartMapper.ts
- Spacing
- emitSyncRecordsChanged
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- toStorageError
- useTheme
- scanRecordWriteRepository.ts
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
- mobileAuthApi.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- fieldReportRepository.ts
- field-report.tsx
- fieldReportSyncRepository.ts
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- apiClient.ts
- fieldValidationPhotoStorage.test.ts
- useFieldReportDraft.test.tsx
- biometricAuth.ts
- deviceIdentity.ts
- possibleMatchRepository.test.ts
- saveCompletedScan.ts
- captureGpsLocation.ts
- Radius
- analysis-result.test.tsx
- theme.ts
- useAuth
- runInference.ts
- syncFieldReport.ts
- fieldValidationCompletionTypes.ts
- scanImageStorage.test.ts
- scanRecordRepository.ts
- mobileFieldValidationAssignmentsApi.ts
- compareParityReference.ts
- mobileFieldValidationAssignmentsApi.test.ts
- useFieldReportDraft.ts
- reportReviewTypes.ts
- home.tsx
- use-theme.ts
- syncErrors.ts
- mobileReportStatusesApi.test.ts
- mobileNotificationsApi.test.ts
- useCaneGuardModel.web.tsx
- env.ts
- image-preview.test.tsx
- submissionImageStorage.test.ts
- phase1LifecycleAcceptance.test.ts
- recordTypes.ts

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

## Communities (77 total, 2 thin omitted)

### Community 0 - "mapAuthError"
Cohesion: 0.10
Nodes (25): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), authError(), changeEmail(), changePassword(), disableBiometric() (+17 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (55): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+47 more)

### Community 2 - "Spacing"
Cohesion: 0.11
Nodes (23): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+15 more)

### Community 3 - "emitSyncRecordsChanged"
Cohesion: 0.14
Nodes (20): fieldReports, ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+12 more)

### Community 5 - "StorageError"
Cohesion: 0.10
Nodes (35): CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+27 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "toStorageError"
Cohesion: 0.09
Nodes (31): toStorageError(), cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets() (+23 more)

### Community 8 - "useTheme"
Cohesion: 0.10
Nodes (26): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, BrandedScreenHeader() (+18 more)

### Community 10 - "scanRecordWriteRepository.ts"
Cohesion: 0.12
Nodes (13): ScanRecordRepository, ScanRecordWriteRepository, insertScanRecord(), isDuplicateRecordError(), createStatementAdapter(), openTestDatabase(), readMigration(), SaveCompletedScanInput (+5 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.18
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.23
Nodes (16): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+8 more)

### Community 14 - "ActivityScreen.tsx"
Cohesion: 0.14
Nodes (17): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), openNotification(), StateCard(), styles (+9 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.20
Nodes (22): FieldReportSubmissionEvidence, coordinatesAreValid(), getMissingSubmissionRequirements(), invalid(), isValidUtcTimestamp(), normalizeFieldReportDraftInput(), normalizeFinalizeFieldReportInput(), normalizeMismatchReported() (+14 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.13
Nodes (14): CHECKLIST_OBSERVATIONS, ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GUIDED_VALIDATION_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION (+6 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncFieldValidationCompletion.ts"
Cohesion: 0.19
Nodes (15): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion() (+7 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.11
Nodes (14): LEGACY_UNASSIGNED_OWNER_IDENTITY, migration0, migration1, migration10, migration11, migration12, migration2, migration3 (+6 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.13
Nodes (27): isSafeOwnerIdentity(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult, EXTENSION_TO_MIME, getManagedImageRootDirectory() (+19 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.15
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "mobileReportStatusesApi.ts"
Cohesion: 0.23
Nodes (19): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+11 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.38
Nodes (9): FIELD_VALIDATION_GPS_OUTCOMES, invalid(), isGpsOutcome(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput(), validateRequiredText(), validateTimestamp() (+1 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.13
Nodes (26): insertScan(), ensureManagedScanImageDirectory(), getManagedScanImageDirectory(), readManagedImageMetadata(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri() (+18 more)

### Community 25 - "scan.test.tsx"
Cohesion: 0.10
Nodes (24): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanHarness() (+16 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.11
Nodes (22): BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, DiseasePill(), DiseasePillProps (+14 more)

### Community 27 - "schema.ts"
Cohesion: 0.08
Nodes (31): CANEGUARD_DATABASE_FILENAME, FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, GPS_CAPTURE_OUTCOMES, MobileNotificationRow (+23 more)

### Community 28 - "settings.tsx"
Cohesion: 0.16
Nodes (11): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, ThemePreferenceContext (+3 more)

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
Cohesion: 0.23
Nodes (19): markCachedFieldValidationAssignmentCompleted(), countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed() (+11 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.05
Nodes (65): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+57 more)

### Community 36 - "fieldReportRepository.ts"
Cohesion: 0.16
Nodes (21): FieldReportAuthoringState, GpsCaptureOutcome, SyncStatus, MobileUserRole, persistSubmissionImageMetadata(), getSubmissionImageUri(), cleanupPreparedImage(), finalizeFieldReport() (+13 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.11
Nodes (25): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+17 more)

### Community 38 - "fieldReportSyncRepository.ts"
Cohesion: 0.15
Nodes (25): countUnsyncedFieldReports(), createFieldReportSyncRepository(), FieldReportUploadRecord, findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed() (+17 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.16
Nodes (14): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+6 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.08
Nodes (42): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+34 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (25): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+17 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.17
Nodes (17): FieldReportScreen(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction() (+9 more)

### Community 44 - "apiClient.ts"
Cohesion: 0.26
Nodes (13): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+5 more)

### Community 45 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 46 - "useFieldReportDraft.test.tsx"
Cohesion: 0.17
Nodes (9): DATABASE, mockCaptureGpsLocation, mockCreateOrGetFieldReportDraft, mockFinalizeFieldReport, mockFindFieldReportByScanRecordId, mockRandomUUID, mockSaveFieldReportDraft, mockSaveGpsCapture (+1 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 50 - "saveCompletedScan.ts"
Cohesion: 0.15
Nodes (14): mockDatabase, mockRandomUUID, mockSaveCompletedScan, saveCompletedScan(), toPersistenceInput(), ManagedImage, MANAGED_IMAGE, NOW (+6 more)

### Community 51 - "captureGpsLocation.ts"
Cohesion: 0.20
Nodes (8): GpsCaptureUnavailableReason, captureGpsLocation(), ForegroundLocationClient, GpsCaptureResult, isCoordinate(), PREFERRED_GPS_ACCURACY_METERS, expoForegroundLocationClient, NOW

### Community 52 - "Radius"
Cohesion: 0.16
Nodes (12): styles, SymptomChecklistScreen(), BrandedScreenHeaderProps, styles, ProgressBar(), ProgressBarProps, styles, styles (+4 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "theme.ts"
Cohesion: 0.13
Nodes (16): InputRow(), InputRowProps, styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps (+8 more)

### Community 55 - "useAuth"
Cohesion: 0.06
Nodes (33): SplashScreen(), AppNavigator(), styles, LoginScreen(), mockReplace, mockUseAuth, mockUseAuth, DETAILS (+25 more)

### Community 56 - "runInference.ts"
Cohesion: 0.11
Nodes (18): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, DetectionError, DetectionErrorStage, asInferenceError() (+10 more)

### Community 57 - "syncFieldReport.ts"
Cohesion: 0.12
Nodes (7): FieldReportSyncRepository, MobileReportResponse, readRemoteId(), uploadMobileReport(), RETRY_DELAYS_MS, SyncFieldReportOptions, REPORT

### Community 58 - "fieldValidationCompletionTypes.ts"
Cohesion: 0.12
Nodes (8): FieldValidationGpsOutcome, completion, Contract, TestFormData, FieldValidationCompletionSyncRepository, FieldValidationCompletion, SaveFieldValidationCompletionInput, COMPLETION

### Community 59 - "scanImageStorage.test.ts"
Cohesion: 0.11
Nodes (7): managedImageExists(), joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 60 - "scanRecordRepository.ts"
Cohesion: 0.13
Nodes (20): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, buildConditions(), buildFieldReportJoinCondition() (+12 more)

### Community 61 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.08
Nodes (55): complete, state, FieldValidationAssignmentState, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError() (+47 more)

### Community 62 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 63 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 64 - "useFieldReportDraft.ts"
Cohesion: 0.18
Nodes (17): createOrGetFieldReportDraft(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture(), saveManualMapLocation(), toFieldReport() (+9 more)

### Community 65 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 66 - "home.tsx"
Cohesion: 0.10
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 67 - "use-theme.ts"
Cohesion: 0.14
Nodes (23): styles, styles, styles, ResetParams, styles, hasVerificationParams(), readParam(), styles (+15 more)

### Community 68 - "syncErrors.ts"
Cohesion: 0.09
Nodes (31): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+23 more)

### Community 70 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 73 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 74 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (12): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+4 more)

### Community 78 - "submissionImageStorage.test.ts"
Cohesion: 0.13
Nodes (6): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata

### Community 79 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.33
Nodes (3): createStatementAdapter(), prepareSync(), request

### Community 80 - "recordTypes.ts"
Cohesion: 0.19
Nodes (17): ChecklistConsistency, ModelLabel, ClassScore, DetectionResult, InferenceTimings, ReportedSeverity, ScanSessionStatus, ScanSourceType (+9 more)

## Knowledge Gaps
- **455 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mapAuthError`, `online-map-picker.tsx`, `home.tsx`, `use-theme.ts`, `Spacing`, `field-report.tsx`, `StorageError`, `analysis-result.tsx`, `record-details.tsx`, `ActivityScreen.tsx`, `Radius`, `theme.ts`, `useAuth`, `RecordCard.tsx`, `settings.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mapAuthError`, `StorageError`, `AuthProvider.test.tsx`, `schema.ts`, `settings.tsx`, `AuthProvider.tsx`, `mobileNotificationsApi.ts`, `field-report.tsx`, `fieldReportSyncRepository.ts`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `useFieldReportDraft.test.tsx`, `theme.ts`, `scanRecordRepository.ts`, `mobileFieldValidationAssignmentsApi.ts`, `useFieldReportDraft.ts`, `home.tsx`, `use-theme.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `useFieldReportDraft.ts`, `fieldValidationCompletionRepository.ts`, `mobileNotificationsApi.ts`, `fieldReportRepository.ts`, `emitSyncRecordsChanged`, `fieldReportSyncRepository.ts`, `toStorageError`, `scanRecordWriteRepository.ts`, `recordValidation.ts`, `submissionImageStorage.test.ts`, `fieldReportValidation.ts`, `saveCompletedScan.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `scanImageStorage.test.ts`, `scanRecordRepository.ts`, `mobileFieldValidationAssignmentsApi.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mapAuthError` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07062146892655367 - nodes in this community are weakly interconnected._