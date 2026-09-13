# Graph Report - 01M2DG4BRS96HKRJQ2B9TYZAJ5  (2026-09-13)

## Corpus Check
- 282 files · ~134,726 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1841 nodes · 5384 edges · 78 communities (75 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd3b13c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- fieldReportReviewRepository.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- fieldValidationPhotoStorage.ts
- mobileNotificationsApi.ts
- CaneGuardDatabase
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- ActivityScreen.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- validateModelContract.ts
- recordTypes.ts
- fieldValidationCompletionValidation.ts
- submissionImageStorage.ts
- scan.test.tsx
- Typography
- schema.ts
- _layout.tsx
- referenceDataTypes.ts
- readPickerOutcome.ts
- inferenceErrors.ts
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- notificationCacheRepository.ts
- scanRecordRepository.ts
- field-report.tsx
- syncPendingFieldReports.ts
- reportRepository.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- activity.test.tsx
- fieldValidationPhotoStorage.test.ts
- diseaseCatalog.ts
- biometricAuth.ts
- deviceIdentity.ts
- saveCompletedScan.ts
- assessImageQuality.ts
- useMobileNotifications.ts
- Spacing
- analysis-result.test.tsx
- theme.ts
- symptom-checklist.test.tsx
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- syncFieldValidationCompletion.ts
- MockFile
- toStorageError
- assignmentCacheRepository.ts
- modelContract.ts
- field-validation.tsx
- fieldReportRepository.ts
- reportReviewTypes.ts
- home.tsx
- useAuth.ts
- syncErrors.ts
- records.test.tsx
- saveCompletedScan.test.ts
- useCaneGuardModel.web.tsx
- auth-bootstrap.test.tsx
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
- `EvidenceForm()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-validation.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (78 total, 3 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.09
Nodes (43): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail() (+35 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.06
Nodes (63): LEGACY_MODEL_VERSION, readPersistedArtifact(), isValidSubmissionImageMetadata(), MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES, normalizeMobileReportImageMimeType(), appendMismatchReported() (+55 more)

### Community 2 - "useTheme"
Cohesion: 0.08
Nodes (33): MetadataRow(), styles, DebugRow(), DebugRun, Fixture, FIXTURES, styles, DisabledRow() (+25 more)

### Community 3 - "fieldReportReviewRepository.ts"
Cohesion: 0.11
Nodes (26): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), hasStaleAuthorityReviewCache(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase() (+18 more)

### Community 5 - "StorageError"
Cohesion: 0.12
Nodes (23): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+15 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "fieldValidationPhotoStorage.ts"
Cohesion: 0.13
Nodes (15): createStatementAdapter(), insertCompletion(), MIGRATIONS, openTestDatabase(), readMigration(), deleteFieldValidationPhoto(), FieldValidationPhotoArtifact, FieldValidationPhotoInput (+7 more)

### Community 8 - "mobileNotificationsApi.ts"
Cohesion: 0.18
Nodes (22): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+14 more)

### Community 10 - "CaneGuardDatabase"
Cohesion: 0.12
Nodes (21): CaneGuardDatabase, cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, purgeExpiredLocalData(), readCleanupTargets(), fieldReports (+13 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.13
Nodes (25): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), LetterboxGeometry, letterboxRgbPixels() (+17 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.13
Nodes (27): AuthProvider(), AuthenticatedHomeRoute(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession() (+19 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.33
Nodes (13): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+5 more)

### Community 14 - "ActivityScreen.tsx"
Cohesion: 0.14
Nodes (17): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), openNotification(), StateCard(), styles (+9 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.07
Nodes (50): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, FieldReportAuthoringState (+42 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.12
Nodes (14): CHECKLIST_MODEL_LABELS, CHECKLIST_OBSERVATIONS, ChecklistObservation, GUIDED_VALIDATION_MAX_QUESTIONS, GUIDED_VALIDATION_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION (+6 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.12
Nodes (30): syncPendingFieldValidationCompletions(), findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions (+22 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.10
Nodes (14): LEGACY_UNASSIGNED_OWNER_IDENTITY, migration0, migration1, migration10, migration11, migration12, migration2, migration3 (+6 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (38): isSafeOwnerIdentity(), useStorageDiagnostics(), assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, copyScanImageToManagedStorage(), DeleteManagedImageResult (+30 more)

### Community 21 - "validateModelContract.ts"
Cohesion: 0.43
Nodes (4): ModelMetadata, tensorMatches(), TensorMetadata, validateModelContract()

### Community 22 - "recordTypes.ts"
Cohesion: 0.18
Nodes (16): SyncStatus, ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, QualityWarning, ScanRecordRepository (+8 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.27
Nodes (12): FIELD_VALIDATION_GPS_OUTCOMES, FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput() (+4 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.09
Nodes (30): insertScan(), persistSubmissionImageMetadata(), getManagedScanImageDirectory(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri() (+22 more)

### Community 25 - "scan.test.tsx"
Cohesion: 0.17
Nodes (10): mockDispatch, mockGetPendingResult, mockLaunchCamera, mockLaunchImageLibrary, mockRequestCameraPermission, mockRouterPush, renderScan(), ScanHarness() (+2 more)

### Community 26 - "Typography"
Cohesion: 0.10
Nodes (25): DiseaseBadge(), DiseaseBadgeProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP (+17 more)

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (22): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES, MobileNotificationRow (+14 more)

### Community 28 - "_layout.tsx"
Cohesion: 0.16
Nodes (9): AppNavigator(), styles, ScanSessionProvider(), isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference() (+1 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "inferenceErrors.ts"
Cohesion: 0.19
Nodes (9): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage, getInferenceErrorMessage(), getInferenceStage() (+1 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (34): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+26 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.12
Nodes (26): LOCAL_SESSION_MAX_AGE_MS, AuthContext, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError() (+18 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.23
Nodes (19): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+11 more)

### Community 35 - "notificationCacheRepository.ts"
Cohesion: 0.16
Nodes (18): mobileNotifications, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), MobileNotification, MobileNotificationsState (+10 more)

### Community 36 - "scanRecordRepository.ts"
Cohesion: 0.19
Nodes (12): scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, buildConditions(), buildFieldReportJoinCondition(), isDuplicateRecordError() (+4 more)

### Community 37 - "field-report.tsx"
Cohesion: 0.11
Nodes (25): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+17 more)

### Community 38 - "syncPendingFieldReports.ts"
Cohesion: 0.13
Nodes (19): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+11 more)

### Community 39 - "reportRepository.ts"
Cohesion: 0.17
Nodes (15): ReportRepository, DateRange, LocalReportSummary, buildDateCondition(), buildPendingReportCondition(), createReportRepository(), DEFAULT_RECENT_RECORD_LIMIT, getLocalReportSummary() (+7 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.07
Nodes (43): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+35 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.15
Nodes (17): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ActiveOperation (+9 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.08
Nodes (26): formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), ModelSmokeTestScreen(), mockModelRun, mockPreprocessImage, mockRunInference (+18 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.19
Nodes (15): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+7 more)

### Community 44 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 45 - "fieldValidationPhotoStorage.test.ts"
Cohesion: 0.16
Nodes (6): joinParts(), mockDirectories, MockDirectory, MockFile, MockFileEntry, mockFiles

### Community 46 - "diseaseCatalog.ts"
Cohesion: 0.50
Nodes (3): diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 49 - "saveCompletedScan.ts"
Cohesion: 0.19
Nodes (11): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, saveCompletedScan(), SaveCompletedScanOptions (+3 more)

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 51 - "useMobileNotifications.ts"
Cohesion: 0.23
Nodes (9): MobileAttentionLifecycle(), CACHED, database, listCache, markSessionExpired, Probe(), refreshService, useMobileNotifications() (+1 more)

### Community 52 - "Spacing"
Cohesion: 0.09
Nodes (23): styles, SymptomChecklistScreen(), BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles (+15 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "theme.ts"
Cohesion: 0.11
Nodes (18): InputRow(), InputRowProps, LoginScreen(), styles, mockUseAuth, styles, ThemedText(), ThemedTextProps (+10 more)

### Community 55 - "symptom-checklist.test.tsx"
Cohesion: 0.21
Nodes (10): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, smutState, ScanSessionContext, ScanSessionContextValue (+2 more)

### Community 56 - "runInference.ts"
Cohesion: 0.20
Nodes (8): asInferenceError(), InferenceError, normalizeScores(), PostprocessedOutput, postprocessOutput(), InferenceRunner, runInference(), softmax()

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.05
Nodes (72): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath() (+64 more)

### Community 58 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (21): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+13 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "toStorageError"
Cohesion: 0.18
Nodes (24): FieldReportScreen(), complete, state, useCaneGuardDatabase(), getStorageErrorMessage(), toStorageError(), CompleteFieldValidationInput, useFieldValidationAssignment() (+16 more)

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.13
Nodes (23): fieldValidationAssignments, FieldValidationAssignmentState, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner() (+15 more)

### Community 62 - "modelContract.ts"
Cohesion: 0.12
Nodes (27): DevelopmentModelSmokeTestScreen(), HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), SmokeVerification, styles, IconSize, MODEL_FILENAME (+19 more)

### Community 63 - "field-validation.tsx"
Cohesion: 0.32
Nodes (7): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles

### Community 64 - "fieldReportRepository.ts"
Cohesion: 0.10
Nodes (30): requireOwnerIdentity(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture() (+22 more)

### Community 65 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 66 - "home.tsx"
Cohesion: 0.10
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 67 - "useAuth.ts"
Cohesion: 0.08
Nodes (31): styles, SplashScreen(), styles, styles, ResetParams, styles, mockReplace, mockUseAuth (+23 more)

### Community 68 - "syncErrors.ts"
Cohesion: 0.09
Nodes (14): FieldReportSyncRepository, AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), SYNC_ERROR_CODES, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS, syncFieldReport() (+6 more)

### Community 69 - "records.test.tsx"
Cohesion: 0.25
Nodes (6): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD

### Community 70 - "saveCompletedScan.test.ts"
Cohesion: 0.33
Nodes (4): ManagedImage, MANAGED_IMAGE, NOW, save()

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 73 - "notificationCacheRepository.test.ts"
Cohesion: 0.28
Nodes (6): MobileNotificationsResult, createStatementAdapter(), NOTIFICATION, openTestDatabase(), readMigration(), MobileNotificationUpdate

### Community 74 - "image-preview.test.tsx"
Cohesion: 0.18
Nodes (13): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+5 more)

### Community 79 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.24
Nodes (5): createStatementAdapter(), prepareSync(), request, MOBILE_NOTIFICATIONS_V1_FIXTURE, request

### Community 80 - "detection/types.ts"
Cohesion: 0.24
Nodes (8): ChecklistObservationId, completedResult, DetectionResult, InferenceTimings, ScanSessionState, ScanSessionStatus, ImageQualityAssessment, NOW

## Knowledge Gaps
- **468 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+463 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `home.tsx`, `useAuth.ts`, `field-report.tsx`, `StorageError`, `analysis-result.tsx`, `useCaneGuardModel.tsx`, `record-details.tsx`, `inferenceErrors.ts`, `ActivityScreen.tsx`, `Spacing`, `theme.ts`, `Typography`, `toStorageError`, `modelContract.ts`, `field-validation.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `toStorageError` to `mobileAuthApi.ts`, `useTheme`, `fieldReportReviewRepository.ts`, `AuthProvider.test.tsx`, `fieldReportValidation.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `_layout.tsx`, `scanRecordRepository.ts`, `field-report.tsx`, `reportRepository.ts`, `possibleMatch.ts`, `record-details.tsx`, `saveCompletedScan.ts`, `useMobileNotifications.ts`, `theme.ts`, `fieldReportRepository.ts`, `home.tsx`, `useAuth.ts`, `auth-bootstrap.test.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `fieldReportReviewRepository.ts`, `fieldValidationPhotoStorage.ts`, `CaneGuardDatabase`, `recordValidation.ts`, `fieldReportValidation.ts`, `fieldReportSyncRepository.ts`, `migrations.test.ts`, `scanImageStorage.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `fieldValidationCompletionRepository.ts`, `notificationCacheRepository.ts`, `scanRecordRepository.ts`, `saveCompletedScan.ts`, `toStorageError`, `assignmentCacheRepository.ts`, `fieldReportRepository.ts`, `saveCompletedScan.test.ts`, `detection/types.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _468 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09361393323657474 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06095481670929241 - nodes in this community are weakly interconnected._