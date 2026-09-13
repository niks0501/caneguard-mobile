# Graph Report - 01M2DG4BRS96HKRJQ2B9TYZAJ5  (2026-09-13)

## Corpus Check
- 282 files · ~134,776 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1842 nodes · 5386 edges · 69 communities (65 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `42c1b825`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- useTheme
- mobileReportStatusesApi.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- localDataLifecycle.test.ts
- mobileNotificationsApi.ts
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- ActivityScreen.tsx
- fieldReportRepository.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- SyncProvider.tsx
- migrations.test.ts
- scanImageStorage.ts
- apiClient.ts
- recordTypes.ts
- fieldValidationCompletionValidation.ts
- submissionImageStorage.ts
- model-debug.tsx
- ComponentTokens
- schema.ts
- useAuth
- referenceDataTypes.ts
- readPickerOutcome.ts
- Spacing
- online-map-picker.tsx
- AuthProvider.tsx
- fieldValidationCompletionRepository.ts
- possibleMatchRepository.test.ts
- mobileFieldValidationAssignmentsApi.test.ts
- field-report.tsx
- syncErrors.ts
- repositoryContracts.ts
- possibleMatch.ts
- scan.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- activity.test.tsx
- mobileReportStatusesApi.test.ts
- biometricAuth.ts
- deviceIdentity.ts
- assessImageQuality.ts
- analysis-result.tsx
- analysis-result.test.tsx
- theme.ts
- detection/types.ts
- runInference.ts
- mobileFieldValidationAssignmentsApi.ts
- syncFieldValidationCompletion.ts
- MockFile
- useFieldValidationAssignment.ts
- useFieldValidationAssignments.ts
- modelContract.ts
- toStorageError
- reportReviewTypes.ts
- home.tsx
- Typography
- FieldReportSyncRepository
- ScanRecordListItem
- useCaneGuardModel.web.tsx
- MockFile
- mobileNotificationsApi.test.ts

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

## Communities (69 total, 4 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.09
Nodes (43): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail() (+35 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (56): MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES, appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf() (+48 more)

### Community 2 - "useTheme"
Cohesion: 0.10
Nodes (29): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, DisabledRow() (+21 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (45): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+37 more)

### Community 5 - "StorageError"
Cohesion: 0.08
Nodes (41): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+33 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "localDataLifecycle.test.ts"
Cohesion: 0.08
Nodes (15): createStatementAdapter(), insertCompletion(), insertScan(), MIGRATIONS, openTestDatabase(), readMigration(), deleteFieldValidationPhoto(), getFieldValidationPhotoDirectory() (+7 more)

### Community 8 - "mobileNotificationsApi.ts"
Cohesion: 0.07
Nodes (53): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+45 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.08
Nodes (42): cleanupImages(), clearLocalDataForOwner(), ImageCleanupTargets, LOCAL_DATA_RETENTION_DAYS, LocalDataCleanupResult, purgeExpiredLocalData(), readCleanupTargets(), LEGACY_UNASSIGNED_OWNER_IDENTITY (+34 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.13
Nodes (25): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), calculateAspectPreservingResize(), createLetterboxGeometry(), letterboxRgbPixels(), roundTiesToEven() (+17 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.14
Nodes (26): AuthProvider(), SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearLegacyMobileSession(), clearMobileSession() (+18 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.27
Nodes (15): getChecklistConsistency(), LEGACY_MODEL_LABELS, LEGACY_MODEL_VERSION, createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS (+7 more)

### Community 14 - "ActivityScreen.tsx"
Cohesion: 0.14
Nodes (17): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), openNotification(), StateCard(), styles (+9 more)

### Community 15 - "fieldReportRepository.ts"
Cohesion: 0.12
Nodes (38): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, toSubmissionEvidence(), toSubmissionPreparationInput(), FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS (+30 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.14
Nodes (13): CHECKLIST_MODEL_LABELS, ChecklistObservation, ChecklistObservationId, GUIDED_VALIDATION_MAX_QUESTIONS, GuidedValidationQuestion, MOSAIC_OBSERVATION, NO_SUPPORTED_PATTERN_OBSERVATION, RUST_OBSERVATION (+5 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "SyncProvider.tsx"
Cohesion: 0.15
Nodes (24): findLastSuccessfulFieldValidationCompletionSyncAt(), resetStaleSyncingFieldValidationCompletions(), syncPendingFieldValidationCompletions(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findLastSuccessfulFieldReportSyncAt(), markFieldReportFailed(), markFieldReportPending() (+16 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.11
Nodes (13): migration0, migration1, migration10, migration11, migration12, migration2, migration3, migration4 (+5 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.09
Nodes (44): isSafeOwnerIdentity(), useStorageDiagnostics(), ScanSourceType, SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), compensateManagedImageCopy(), CompensationCleanupResult (+36 more)

### Community 21 - "apiClient.ts"
Cohesion: 0.20
Nodes (17): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+9 more)

### Community 22 - "recordTypes.ts"
Cohesion: 0.40
Nodes (9): ChecklistConsistency, ModelLabel, ClassScore, ReportedSeverity, QualityWarning, CompletedScanDraft, DEFAULT_RECORD_PAGE_SIZE, RecordsByLabel (+1 more)

### Community 23 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.19
Nodes (18): FIELD_VALIDATION_GPS_OUTCOMES, invalid(), isGpsOutcome(), isSupportedPhotoMimeType(), isUuid(), normalizeFieldValidationText(), validateFieldValidationCompletionInput(), validateRequiredText() (+10 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.10
Nodes (36): persistSubmissionImageMetadata(), toPersistenceInput(), getManagedScanImageDirectory(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri() (+28 more)

### Community 25 - "model-debug.tsx"
Cohesion: 0.16
Nodes (13): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen() (+5 more)

### Community 26 - "ComponentTokens"
Cohesion: 0.16
Nodes (13): AppCardProps, styles, DiseasePill(), DiseasePillProps, DiseasePillVariant, styles, VARIANT_MAP, ComponentTokens (+5 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (24): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+16 more)

### Community 28 - "useAuth"
Cohesion: 0.06
Nodes (29): AppNavigator(), styles, LoginScreen(), fetchMock, mockReplace, mockUseAuth, mockUseAuth, DETAILS (+21 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.11
Nodes (31): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION (+23 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "Spacing"
Cohesion: 0.22
Nodes (8): styles, SummaryTile(), SummaryTileProps, Spacing, BarangayOption(), BarangayPicker(), filterBarangayOptions(), styles

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (34): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+26 more)

### Community 33 - "AuthProvider.tsx"
Cohesion: 0.13
Nodes (25): LOCAL_SESSION_MAX_AGE_MS, AuthContextValue, getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), shouldDisableBiometricUnlock() (+17 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.17
Nodes (20): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending(), markFieldValidationCompletionSynced() (+12 more)

### Community 35 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 36 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 37 - "field-report.tsx"
Cohesion: 0.13
Nodes (22): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizedReportSummary(), FinalizeFieldReportFormValues (+14 more)

### Community 38 - "syncErrors.ts"
Cohesion: 0.09
Nodes (33): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, syncFieldValidationCompletion(), ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult (+25 more)

### Community 39 - "repositoryContracts.ts"
Cohesion: 0.19
Nodes (8): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, SaveCompletedScanInput, LocalReportOptions, LocalReportState

### Community 40 - "possibleMatch.ts"
Cohesion: 0.07
Nodes (42): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+34 more)

### Community 41 - "scan.tsx"
Cohesion: 0.11
Nodes (19): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), BottomNav() (+11 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.09
Nodes (22): ModelSmokeTestScreen(), mockPreprocessImage, mockRun, mockRunInference, mockUseCaneGuardModel, mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel (+14 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.14
Nodes (21): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+13 more)

### Community 44 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 47 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 48 - "deviceIdentity.ts"
Cohesion: 0.52
Nodes (4): DEVICE_ID_OPTIONS, DeviceIdentityError, getOrCreateMobileDeviceId(), isOpaqueDeviceId()

### Community 50 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 52 - "analysis-result.tsx"
Cohesion: 0.10
Nodes (27): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+19 more)

### Community 53 - "analysis-result.test.tsx"
Cohesion: 0.17
Nodes (11): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+3 more)

### Community 54 - "theme.ts"
Cohesion: 0.10
Nodes (21): InputRow(), InputRowProps, styles, styles, ThemedText(), ThemedTextProps, ThemedView(), ThemedViewProps (+13 more)

### Community 55 - "detection/types.ts"
Cohesion: 0.06
Nodes (45): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+37 more)

### Community 56 - "runInference.ts"
Cohesion: 0.14
Nodes (14): DetectionError, DetectionErrorStage, asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores() (+6 more)

### Community 57 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.20
Nodes (26): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+18 more)

### Community 58 - "syncFieldValidationCompletion.ts"
Cohesion: 0.09
Nodes (20): FieldValidationGpsOutcome, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart() (+12 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useFieldValidationAssignment.ts"
Cohesion: 0.12
Nodes (20): complete, state, findCachedFieldValidationAssignment(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment() (+12 more)

### Community 61 - "useFieldValidationAssignments.ts"
Cohesion: 0.16
Nodes (17): FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, listCachedFieldValidationAssignments(), ASSIGNMENT, createStatementAdapter(), openTestDatabase(), readMigration(), FieldValidationAssignment (+9 more)

### Community 62 - "modelContract.ts"
Cohesion: 0.10
Nodes (31): DevelopmentModelSmokeTestScreen(), HEALTHY_FIXTURE, HEALTHY_FIXTURE_DIMENSIONS, MetadataRow(), SmokeVerification, styles, IconSize, diseaseCatalog (+23 more)

### Community 64 - "toStorageError"
Cohesion: 0.11
Nodes (30): toStorageError(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportById(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft(), saveGpsCapture() (+22 more)

### Community 65 - "reportReviewTypes.ts"
Cohesion: 0.21
Nodes (11): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewStatusKind, getAuthorityReviewPresentation() (+3 more)

### Community 66 - "home.tsx"
Cohesion: 0.10
Nodes (23): FieldReportScreen(), HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone (+15 more)

### Community 67 - "Typography"
Cohesion: 0.09
Nodes (28): styles, SplashScreen(), styles, styles, ResetParams, styles, hasVerificationParams(), readParam() (+20 more)

### Community 69 - "ScanRecordListItem"
Cohesion: 0.15
Nodes (11): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, SyncStatus, ScanRecordListItem (+3 more)

### Community 71 - "useCaneGuardModel.web.tsx"
Cohesion: 0.29
Nodes (4): CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 79 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

## Knowledge Gaps
- **468 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+463 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `home.tsx`, `Typography`, `field-report.tsx`, `StorageError`, `scan.tsx`, `record-details.tsx`, `ActivityScreen.tsx`, `analysis-result.tsx`, `theme.ts`, `model-debug.tsx`, `ComponentTokens`, `useAuth`, `modelContract.ts`, `Spacing`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `toStorageError`, `fieldValidationCompletionRepository.ts`, `mobileReportStatusesApi.ts`, `mobileNotificationsApi.ts`, `scanRecordRepository.ts`, `recordValidation.ts`, `fieldReportRepository.ts`, `scanImageStorage.ts`, `detection/types.ts`, `fieldValidationCompletionValidation.ts`, `submissionImageStorage.ts`, `useFieldValidationAssignment.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `toStorageError`, `home.tsx`, `Typography`, `useTheme`, `field-report.tsx`, `StorageError`, `mobileReportStatusesApi.ts`, `mobileNotificationsApi.ts`, `possibleMatch.ts`, `scanRecordRepository.ts`, `record-details.tsx`, `AuthProvider.test.tsx`, `SyncProvider.tsx`, `scanImageStorage.ts`, `theme.ts`, `useFieldValidationAssignment.ts`, `useFieldValidationAssignments.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `index.test.tsx` and `login.test.tsx`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _468 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09361393323657474 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06885245901639345 - nodes in this community are weakly interconnected._