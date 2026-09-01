# Graph Report - caneguard-mobile  (2026-09-01)

## Corpus Check
- 273 files · ~127,466 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1757 nodes · 5102 edges · 65 communities (63 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12c0b58c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- mobileAuthApi.ts
- reportMultipartMapper.ts
- field-report.tsx
- mobileReportStatusesApi.ts
- global.d.ts
- StorageError
- Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md
- theme.ts
- ImagePreviewScreen
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.tsx
- recordTypes.ts
- fieldReportReviewRepository.ts
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- FieldValidationCompletionSyncRepository
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- fieldReportSyncRepository.ts
- useFieldValidationAssignment.ts
- submissionImageStorage.ts
- apiClient.ts
- RecordCard.tsx
- schema.ts
- detection/types.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- syncFieldValidationCompletion.ts
- online-map-picker.tsx
- fieldValidationCompletionValidation.ts
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- possibleMatchRepository.test.ts
- record-details.test.tsx
- phase1LifecycleAcceptance.test.ts
- reportRepository.ts
- possibleMatch.ts
- Radius
- useCaneGuardModel.tsx
- useTheme
- mobileFieldValidationAssignmentsApi.ts
- notificationCacheRepository.ts
- assessImageQuality.ts
- useCaneGuardDatabase
- env.ts
- saveCompletedScan.ts
- syncErrors.ts
- mobileFieldValidationAssignmentsApi.test.ts
- ThemePreferenceProvider.tsx
- runInference.ts
- Typography
- MockFile
- MockFile
- useRecords.ts
- assignmentCacheRepository.ts
- ActivityScreen.tsx
- toStorageError
- useAuth
- home.tsx
- AccountSecurityScreen.tsx
- mobileNotificationsApi.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 57 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `Radius` - 35 edges
8. `CaneGuardDatabase` - 35 edges
9. `useCaneGuardDatabase()` - 32 edges
10. `getStorageErrorMessage()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedHomeRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/__tests__/auth-bootstrap.test.tsx → src/features/auth/hooks/useAuth.ts
- `ReporterMismatchSection()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `EvidenceRow()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/field-report.tsx → src/hooks/use-theme.ts
- `SectionTitle()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts
- `QuickActionCard()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/home.tsx → src/hooks/use-theme.ts

## Import Cycles
- None detected.

## Communities (65 total, 2 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.08
Nodes (48): ForgotPasswordScreen(), styles, RegisterScreen(), styles, readParam(), ResetParams, ResetPasswordScreen(), styles (+40 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.07
Nodes (55): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+47 more)

### Community 2 - "field-report.tsx"
Cohesion: 0.09
Nodes (27): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FinalizeFieldReportFormValues, formatTimestamp() (+19 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.10
Nodes (31): contract, LifecycleContract, MOBILE_REPORT_STATUSES_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError() (+23 more)

### Community 5 - "StorageError"
Cohesion: 0.12
Nodes (22): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt(), DatabaseContext (+14 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.07
Nodes (33): InputRow(), InputRowProps, LoginScreen(), styles, DisabledRow(), DisabledRowProps, SettingsScreen(), styles (+25 more)

### Community 8 - "ImagePreviewScreen"
Cohesion: 0.27
Nodes (6): ImagePreviewScreen(), getSessionStateErrorMessage(), SessionStateError, SessionStateErrorCode, DetectionError, DetectionErrorStage

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.12
Nodes (25): CaneGuardDatabase, fieldReports, scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, createScanRecordRepository() (+17 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.tsx"
Cohesion: 0.06
Nodes (69): HomeScreen(), AuthenticatedHomeRoute(), fetchMock, mockSession, mockRouterPush, logoutMobile(), AuthContext, AuthContextValue (+61 more)

### Community 13 - "recordTypes.ts"
Cohesion: 0.16
Nodes (25): ChecklistConsistency, getChecklistConsistency(), MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType (+17 more)

### Community 14 - "fieldReportReviewRepository.ts"
Cohesion: 0.15
Nodes (17): ApplyAuthorityReviewResult, applyAuthorityReviewUpdates(), findLastAuthorityReviewFetchedAt(), findLatestAuthorityReviewUpdatedAt(), isAtLeastAsNew(), createStatementAdapter(), openTestDatabase(), readMigration() (+9 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.08
Nodes (42): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FieldReportSubmissionEvidence (+34 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.12
Nodes (16): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ChecklistObservation, GUIDED_VALIDATION_MAX_QUESTIONS (+8 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "FieldValidationCompletionSyncRepository"
Cohesion: 0.17
Nodes (4): SyncStatus, FieldValidationCompletionSyncRepository, FieldValidationCompletion, AssignmentState

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.10
Nodes (37): useStorageDiagnostics(), SaveCompletedScanOptions, assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, copyScanImageToManagedStorage(), DeleteManagedImageResult, ensureManagedScanImageDirectory() (+29 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.11
Nodes (23): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+15 more)

### Community 22 - "fieldReportSyncRepository.ts"
Cohesion: 0.07
Nodes (55): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, findLastSuccessfulFieldValidationCompletionSyncAt(), resetStaleSyncingFieldValidationCompletions(), FieldValidationCompletionSyncResult, ActiveRun, activeRuns, DatabaseRunState, FieldValidationCompletionSyncBatchResult (+47 more)

### Community 23 - "useFieldValidationAssignment.ts"
Cohesion: 0.16
Nodes (20): complete, state, markCachedFieldValidationAssignmentInProgress(), findFieldValidationCompletion(), saveFieldValidationCompletion(), toCompletion(), isSupportedPhotoMimeType(), normalizeFieldValidationText() (+12 more)

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.10
Nodes (33): persistSubmissionImageMetadata(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isLegacyUnsupportedSource(), LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS, LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES (+25 more)

### Community 25 - "apiClient.ts"
Cohesion: 0.23
Nodes (15): ApiHttpError, apiRequest(), buildRequestUrl(), createAbortError(), DEFAULT_API_TIMEOUT_MS, initializeCsrf(), normalizePath(), parseRetryAfter() (+7 more)

### Community 26 - "RecordCard.tsx"
Cohesion: 0.09
Nodes (24): InheritedScanEvidence(), BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, DiseasePill() (+16 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (24): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FIELD_VALIDATION_GPS_OUTCOMES, FieldReportRow, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow, fieldValidationCompletions (+16 more)

### Community 28 - "detection/types.ts"
Cohesion: 0.06
Nodes (47): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+39 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.13
Nodes (27): ReferenceDataState, useLocationReferenceData(), NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH (+19 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "syncFieldValidationCompletion.ts"
Cohesion: 0.14
Nodes (19): readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES, invalid(), mapFieldValidationCompletionToMultipart(), validateCompletion() (+11 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.33
Nodes (10): FieldValidationGpsOutcome, SaveFieldValidationCompletionInput, FIELD_VALIDATION_TEXT_MAX_LENGTH, invalid(), isGpsOutcome(), isUuid(), validateFieldValidationCompletionInput(), validateRequiredText() (+2 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.29
Nodes (13): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending(), markFieldValidationCompletionSynced(), markFieldValidationCompletionSyncing() (+5 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.21
Nodes (22): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileNotifications(), isAbortError(), isRecord(), malformed(), mapApiError() (+14 more)

### Community 36 - "possibleMatchRepository.test.ts"
Cohesion: 0.28
Nodes (4): createStatementAdapter(), insertScan(), openTestDatabase(), readMigration()

### Community 37 - "record-details.test.tsx"
Cohesion: 0.25
Nodes (7): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams

### Community 38 - "phase1LifecycleAcceptance.test.ts"
Cohesion: 0.29
Nodes (4): FIELD_VALIDATION_ASSIGNMENT_STATES, createStatementAdapter(), prepareSync(), request

### Community 39 - "reportRepository.ts"
Cohesion: 0.11
Nodes (19): ReportRepository, ScanRecordRepository, ScanRecordWriteRepository, DateRange, LocalReportSummary, ScanRecordQuery, buildDateCondition(), buildPendingReportCondition() (+11 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.07
Nodes (43): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+35 more)

### Community 41 - "Radius"
Cohesion: 0.12
Nodes (21): ActiveOperation, clearPendingSource(), IMAGE_PICKER_OPTIONS, rememberPendingSource(), ScanScreen(), styles, takePendingSource(), styles (+13 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.10
Nodes (21): formatNumber(), formatScore(), ModelDebugRoute(), ModelDebugScreen(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel (+13 more)

### Community 43 - "useTheme"
Cohesion: 0.10
Nodes (36): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, FinalizedReportSummary() (+28 more)

### Community 44 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.20
Nodes (26): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed(), mapApiError() (+18 more)

### Community 45 - "notificationCacheRepository.ts"
Cohesion: 0.13
Nodes (23): mobileNotifications, listCachedMobileNotifications(), replaceCachedMobileNotifications(), requireOwner(), toNotification(), toRow(), createStatementAdapter(), NOTIFICATION (+15 more)

### Community 46 - "assessImageQuality.ts"
Cohesion: 0.33
Nodes (3): ImageQualitySourceDimensions, QUALITY_WARNING_MESSAGES, PROTOTYPE_IMAGE_QUALITY_THRESHOLDS

### Community 47 - "useCaneGuardDatabase"
Cohesion: 0.29
Nodes (10): useCaneGuardDatabase(), hasStaleAuthorityReviewCache(), database, hasStaleCache, markSessionExpired, Probe(), refreshService, AuthorityReviewStatusState (+2 more)

### Community 48 - "env.ts"
Cohesion: 0.60
Nodes (4): apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl()

### Community 50 - "saveCompletedScan.ts"
Cohesion: 0.14
Nodes (15): mockDatabase, mockRandomUUID, mockSaveCompletedScan, INITIAL_STATE, SaveRecordState, SaveRecordStatus, useSaveCompletedScan(), save() (+7 more)

### Community 52 - "syncErrors.ts"
Cohesion: 0.11
Nodes (9): FieldReportSyncRepository, AUTO_RETRYABLE_SYNC_ERROR_CODES, isAbortError(), SYNC_ERROR_CODES, SyncErrorCode, toSyncError(), RETRY_DELAYS_MS, SyncFieldReportOptions (+1 more)

### Community 54 - "mobileFieldValidationAssignmentsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, request, request

### Community 55 - "ThemePreferenceProvider.tsx"
Cohesion: 0.25
Nodes (6): isThemeScheme(), ThemePreferenceContext, ThemePreferenceContextValue, ThemePreferenceProvider(), restoreThemePreference(), ThemeScheme

### Community 56 - "runInference.ts"
Cohesion: 0.11
Nodes (16): asInferenceError(), getInferenceErrorMessage(), getInferenceStage(), InferenceError, InferenceErrorCode, normalizeScores(), PostprocessedOutput, postprocessOutput() (+8 more)

### Community 57 - "Typography"
Cohesion: 0.07
Nodes (43): MetadataRow(), styles, SplashScreen(), styles, DebugRow(), DebugRun, Fixture, FIXTURES (+35 more)

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "useRecords.ts"
Cohesion: 0.11
Nodes (20): FieldReportScreen(), mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, getStorageErrorMessage() (+12 more)

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.14
Nodes (23): FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), replaceCachedFieldValidationAssignments(), requireOwner(), toAssignment() (+15 more)

### Community 63 - "ActivityScreen.tsx"
Cohesion: 0.08
Nodes (29): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+21 more)

### Community 64 - "toStorageError"
Cohesion: 0.15
Nodes (27): toStorageError(), compensateManagedImageCopy(), deleteManagedScanImage(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter() (+19 more)

### Community 65 - "useAuth"
Cohesion: 0.14
Nodes (14): AppNavigator(), styles, mockUseAuth, SESSION, useAuth(), MobileAttentionLifecycle(), CACHED, database (+6 more)

### Community 66 - "home.tsx"
Cohesion: 0.12
Nodes (20): QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle(), styles (+12 more)

### Community 67 - "AccountSecurityScreen.tsx"
Cohesion: 0.31
Nodes (6): AccountSecurityScreen(), biometricCapabilityMessage(), formatExpiry(), SecuritySection(), SecuritySectionProps, styles

### Community 68 - "mobileNotificationsApi.test.ts"
Cohesion: 0.32
Nodes (3): MOBILE_NOTIFICATIONS_V1_FIXTURE, request, request

## Knowledge Gaps
- **448 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+443 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `online-map-picker.tsx`, `field-report.tsx`, `home.tsx`, `AccountSecurityScreen.tsx`, `StorageError`, `theme.ts`, `ImagePreviewScreen`, `Radius`, `useCaneGuardModel.tsx`, `AuthProvider.tsx`, `Typography`, `RecordCard.tsx`, `useRecords.ts`, `ActivityScreen.tsx`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `mobileAuthApi.ts`, `toStorageError`, `field-report.tsx`, `home.tsx`, `AccountSecurityScreen.tsx`, `record-details.test.tsx`, `theme.ts`, `reportRepository.ts`, `possibleMatch.ts`, `useTheme`, `AuthProvider.tsx`, `useCaneGuardDatabase`, `fieldReportSyncRepository.ts`, `useFieldValidationAssignment.ts`, `useRecords.ts`, `assignmentCacheRepository.ts`, `ActivityScreen.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `toStorageError`, `fieldValidationCompletionValidation.ts`, `fieldValidationCompletionRepository.ts`, `scanRecordRepository.ts`, `notificationCacheRepository.ts`, `recordTypes.ts`, `useCaneGuardDatabase`, `fieldReportReviewRepository.ts`, `fieldReportValidation.ts`, `saveCompletedScan.ts`, `scanImageStorage.ts`, `fieldReportSyncRepository.ts`, `useFieldValidationAssignment.ts`, `submissionImageStorage.ts`, `detection/types.ts`, `assignmentCacheRepository.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `login.test.tsx` and `usePossibleRecentMatch.test.tsx`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _448 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08418079096045197 - nodes in this community are weakly interconnected._
- **Should `reportMultipartMapper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07062146892655367 - nodes in this community are weakly interconnected._