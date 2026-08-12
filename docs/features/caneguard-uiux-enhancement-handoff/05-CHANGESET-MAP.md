# 05 — Expected Changeset Map

This is a likely changeset map. The implementing agent should inspect actual dependencies before editing or deleting files.

## High-priority app screens

- `src/app/home.tsx`
  - remove unsupported disease gallery entries
  - remove hero/offline decorative art
  - simplify task hierarchy
  - bind approved reference photos

- `src/app/scan.tsx`
  - remove decorative empty state and leaf corner
  - simplify capture/gallery hierarchy

- `src/app/image-preview.tsx`
  - demote technical model/preprocessing copy
  - keep actual selected image dominant

- `src/app/symptom-checklist.tsx`
  - remove ornament
  - simplify hierarchy

- `src/app/analysis-result.tsx`
  - reorganize result hierarchy
  - demote all-scores/technical details
  - preserve current logic and decision-support framing

- `src/app/records.tsx`
  - reduce pre-list clutter
  - compact sync/persistence messaging

- `src/app/record-details.tsx`
  - progressive disclosure/grouping for technical data

- `src/app/reports.tsx`
  - simplify card density while retaining current report data

- `src/app/field-report.tsx`
  - streamline form/status grouping without changing report domain behavior

- `src/app/settings.tsx`
  - consistent Feather chevrons and unfinished-feature treatment

## Shared UI likely affected

- `src/components/ui/BottomNav.tsx`
- `src/components/ui/BrandedScreenHeader.tsx`
- `src/components/ui/ScreenHeader.tsx`
- `src/components/ui/AppButton.tsx`
- `src/components/ui/RecordCard.tsx`
- `src/components/ui/SyncStatusPanel.tsx`
- `src/components/ui/SymptomChecklistItem.tsx`
- `src/components/ui/SummaryTile.tsx`
- any new small “SectionHeader”, “StatusRow”, or “TechnicalDetails” primitive, if it genuinely reduces duplication

Do not create a large new design system framework. Reuse the existing tokens/components.

## Theme/config

- `src/constants/theme.ts`
  - only small token normalization if required; preserve current green/neutral system

- `app.json`
  - icon/splash references/backgrounds after branding exports are ready

## Asset targets

Add:
- `assets/images/sugarcane-diseases/reference_healthy.jpg`
- `assets/images/sugarcane-diseases/reference_mosaic.jpg`
- `assets/images/sugarcane-diseases/reference_rust.jpg`

Potentially update:
- `assets/images/icon.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-background.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/splash-icon.png`

Potentially retire after dependency proof:
- `assets/images/sugarcane-diseases/sugarcane_downey_mildew.jpg`
- `assets/images/sugarcane-diseases/sugarcane_smut.jpg`
- `assets/svg/sugarcane-hero.svg`
- `assets/svg/offline-sync.svg`
- `assets/svg/scan-empty-state.svg`
- `assets/svg/gold-leaf-corner.svg`
- `assets/svg/header-botanical-wave.svg`

## Model files — DO NOT CHANGE for this enhancement

Do not alter:
- TFLite model
- model labels
- preprocessing
- inference behavior
- confidence calculation
- checklist consistency logic

unless a separate model change is explicitly approved.

This is a UI/UX and asset-alignment enhancement, not a model retraining/migration.
