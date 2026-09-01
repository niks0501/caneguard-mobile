# Graph Report - caneguard-mobile  (2026-09-01)

## Corpus Check
- 273 files · ~127,650 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1758 nodes · 5096 edges · 67 communities (64 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a434f12b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.contract.test.ts
- Spacing
- mobileReportStatusesApi.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- settings.tsx
- inferenceErrors.ts
- scanRecordRepository.ts
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
- SyncProvider.tsx
- fieldValidationCompletionValidation.ts
- reportMultipartMapper.ts
- detection/types.ts
- theme.ts
- schema.ts
- useTheme
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncErrors.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- recordTypes.ts
- field-report.tsx
- fieldReportSyncRepository.ts
- reportRepository.ts
- possibleMatch.ts
- Radius
- useCaneGuardModel.tsx
- record-details.tsx
- mobileFieldValidationAssignmentsApi.ts
- notificationCacheRepository.ts
- assessImageQuality.ts
- biometricAuth.ts
- deviceIdentity.ts
- auth-bootstrap.test.tsx
- saveCompletedScan.ts
- analysis-result.test.tsx
- _layout.tsx
- runInference.ts
- verify-email.tsx
- MockFile
- useCaneGuardDatabase
- useFieldValidationAssignment.ts
- compareParityReference.ts
- activity.test.tsx
- toStorageError
- useMobileNotifications.test.tsx
- home.tsx
- useAuth
- repositoryContracts.ts
- createStatementAdapter
- useCaneGuardModel.web.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 58 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `Radius` - 35 edges
8. `CaneGuardDatabase` - 35 edges
9. `useCaneGuardDatabase()` - 32 edges
10. `getStorageErrorMessage()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `ReporterMismatchSection()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `ReferenceCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (67 total, 3 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.11
Nodes (39): RegisterScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail(), changePassword(), disableBiometric(), enrollMobileDevice() (+31 more)

### Community 1 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.14
Nodes (23): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+15 more)

### Community 2 - "Spacing"
Cohesion: 0.08
Nodes (30): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore() (+22 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.05
Nodes (58): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, MOBILE_REPORT_STATUSES_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses() (+50 more)

### Community 5 - "StorageError"
Cohesion: 0.12
Nodes (24): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+16 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "settings.tsx"
Cohesion: 0.22
Nodes (9): AppNavigator(), DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout (+1 more)

### Community 8 - "inferenceErrors.ts"
Cohesion: 0.19
Nodes (9): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceErrorMessage(), getInferenceStage() (+1 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.12
Nodes (22): useDatabaseState(), scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics(), buildConditions() (+14 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.21
Nodes (14): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+6 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.13
Nodes (27): AuthProvider(), AuthenticatedHomeRoute(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession() (+19 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.27
Nodes (13): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "ActivityScreen.tsx"
Cohesion: 0.10
Nodes (23): BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, ActivityScreen(), formatActivityCount() (+15 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.07
Nodes (48): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, FieldReportAuthoringState (+40 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.15
Nodes (12): ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION, SOMETHING_ELSE_OBSERVATION (+4 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (21): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+13 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (36): validateSaveCompletedScanInput(), assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME (+28 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.15
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "SyncProvider.tsx"
Cohesion: 0.10
Nodes (34): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, findLastSuccessfulFieldValidationCompletionSyncAt(), resetStaleSyncingFieldValidationCompletions(), FieldValidationCompletionSyncResult, ActiveRun, activeRuns, DatabaseRunState, FieldValidationCompletionSyncBatchResult (+26 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.15
Nodes (22): complete, state, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+14 more)

### Community 24 - "reportMultipartMapper.ts"
Cohesion: 0.05
Nodes (67): toPersistenceInput(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES, persistCandidate() (+59 more)

### Community 25 - "detection/types.ts"
Cohesion: 0.07
Nodes (40): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+32 more)

### Community 26 - "theme.ts"
Cohesion: 0.07
Nodes (36): styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps, DiseaseBadge(), DiseaseBadgeProps, styles (+28 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (19): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+11 more)

### Community 28 - "useTheme"
Cohesion: 0.13
Nodes (25): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, AssignmentSummary() (+17 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncErrors.ts"
Cohesion: 0.16
Nodes (14): syncFieldValidationCompletion(), executeBatch(), AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), isAutoRetryableSyncErrorCode(), SYNC_ERROR_CODES, SyncErrorCode, toSyncError() (+6 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.13
Nodes (25): AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock() (+17 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.17
Nodes (20): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending(), markFieldValidationCompletionSynced() (+12 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.22
Nodes (21): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+13 more)

### Community 36 - "recordTypes.ts"
Cohesion: 0.10
Nodes (28): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, FieldReportRow, ScanClassScoreRow (+20 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.14
Nodes (19): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+11 more)

### Community 38 - "fieldReportSyncRepository.ts"
Cohesion: 0.22
Nodes (15): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), FindSyncCandidatesOptions, markFieldReportFailed(), markFieldReportPending() (+7 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.19
Nodes (12): fieldReports, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary(), PROTOTYPE_LOW_SCORE_THRESHOLD, DATABASE (+4 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.06
Nodes (47): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+39 more)

### Community 41 - "Radius"
Cohesion: 0.12
Nodes (20): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), styles (+12 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.11
Nodes (18): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel (+10 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.13
Nodes (24): FieldReportScreen(), InheritedScanEvidence(), CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt() (+16 more)

### Community 44 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.05
Nodes (56): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath() (+48 more)

### Community 45 - "notificationCacheRepository.ts"
Cohesion: 0.15
Nodes (23): MobileNotificationsResult, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), NOTIFICATION, openTestDatabase() (+15 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.28
Nodes (5): assessImageQuality(), ImageQualityAssessment, ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 50 - "saveCompletedScan.ts"
Cohesion: 0.13
Nodes (17): insertScanRecord(), isDuplicateRecordError(), mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus (+9 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 55 - "_layout.tsx"
Cohesion: 0.17
Nodes (9): styles, MobileAttentionLifecycle(), useMobileNotifications(), isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference() (+1 more)

### Community 56 - "runInference.ts"
Cohesion: 0.20
Nodes (9): asInferenceError(), InferenceError, normalizeScores(), PostprocessedOutput, postprocessOutput(), InferenceRunner, runInference(), softmax() (+1 more)

### Community 57 - "verify-email.tsx"
Cohesion: 0.53
Nodes (5): hasVerificationParams(), readParam(), styles, VerifyEmailScreen(), VerifyParams

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useCaneGuardDatabase"
Cohesion: 0.25
Nodes (11): useCaneGuardDatabase(), getStorageErrorMessage(), useFieldValidationAssignments(), refreshFieldValidationAssignments(), mockDatabase, mockListScanRecords, QueryState, usePaginatedScanRecords() (+3 more)

### Community 61 - "useFieldValidationAssignment.ts"
Cohesion: 0.13
Nodes (25): FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner() (+17 more)

### Community 62 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 63 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 64 - "toStorageError"
Cohesion: 0.14
Nodes (30): toStorageError(), persistSubmissionImageMetadata(), deleteManagedScanImage(), getSubmissionImageUri(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId() (+22 more)

### Community 65 - "useMobileNotifications.test.tsx"
Cohesion: 0.25
Nodes (6): CACHED, database, listCache, markSessionExpired, Probe(), refreshService

### Community 66 - "home.tsx"
Cohesion: 0.10
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 67 - "useAuth"
Cohesion: 0.08
Nodes (30): ForgotPasswordScreen(), styles, SplashScreen(), styles, InputRow(), InputRowProps, LoginScreen(), styles (+22 more)

### Community 68 - "repositoryContracts.ts"
Cohesion: 0.19
Nodes (8): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, LocalReportOptions, LocalReportState

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

## Knowledge Gaps
- **447 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+442 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `home.tsx`, `Spacing`, `useAuth`, `field-report.tsx`, `StorageError`, `settings.tsx`, `inferenceErrors.ts`, `Radius`, `record-details.tsx`, `ActivityScreen.tsx`, `verify-email.tsx`, `theme.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `toStorageError`, `fieldValidationCompletionRepository.ts`, `mobileReportStatusesApi.ts`, `fieldReportSyncRepository.ts`, `scanRecordRepository.ts`, `notificationCacheRepository.ts`, `recordValidation.ts`, `fieldReportValidation.ts`, `saveCompletedScan.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `reportMultipartMapper.ts`, `useCaneGuardDatabase`, `useFieldValidationAssignment.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `toStorageError`, `useMobileNotifications.test.tsx`, `home.tsx`, `mobileReportStatusesApi.ts`, `field-report.tsx`, `settings.tsx`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `AuthProvider.test.tsx`, `notificationCacheRepository.ts`, `fieldReportValidation.ts`, `auth-bootstrap.test.tsx`, `fieldValidationCompletionValidation.ts`, `SyncProvider.tsx`, `_layout.tsx`, `useCaneGuardDatabase`, `useFieldValidationAssignment.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `login.test.tsx` and `usePossibleRecentMatch.test.tsx`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _447 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11414141414141414 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.contract.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._