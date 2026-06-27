# CaneGuard Design System

Use this guide when creating or editing UI in `caneguard-mobile`.

## Direction

CaneGuard should feel modern, minimalist, clean, and field-ready. It should look polished for a capstone presentation while staying simple enough for farmers, inspectors, and agricultural personnel.

The visual identity is based on the original `capstone_prototype`:

- Deep muted green brand color
- Soft cream/gold accent
- White and pale green surfaces
- Rounded cards and buttons
- Light shadows
- Clear disease badges
- Simple layouts with strong spacing

## Token source

All reusable UI values live in:

```text
src/constants/theme.ts
```

Use these exports before adding custom values:

```ts
import { Colors, ComponentTokens, DiseaseTokens, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
```

Prefer tokens over hard-coded colors, spacing, border radius, and font sizes.

## Colors

Use `Colors` semantically:

- `primary`, `primaryDark`, `primaryLight` for brand actions
- `accent`, `accentDark` for warm emphasis
- `background`, `surface`, `surfaceElevated`, `surfaceMuted` for layout surfaces
- `text`, `textSecondary` for text hierarchy
- `border`, `divider` for separation
- `success`, `warning`, `danger`, `info` for states

Use `DiseaseTokens` for disease-related UI only:

- `healthy`
- `downyMildew`
- `smut`
- `mosaic`
- `rust`
- `unclear`

## Spacing and layout

Use `Spacing` and `ComponentTokens` for layouts.

Recommended screen rhythm:

- Screen horizontal padding: `ComponentTokens.screen.horizontalPadding`
- Section gap: `ComponentTokens.screen.sectionGap`
- Card padding: `ComponentTokens.card.padding`
- Small gaps: `Spacing.sm` or `Spacing.md`
- Main gaps: `Spacing.lg`, `Spacing.xl`, or `Spacing['2xl']`

Keep mobile screens breathable. Use one primary action per screen when possible.

## Typography

Use `Typography` for reusable components.

Recommended hierarchy:

- Page title: `Typography.title`
- Section title: `Typography.subheading`
- Card heading: `Typography.body` or `Typography.subheading`
- Body text: `Typography.body` or `Typography.bodySmall`
- Metadata and helper text: `Typography.caption` or `Typography.label`

Use clear wording. Prefer terms like `Possible disease`, `Confidence`, `Symptom checklist`, `Save report`, and `Pending sync`.

## Radius and shadows

- Cards: `Radius.lg`
- Inputs: `Radius.sm`
- Buttons: `Radius.lg`
- Chips and badges: `Radius.full`
- Hero panels: `Radius.xl` or `Radius['2xl']`

Use `Shadows.sm` for normal cards and `Shadows.md` only for stronger emphasis.

## Component patterns

### Buttons

Primary buttons use the brand green, white text, `ComponentTokens.button.height`, and `ComponentTokens.button.borderRadius`.

Use primary buttons for main actions such as `Scan Sugarcane`, `Continue`, `View Result`, `Save Report`, and `Submit Report`.

Use secondary or ghost buttons for supporting actions such as `Back`, `Retake Photo`, `View Library`, and `Cancel`.

### Cards

Cards use `surface` or `surfaceElevated`, a subtle `border`, `ComponentTokens.card.padding`, `ComponentTokens.card.borderRadius`, and optional `Shadows.sm`.

Each card should have one clear purpose.

### Inputs

Inputs use `surfaceElevated` or `background`, `border`, `ComponentTokens.input.borderRadius`, and `ComponentTokens.input.minHeight`.

Use short labels such as `Barangay`, `Farm area`, `Notes`, `Severity`, and `Plant part`.

### Chips and badges

Use chips for disease labels, sync status, severity, confidence category, and offline or online state. Always pair color with text.

## Scan and result screens

Scan screens should keep the captured image visually dominant. Result screens should use careful wording:

- Use `Possible disease`, not `Diagnosis`
- Use `Confidence`, not `Accuracy`
- Use `Submitted cases`, not `affected plants`
- Use `Pending sync`, not `Failed upload`, unless a real sync attempt failed

Always show this reminder near AI results:

```text
This result is for decision support only and should not replace expert validation.
```

## Naming conventions

Suggested component names:

```text
AppButton
AppCard
DiseaseBadge
ConfidenceBar
ReportCard
SymptomChecklistItem
ScreenHeader
```

Suggested screen names:

```text
HomeScreen
ScanScreen
ImagePreviewScreen
SymptomChecklistScreen
AnalysisResultScreen
AdvisoryScreen
ReportFormScreen
ReportHistoryScreen
DiseaseLibraryScreen
```

## Mobile-first rules

Design for Android first while keeping React Native components cross-platform-ready.

- Use touch targets around 44 to 52px high.
- Keep long text readable.
- Avoid dense mobile tables.
- Prefer cards, lists, and summaries.
- Add accessible labels to icon-only buttons.
