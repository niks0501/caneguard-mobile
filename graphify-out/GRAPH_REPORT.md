# Graph Report - caneguard-mobile  (2026-08-31)

## Corpus Check
- 272 files · ~126,228 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1749 nodes · 5074 edges · 68 communities (66 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9a3a127`
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
- theme.ts
- model-debug.tsx
- scanRecordRepository.ts
- preprocessImage.ts
- AuthProvider.test.tsx
- recordValidation.ts
- field-report.tsx
- fieldReportValidation.ts
- checklistConsistency.ts
- Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?
- fieldReportSyncRepository.ts
- migrations.test.ts
- scanImageStorage.ts
- modelContract.ts
- syncErrors.ts
- useSaveCompletedScan.test.tsx
- submissionImageStorage.ts
- reportMultipartMapper.contract.test.ts
- ActivityScreen.tsx
- schema.ts
- detection/types.ts
- referenceDataTypes.ts
- readPickerOutcome.ts
- fieldValidationCompletionValidation.ts
- online-map-picker.tsx
- home.tsx
- fieldValidationCompletionRepository.ts
- mobileNotificationsApi.ts
- Radius
- auth/types.ts
- reportReviewTypes.ts
- useLocalReport.ts
- possibleMatch.ts
- analysis-result.tsx
- useCaneGuardModel.tsx
- record-details.tsx
- mobileFieldValidationAssignmentsApi.ts
- toStorageError
- compareParityReference.ts
- useAuth
- runInference.ts
- AuthProvider.tsx
- recordTypes.ts
- use-theme.ts
- FieldReportSyncRepository
- activity.test.tsx
- image-preview.test.tsx
- useAuth.ts
- inferenceErrors.ts
- settings.tsx
- submissionImageStorage.test.ts
- MockFile
- ScanRecordListItem
- assignmentCacheRepository.ts
- biometricAuth.ts
- ActivityScreen
- model-debug.test.tsx
- activityTypes.ts
- listScanRecords
- reportMultipartMapper.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 133 edges
2. `toStorageError()` - 88 edges
3. `StorageError` - 74 edges
4. `useAuth()` - 53 edges
5. `Typography` - 42 edges
6. `Spacing` - 39 edges
7. `Radius` - 35 edges
8. `CaneGuardDatabase` - 35 edges
9. `useCaneGuardDatabase()` - 32 edges
10. `getStorageErrorMessage()` - 26 edges

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

## Communities (68 total, 2 thin omitted)

### Community 0 - "mobileAuthApi.ts"
Cohesion: 0.10
Nodes (39): ForgotPasswordScreen(), RegisterScreen(), readParam(), ResetPasswordScreen(), AUTH_ERROR_MESSAGES, authError(), AuthRequestKind, changeEmail() (+31 more)

### Community 1 - "reportMultipartMapper.ts"
Cohesion: 0.16
Nodes (30): appendMismatchReported(), appendNumber(), appendOptionalText(), IMAGE_SOURCE_TYPES, invalid(), isIntegerInRange(), isOneOf(), LOCATION_SOURCES (+22 more)

### Community 2 - "useTheme"
Cohesion: 0.12
Nodes (23): AssignmentSummary(), CompletionStatus(), EvidenceForm(), FieldValidationScreen(), formatTimestamp(), Row(), styles, SplashScreen() (+15 more)

### Community 3 - "mobileReportStatusesApi.ts"
Cohesion: 0.08
Nodes (45): assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileReportStatuses(), isAbortError(), isRecord(), mapApiError(), MobileReportStatusesResult (+37 more)

### Community 5 - "StorageError"
Cohesion: 0.09
Nodes (35): CANEGUARD_DATABASE_FILENAME, CaneGuardDatabase, CaneGuardDatabaseResources, clearCaneGuardDatabaseResourcesForRetry(), createCaneGuardDatabaseResources(), getCaneGuardDatabaseResources(), CaneGuardDatabaseProvider(), DatabaseConnectionAttempt() (+27 more)

### Community 6 - "Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Phase 5 is working. Let's proceed with the next phase, @docs/model-v0-integration-plan/06-symptom-validation-and-result-ui.md, Source Nodes

### Community 7 - "theme.ts"
Cohesion: 0.12
Nodes (17): InputRow(), InputRowProps, LoginScreen(), styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+9 more)

### Community 8 - "model-debug.tsx"
Cohesion: 0.11
Nodes (22): DebugRow(), DebugRun, Fixture, FIXTURES, formatNumber(), formatScore(), ModelDebugScreen(), styles (+14 more)

### Community 10 - "scanRecordRepository.ts"
Cohesion: 0.08
Nodes (33): useDatabaseState(), fieldReports, scanClassScores, scanQualityWarnings, scanRecords, scanSymptoms, StorageDiagnostics, useStorageDiagnostics() (+25 more)

### Community 11 - "preprocessImage.ts"
Cohesion: 0.20
Nodes (15): createInputTensor(), InputTensor, DecodedJpeg, decodeJpeg(), now(), preprocessImage(), asPreprocessingError(), getPreprocessingErrorMessage() (+7 more)

### Community 12 - "AuthProvider.test.tsx"
Cohesion: 0.15
Nodes (25): SESSION, SESSION, assertPersistableSession(), BiometricSessionError, BiometricSessionErrorCode, clearMobileSession(), clearMobileSessionBestEffort(), deleteBestEffort() (+17 more)

### Community 13 - "recordValidation.ts"
Cohesion: 0.30
Nodes (14): getChecklistConsistency(), createCompletedScanDraft(), invalid(), QUALITY_WARNINGS, REPORTED_SEVERITIES, SYMPTOM_KEYS, validateClassScores(), validateCompletedScanDraft() (+6 more)

### Community 14 - "field-report.tsx"
Cohesion: 0.12
Nodes (23): AuthorityReviewSection(), AutomaticSummaryCard(), canUseManualMap(), DraftFields(), EvidenceRow(), FieldReportFormValues, FieldReportScreen(), FinalizedReportSummary() (+15 more)

### Community 15 - "fieldReportValidation.ts"
Cohesion: 0.06
Nodes (50): FieldReportAuthoringState, GpsCaptureOutcome, MobileUserRole, FieldReportUploadRecord, CreateFieldReportDraftInput, FIELD_REPORT_SUBMISSION_REQUIREMENTS, FieldReport, FieldReportSubmissionEvidence (+42 more)

### Community 16 - "checklistConsistency.ts"
Cohesion: 0.12
Nodes (16): completedResult, completedState, mockDispatch, mockRouterPush, mockRouterReplace, CHECKLIST_OBSERVATIONS, ChecklistObservation, GUIDED_VALIDATION_MAX_QUESTIONS (+8 more)

### Community 17 - "Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should Phase 5 TFLite inference connect the existing preprocessing contract, model constants and detection UI, and what comparable tests and runtime APIs already exist?, Source Nodes

### Community 18 - "fieldReportSyncRepository.ts"
Cohesion: 0.12
Nodes (30): findFieldReportById(), countUnsyncedFieldReports(), createFieldReportSyncRepository(), findFieldReportSyncCandidates(), findFieldReportUploadRecord(), findLastSuccessfulFieldReportSyncAt(), FindSyncCandidatesOptions, markFieldReportFailed() (+22 more)

### Community 19 - "migrations.test.ts"
Cohesion: 0.12
Nodes (12): migration0, migration1, migration10, migration11, migration2, migration3, migration4, migration5 (+4 more)

### Community 20 - "scanImageStorage.ts"
Cohesion: 0.11
Nodes (31): assertManagedScanImageUri(), collectManagedScanImageFiles(), CompensationCleanupResult, CopyScanImageInput, DeleteManagedImageResult, ensureManagedScanImageDirectory(), EXTENSION_TO_MIME, findOrphanedManagedImages() (+23 more)

### Community 21 - "modelContract.ts"
Cohesion: 0.15
Nodes (16): ModelSmokeTestScreen(), mockRun, mockUseCaneGuardModel, diseaseCatalog, DiseaseCatalogEntry, DiseaseThemeToken, MODEL_FILENAME, MODEL_INPUT (+8 more)

### Community 22 - "syncErrors.ts"
Cohesion: 0.08
Nodes (32): FIELD_VALIDATION_SYNC_RETRY_COOLDOWN_MS, FieldValidationCompletionSyncResult, ActiveRun, activeRuns, DatabaseRunState, executeBatch(), FieldValidationCompletionSyncBatchResult, syncPendingFieldValidationCompletions() (+24 more)

### Community 23 - "useSaveCompletedScan.test.tsx"
Cohesion: 0.29
Nodes (5): mockDatabase, mockRandomUUID, mockSaveCompletedScan, useSaveCompletedScan(), save()

### Community 24 - "submissionImageStorage.ts"
Cohesion: 0.13
Nodes (31): persistSubmissionImageMetadata(), toPersistenceInput(), getManagedScanImageDirectory(), getSubmissionImageUri(), copyLegacySourceToCanonical(), generateSubmissionDerivative(), getDimensionCandidates(), isCanonicalManagedSourceUri() (+23 more)

### Community 25 - "reportMultipartMapper.contract.test.ts"
Cohesion: 0.15
Nodes (22): CANONICAL, CanonicalCondition, CanonicalContract, CanonicalField, CanonicalScalarRules, expectCanonicalV1(), findCanonicalField(), formFromParts() (+14 more)

### Community 26 - "ActivityScreen.tsx"
Cohesion: 0.07
Nodes (35): BottomNav(), BottomNavProps, NAV_ITEMS, NavItem, NavTab, styles, BrandedScreenHeaderProps, styles (+27 more)

### Community 27 - "schema.ts"
Cohesion: 0.09
Nodes (24): FIELD_REPORT_AUTHORING_STATES, FIELD_REPORT_LOCATION_SOURCES, FieldReportRow, FieldValidationAssignmentRow, fieldValidationAssignments, FieldValidationCompletionRow, fieldValidationCompletions, GPS_CAPTURE_OUTCOMES (+16 more)

### Community 28 - "detection/types.ts"
Cohesion: 0.08
Nodes (35): createCompletedState(), createResult(), MATRIX, MatrixCase, mockDispatch, mockRouterBack, mockRouterPush, mockRouterReplace (+27 more)

### Community 29 - "referenceDataTypes.ts"
Cohesion: 0.14
Nodes (26): ReferenceDataState, NASUGBU_BARANGAYS, SEED_DEFAULT_REGION, SEED_LOCATION_REFERENCE_DATA, fetchLocationReferenceData(), FetchLocationReferenceOptions, LOCATION_REFERENCE_PATH, readJson() (+18 more)

### Community 30 - "readPickerOutcome.ts"
Cohesion: 0.23
Nodes (11): EXTENSION_TO_FORMAT, hasSupportedImageFormat(), ImageFormatEvidence, MIME_TO_FORMAT, normalizeMimeType(), PickerOutcome, readExtension(), readExtensionFormat() (+3 more)

### Community 31 - "fieldValidationCompletionValidation.ts"
Cohesion: 0.06
Nodes (44): FIELD_VALIDATION_GPS_OUTCOMES, FieldValidationGpsOutcome, SyncStatus, readRemoteId(), uploadMobileFieldValidationCompletion(), appendNumber(), FieldValidationCompletionMapperDependencies, GPS_OUTCOMES (+36 more)

### Community 32 - "online-map-picker.tsx"
Cohesion: 0.12
Nodes (33): draft(), mockRefresh, mockSaveManualLocation, clampZoom(), MapControl(), MapOverlay(), OnlineMapPicker(), onMapPress() (+25 more)

### Community 33 - "home.tsx"
Cohesion: 0.10
Nodes (22): HomeScreen(), QuickAction, QuickActionCard(), REFERENCE_CLASSES, ReferenceCard(), ReferenceClass, ReferenceTone, SectionTitle() (+14 more)

### Community 34 - "fieldValidationCompletionRepository.ts"
Cohesion: 0.23
Nodes (19): countUnsyncedFieldValidationCompletions(), createFieldValidationCompletionSyncRepository(), findFieldValidationCompletion(), findFieldValidationCompletionById(), findFieldValidationCompletionSyncCandidates(), findLastSuccessfulFieldValidationCompletionSyncAt(), markFieldValidationCompletionFailed(), markFieldValidationCompletionPending() (+11 more)

### Community 35 - "mobileNotificationsApi.ts"
Cohesion: 0.05
Nodes (65): AppNavigator(), styles, apiBaseUrl, parseApiBaseUrl(), parseConfiguredApiBaseUrl(), parseQaApiBaseUrl(), assertContinuationCheckpoint(), assertUniqueIdentities() (+57 more)

### Community 36 - "Radius"
Cohesion: 0.19
Nodes (10): styles, SymptomChecklistScreen(), styles, SummaryTile(), SummaryTileProps, styles, SymptomChecklistItem(), SymptomChecklistItemProps (+2 more)

### Community 37 - "auth/types.ts"
Cohesion: 0.13
Nodes (20): fetchMock, mockSession, AuthContextValue, AuthActionResponse, AuthStatus, BiometricAuthFailure, BiometricAuthSuccess, BiometricCapability (+12 more)

### Community 38 - "reportReviewTypes.ts"
Cohesion: 0.19
Nodes (12): FIELD_VALIDATION_ASSIGNMENT_STATES, contract, LifecycleContract, AUTHORITY_REVIEW_LABELS, AUTHORITY_REVIEW_STATUSES, AuthorityReviewFeedback, AuthorityReviewSnapshot, AuthorityReviewStatusKind (+4 more)

### Community 39 - "useLocalReport.ts"
Cohesion: 0.18
Nodes (9): buildDateCondition(), buildPendingReportCondition(), createReportRepository(), getLocalReportSummary(), DATABASE, mockGetLocalReportSummary, mockUser, LocalReportInput (+1 more)

### Community 40 - "possibleMatch.ts"
Cohesion: 0.07
Nodes (43): FormValues, mockCaptureLocation, mockFinalize, mockPossibleRecentMatchState, mockReferenceDataRefresh, mockRefresh, mockRetryReport, mockSave (+35 more)

### Community 41 - "analysis-result.tsx"
Cohesion: 0.11
Nodes (25): AnalysisResultScreen(), CONSISTENCY_PRESENTATION, DetailRow(), formatPercentage(), ScoreRow(), SectionCard(), styles, ImagePreviewScreen() (+17 more)

### Community 42 - "useCaneGuardModel.tsx"
Cohesion: 0.15
Nodes (12): mockAsset, mockAssetDownloadAsync, mockLoadTensorflowModel, mockModelRun, ModelStateProbe(), CaneGuardModelContext, CaneGuardModelController, CaneGuardModelProvider() (+4 more)

### Community 43 - "record-details.tsx"
Cohesion: 0.18
Nodes (16): CenteredState(), CONSISTENCY_LABELS, DetailRow(), formatClassLabel(), formatDuration(), formatSavedAt(), getFieldReportAction(), getObservationLabel() (+8 more)

### Community 44 - "mobileFieldValidationAssignmentsApi.ts"
Cohesion: 0.06
Nodes (50): MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE, assertContinuationCheckpoint(), assertUniqueIdentities(), buildInitialPath(), fetchAllMobileFieldValidationAssignments(), isAbortError(), isRecord(), malformed() (+42 more)

### Community 45 - "toStorageError"
Cohesion: 0.17
Nodes (22): toStorageError(), deleteManagedScanImage(), cleanupPreparedImage(), createOrGetFieldReportDraft(), finalizeFieldReport(), findFieldReportByScanRecordId(), hasFieldReportOwnedByAnotherSubmitter(), saveFieldReportDraft() (+14 more)

### Community 46 - "compareParityReference.ts"
Cohesion: 0.36
Nodes (7): compareModelOutputToParity(), compareNumber(), comparePreprocessingToParity(), ModelOutputParityComparison, NumericComparison, PreprocessingParityComparison, PreprocessingResult

### Community 47 - "useAuth"
Cohesion: 0.22
Nodes (16): AuthenticatedHomeRoute(), complete, state, useCaneGuardDatabase(), getStorageErrorMessage(), CompleteFieldValidationInput, useFieldValidationAssignment(), useFieldValidationAssignments() (+8 more)

### Community 48 - "runInference.ts"
Cohesion: 0.20
Nodes (9): asInferenceError(), InferenceError, normalizeScores(), PostprocessedOutput, postprocessOutput(), InferenceRunner, runInference(), softmax() (+1 more)

### Community 49 - "AuthProvider.tsx"
Cohesion: 0.28
Nodes (11): logoutMobile(), AuthProvider(), getAuthErrorMessage(), isAuthoritativeSessionRejection(), isBiometricSessionError(), isNamedError(), isStoredSessionExpiredError(), DEVICE_ID_OPTIONS (+3 more)

### Community 50 - "recordTypes.ts"
Cohesion: 0.15
Nodes (16): ChecklistConsistency, MATRIX, MatrixCase, ModelLabel, ClassScore, ReportedSeverity, ScanSourceType, ImageQualitySourceDimensions (+8 more)

### Community 51 - "use-theme.ts"
Cohesion: 0.11
Nodes (30): styles, styles, styles, ResetParams, styles, hasVerificationParams(), readParam(), styles (+22 more)

### Community 53 - "activity.test.tsx"
Cohesion: 0.14
Nodes (12): ASSIGNMENT, mockAssignmentsState, mockLoadMore, mockNotificationsState, mockRecordsState, mockRefresh, mockRefreshAssignments, mockRefreshNotifications (+4 more)

### Community 54 - "image-preview.test.tsx"
Cohesion: 0.17
Nodes (12): mockDispatch, mockModelRun, mockPreprocessImage, mockRouterPush, mockRouterReplace, mockRunInference, mockUseCaneGuardModel, renderPreview() (+4 more)

### Community 55 - "useAuth.ts"
Cohesion: 0.17
Nodes (9): DETAILS, mockDatabase, mockDeleteScanRecord, mockRefresh, mockRouterPush, mockRouterReplace, mockUseLocalSearchParams, SESSION (+1 more)

### Community 56 - "inferenceErrors.ts"
Cohesion: 0.15
Nodes (8): DetectionError, DetectionErrorStage, getInferenceStage(), InferenceErrorCode, CaneGuardModelContext, CaneGuardModelController, ModelRun, WEB_MODEL_ERROR

### Community 57 - "settings.tsx"
Cohesion: 0.24
Nodes (8): DisabledRow(), DisabledRowProps, SettingsScreen(), styles, ToggleRow(), ToggleRowProps, mockLogout, useThemePreference()

### Community 58 - "submissionImageStorage.test.ts"
Cohesion: 0.12
Nodes (8): joinParts(), MockFile, MockFileEntry, mockFiles, mockManipulateAsync, mockReadManagedImageMetadata, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES, MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES

### Community 59 - "MockFile"
Cohesion: 0.14
Nodes (3): joinParts(), MockDirectory, MockFile

### Community 60 - "ScanRecordListItem"
Cohesion: 0.20
Nodes (8): mockLoadMore, mockRecordsState, mockRefresh, mockRouterPush, mockUsePaginatedScanRecords, RECORD, ScanRecordListItem, PaginatedQueryState

### Community 61 - "assignmentCacheRepository.ts"
Cohesion: 0.14
Nodes (24): FieldValidationAssignmentState, MobileFieldValidationAssignmentsResult, findCachedFieldValidationAssignment(), listCachedFieldValidationAssignments(), markCachedFieldValidationAssignmentCompleted(), markCachedFieldValidationAssignmentInProgress(), replaceCachedFieldValidationAssignments(), requireOwner() (+16 more)

### Community 62 - "biometricAuth.ts"
Cohesion: 0.39
Nodes (7): authenticateWithBiometrics(), getBiometricCapability(), mapAuthenticationFailure(), readSecureStoreBiometricSupport(), SecureStoreBiometricSupport, unavailableCapability(), BiometricAuthResult

### Community 63 - "ActivityScreen"
Cohesion: 0.25
Nodes (6): ActivityScreen(), formatActivityCount(), getEmptyMessage(), getEmptyTitle(), matchesSearch(), openNotification()

### Community 64 - "model-debug.test.tsx"
Cohesion: 0.33
Nodes (5): ModelDebugRoute(), mockModelRun, mockPreprocessImage, mockRunInference, mockUseCaneGuardModel

### Community 65 - "activityTypes.ts"
Cohesion: 0.32
Nodes (6): ACTIVITY_FILTERS, ActivityFilter, ActivityFilterOption, ActivityItemKind, CurrentActivityFilter, getActivityItemKind()

### Community 66 - "listScanRecords"
Cohesion: 0.29
Nodes (5): buildConditions(), buildFieldReportJoinCondition(), listScanRecords(), mockDatabase, mockListScanRecords

### Community 67 - "reportMultipartMapper.test.ts"
Cohesion: 0.33
Nodes (4): map(), REPORT, SCAN, TestFormData

## Knowledge Gaps
- **447 isolated node(s):** `mockRefresh`, `mockLoadMore`, `mockRecordsState`, `mockRefreshAssignments`, `mockAssignmentsState` (+442 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `mobileAuthApi.ts`, `home.tsx`, `online-map-picker.tsx`, `Radius`, `StorageError`, `theme.ts`, `model-debug.tsx`, `analysis-result.tsx`, `record-details.tsx`, `field-report.tsx`, `use-theme.ts`, `settings.tsx`, `ActivityScreen.tsx`, `ActivityScreen`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `toStorageError()` connect `toStorageError` to `fieldValidationCompletionRepository.ts`, `mobileNotificationsApi.ts`, `listScanRecords`, `StorageError`, `mobileReportStatusesApi.ts`, `useLocalReport.ts`, `possibleMatch.ts`, `scanRecordRepository.ts`, `record-details.tsx`, `field-report.tsx`, `useAuth`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `useSaveCompletedScan.test.tsx`, `submissionImageStorage.ts`, `assignmentCacheRepository.ts`, `fieldValidationCompletionValidation.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `StorageError` connect `StorageError` to `fieldValidationCompletionRepository.ts`, `mobileNotificationsApi.ts`, `mobileReportStatusesApi.ts`, `scanRecordRepository.ts`, `toStorageError`, `recordValidation.ts`, `useAuth`, `fieldReportValidation.ts`, `fieldReportSyncRepository.ts`, `scanImageStorage.ts`, `useSaveCompletedScan.test.tsx`, `submissionImageStorage.ts`, `submissionImageStorage.test.ts`, `detection/types.ts`, `assignmentCacheRepository.ts`, `fieldValidationCompletionValidation.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `mockRefresh`, `mockLoadMore`, `mockRecordsState` to the rest of the system?**
  _447 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mobileAuthApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09795918367346938 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
- **Should `mobileReportStatusesApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08245981830887492 - nodes in this community are weakly interconnected._