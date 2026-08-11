# Shared Contract for All Phases

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


> This file is mandatory context for every phase. It contains the product boundaries, architecture, users, user stories, future direction, and coding-agent guardrails that must not be weakened by an individual phase.

## Cross-phase engineering rules

1. Drizzle is the typed database-access layer; Expo SQLite remains the local database engine.
2. Route components must use hooks and application services. They must not import Drizzle tables or execute persistence queries directly.
3. Images belong in Expo FileSystem-managed app storage. SQLite stores their URI and metadata, not image bytes or Base64.
4. The initial feature works fully offline and creates records as `local_only`.
5. No interface may claim MAO submission, synchronization, approval, expert verification, or confirmed diagnosis.
6. The current model's output remains independent from user symptoms and reported severity.
7. Stable UUIDs prepare records for future synchronization but do not initiate network activity.
8. Production migration failure must never trigger an automatic destructive database reset.
9. Every schema change requires a reviewed and committed migration.
10. Each phase must leave the existing model flow working.

---

## 1. Purpose

This document defines the product, functional, data, architectural, quality, testing, and delivery requirements for adding durable offline storage to the CaneGuard Android application.

The feature shall convert the current scan flow from an in-memory prototype into an offline-first application workflow. A completed AI analysis must be saved on the device, remain available after the application closes, appear in the Records screen, and contribute to actual report summaries. The feature must also prepare the local data model for a future authenticated synchronization service without implementing that service prematurely.

This document is intended to serve as the implementation contract for the development branch. It should be reviewed before coding begins and updated only when the team deliberately changes scope or architecture.

---

## 2. Product Context

CaneGuard already supports the following working flow:

```text
Select or capture image
→ Preview image
→ Preprocess image
→ Run on-device TensorFlow Lite inference
→ Complete symptom checklist
→ View the analysis result
```

The current AI result includes a predicted class, confidence score, class scores, model version, processing timings, image-quality observations, selected symptoms, reported severity, and checklist consistency. However, this result currently exists only in the active React scan session.

The Records and Reports screens still contain demonstration data. They do not reflect scans performed by the user. The login and registration interfaces also do not yet provide real authentication, and there is no backend or synchronization service.

The persistence feature must therefore complete the local workflow first:

```text
Complete scan
→ Save record and managed image locally
→ View saved record
→ Search and filter records
→ Calculate reports from actual records
→ Preserve sync-ready metadata for a future backend
```

The application must remain useful without internet connectivity. This aligns with field conditions in which mobile signal and internet affordability may limit continuous online access. Local persistence is therefore a core product capability rather than a temporary cache.

---

## 3. Architecture Decision

### 3.1 Selected stack

The feature shall use the following technologies:

| Concern | Selected technology | Responsibility |
|---|---|---|
| Local relational database | `expo-sqlite` | Persistent on-device SQLite database |
| Typed database access | `drizzle-orm` | Type-safe schema definitions and queries |
| Migration generation | `drizzle-kit` | Generate version-controlled SQL migrations |
| Migration bundling | Drizzle Expo migrator and required Metro/Babel support | Bundle and apply SQL migrations at runtime |
| Persistent image storage | `expo-file-system` | Copy scan images into an application-controlled directory |
| Local record identifiers | `expo-crypto` | Generate UUIDv4 identifiers |
| Small UI preferences | Existing AsyncStorage | Theme, onboarding, and temporary key-value state only |
| Application data access | Repository and feature hooks | Prevent direct database access from screens |

### 3.2 Architectural boundaries

Drizzle is the typed access layer, while Expo SQLite remains the database engine. React screens shall not import database tables or execute database queries directly.

The required dependency direction is:

```text
Screens and UI components
        ↓
Feature hooks and application services
        ↓
Repositories
        ↓
Drizzle ORM
        ↓
Expo SQLite
```

Image files are not database records. They shall be managed through a separate storage service:

```text
Scan result
   ├── Structured metadata → Drizzle → SQLite
   └── Image file → Expo FileSystem → managed app directory
```

### 3.3 Package compatibility rule

Expo-managed packages shall be installed through `npx expo install` so that the versions match the repository's Expo SDK.

Drizzle packages and migration tooling shall be pinned to versions validated against the repository's current Expo SDK, React Native version, Metro configuration, and EAS build. The team shall not adopt `@next`, release-candidate, or arbitrary latest versions without a compatibility spike and a successful Android development build.

Generated migration files and migration snapshots shall be committed to Git.

---

## 4. Goals

The feature has the following goals:

1. Persist completed scan results across application restarts.
2. Store the exact image used for analysis in application-controlled storage.
3. Replace mock Records data with actual saved scans.
4. Replace hardcoded Reports data with aggregate database queries.
5. Preserve the current on-device AI and symptom-validation workflow.
6. Provide a typed and migration-safe local data layer.
7. Prepare local records for future Laravel, Firebase, or another backend without selecting that backend in this branch.
8. Prevent duplicate records, partial database writes, and orphaned image files where reasonably possible.
9. Keep the feature usable without authentication or internet connectivity.
10. Establish testing, error handling, and operational standards appropriate for a production-oriented mobile feature.

---

## 5. Non-Goals

The following items are explicitly outside the scope of this feature branch:

- Real login or registration
- Firebase Authentication
- Laravel authentication
- Backend API development
- Uploading records or images
- Actual synchronization with the MAO dashboard
- MAO review or approval states
- Push notifications
- Multi-device synchronization
- Conflict resolution between devices
- Cloud backups
- SQLCipher database encryption
- User-password storage
- Full farm-management functionality
- Model retraining or replacement
- Expansion of Model v0 disease classes
- Automatic GPS collection
- Exact disease occurrence or affected-plant counting
- Destructive production database reset controls

Future-ready fields may be included where they have low implementation cost, but no interface may falsely imply that an excluded capability already works.

---

## 6. Users and Stakeholders

### 6.1 Primary mobile user

The primary user is a farmer, field inspector, researcher, or authorized field worker who captures a sugarcane image, reviews the AI-supported result, records visible symptoms, and saves the observation for later reference.

### 6.2 Future data consumer

The Municipal Agriculture Office, Sugar Regulatory Administration personnel, or cooperative staff may eventually receive synchronized summaries. This branch shall not claim that local records have been sent, received, verified, or reviewed by these parties.

### 6.3 Development stakeholders

The development team needs a storage layer that is understandable, testable, type-safe, and extendable when authentication, synchronization, and a web dashboard are introduced.

---

## 7. Core User Stories

### US-01 — Save a completed scan

As a field user, I want to save a completed CaneGuard analysis so that I can review it later even when I have no internet connection.

### US-02 — Review saved records

As a field user, I want to view a chronological list of saved analyses so that I can track my previous field observations.

### US-03 — Search and filter records

As a field user, I want to search and filter my records by disease result, barangay, and date so that I can locate a specific observation quickly.

### US-04 — View record details

As a field user, I want to reopen the full details of a saved record, including its image, AI result, symptoms, severity, warnings, and model information.

### US-05 — View real summaries

As a field user, I want the Reports screen to summarize my actual saved records rather than demonstration values.

### US-06 — Delete a record

As a field user, I want to delete an incorrect or unwanted local record, including its managed image, after confirming the action.

### US-07 — Recover from interruption

As a field user, I want CaneGuard to avoid corrupting or duplicating records when saving is interrupted, the app is closed, or an operation fails.

### US-08 — Prepare for later synchronization

As a development team, we want local records to have stable identifiers and synchronization metadata so that a future backend can be added without replacing the local storage design.

---

## 25. Future Enhancements Enabled by This Design

Once the local persistence feature is stable, the architecture can support:

- real authentication
- farmer or inspector profiles
- controlled barangay and farm records
- Laravel or Firebase synchronization
- offline outbox and retry worker
- conflict handling
- MAO web dashboard
- synchronized advisories
- multiple model versions
- model-specific label catalogs
- downloadable reports
- data export with informed consent
- record backup and restoration
- locally encrypted database
- retention policies
- audit history
- expert review states

These enhancements require separate requirements and branches. Their future possibility does not expand the acceptance scope of this document.

---

## 26. Implementation Guardrails for Coding Agents

A coding agent working from this document shall follow these constraints:

1. Do not implement authentication or network synchronization.
2. Do not replace Drizzle with another ORM without approval.
3. Do not call the database directly from route components.
4. Do not store images in SQLite.
5. Do not store percentages as formatted strings.
6. Do not rename AI predictions as confirmed diagnoses.
7. Do not invent barangay data or silently save hardcoded locations.
8. Do not present Smut or Downy Mildew as Model v0 outputs.
9. Do not delete the production database automatically after migration failure.
10. Do not edit generated migration SQL casually.
11. Do not introduce mock records into production paths.
12. Do not claim device validation unless it was performed.
13. Preserve the existing model contract, image preprocessing, and inference flow.
14. Run the full targeted verification suite after Metro, Babel, or package changes.
15. Stop and report any migration, model-asset, or native-build incompatibility before continuing into UI integration.

---

## 28. Final Technical Direction

The approved local persistence architecture is:

```text
Expo React Native application
        ↓
Feature hooks and services
        ↓
Records and report repositories
        ↓
Drizzle ORM
        ↓
Expo SQLite persistent database

Completed scan image
        ↓
Expo FileSystem managed documents directory

Record identity
        ↓
Expo Crypto UUIDv4
```

This architecture provides CaneGuard with a realistic offline-first foundation. It improves maintainability through typed schemas and migrations, preserves SQL-level control, and prepares the application for future synchronization without making the current feature dependent on an undecided backend.
