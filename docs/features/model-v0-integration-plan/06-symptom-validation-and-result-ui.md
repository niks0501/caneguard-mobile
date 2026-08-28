# Phase 6 — Symptom Validation and Dynamic Result UI

## Objective

Connect real model output to a truthful result screen and align the symptom checklist with the three Model v0 classes.

## Primary Owners

- **Product Owner:** approves the displayed meaning of results.
- **Business Analyst:** ensures result wording supports farmer decision-making.
- **System Analyst:** defines the relationship between AI output and symptom observations.
- **UI/UX Designer:** creates clear result hierarchy and inconsistency warnings.
- **Software Developers:** implement checklist logic and dynamic rendering.
- **QA Engineer:** tests state combinations and prevents misleading output.

## Product Rule

The AI score and the symptom checklist are separate evidence sources.

Do not:

- add checklist points to model confidence;
- average user responses with AI scores;
- call reported severity an AI severity estimate;
- state that the disease is confirmed.

The checklist may only produce a **consistency status**.

## Guided Differential Checklist

Replace the generic checklist with a short data-driven visible-pattern question.

The current Model v0 set contains three distinguishing observations plus neutral escape options:

```text
Contrasting islands or streaks of normal green among paler green or yellowish leaf areas
Raised rust-colored or orange-brown spots or pustules, mainly on the leaf underside
Bright yellow midrib on lower or older leaves, or yellowing spreading outward from the midrib
No visible symptom from Mosaic or Rust
Something else
Unable to tell
```

The question is neutral and does not mention the predicted class.

The current implementation selects this set from the approved Model v0 context and keeps the option definitions separate from model scores.

The pattern descriptions are observation guidance rather than diagnostic claims and require agricultural stakeholder validation before wider clinical use.

The wording must be understandable to non-technical users.

A future validated Filipino translation may be added separately.

The option wording is derived from UF/IFAS EDIS SC009, UF/IFAS EDIS PI207, UF/IFAS EDIS SC099, UF/IFAS EDIS SS-AGR-256, and the APS Plant Health Progress sugarcane disease profile.

## Consistency Logic

Recommended status values:

```ts
type ChecklistConsistency =
  | 'consistent'
  | 'inconsistent'
  | 'not-applicable'
  | 'not-enough-information';
```

Example rules:

| Model Output | Checklist | Status |
|---|---|---|
| Mosaic | Mosaic symptom selected | Consistent |
| Rust | Rust symptom selected | Consistent |
| Healthy | No supported symptom selected | Consistent |
| Mosaic | Only rust symptom selected | Inconsistent |
| Rust | Only mosaic symptom selected | Inconsistent |
| Healthy | Disease symptom selected | Inconsistent |
| Any | Yellow midrib or Something else | Inconsistent |
| Any | Unable to tell | Not enough information |
| Any | No response | Not enough information |

Do not use checklist consistency to alter raw scores.

## Severity Treatment

The normal scan flow no longer asks for Mild, Moderate, or Severe.

Existing reported severity values remain readable in historical saved-record details and are not destructively removed.

New guided observations must not be described as model-estimated severity because the model is a classifier, not a severity estimator.

## Result Screen Information Architecture

Display in this order:

1. selected image;
2. possible Model v0 result;
3. model confidence;
4. all three class scores;
5. checklist consistency;
6. reported severity, when provided;
7. image-quality warnings, when available;
8. model version and processing time;
9. decision-support disclaimer;
10. New Scan action.

For a healthy top prediction, display:

```text
No supported disease detected
```

Do not label healthy as a disease.

## Dynamic Disease Metadata

Create:

```text
src/features/detection/constants/diseaseCatalog.ts
```

Each supported class should define:

```ts
{
  label,
  displayName,
  shortDescription,
  resultMessage,
  icon,
  themeToken,
}
```

Do not duplicate disease names and styling across screens.

## Route Behavior

The result screen must read from `ScanSessionState`.

It must not:

- read a hardcoded disease;
- read hardcoded confidence;
- rely on symptoms passed as URL strings;
- render a result when inference is incomplete.

When the result route opens without a completed scan:

- redirect to scan; or
- show a no-result state with a return action.

## UI States

Design for:

- healthy result;
- mosaic result;
- rust result;
- checklist consistent;
- checklist inconsistent;
- insufficient checklist information;
- missing result;
- very low top score;
- New Scan reset.

A low score may be shown as a caution, but do not invent a scientifically validated threshold without model calibration. Any threshold used for presentation must be labeled as a prototype rule.

## Recommended Result Wording

```text
Possible result: Mosaic

The model assigned its highest score to Mosaic based on the submitted image.

AI confidence: 78%

Checklist: The selected symptoms are consistent with the model result.

This output is for decision support only. Retake the image or consult an agricultural expert when the result is unclear or symptoms do not match.
```

## QA State Matrix

Test every model class against every checklist status.

At minimum:

```text
3 model classes × 4 consistency states = 12 result combinations
```

Also test:

- missing image;
- missing result;
- no symptoms;
- New Scan;
- back navigation;
- replacing image after a result;
- long disease descriptions;
- small device screen;
- dark mode, when supported.

## Non-Goals

This phase does not:

- provide treatment recommendations unless already validated;
- submit reports to a backend;
- estimate economic impact;
- confirm disease;
- add unsupported diseases.

## Suggested Commit

```text
feat(results): connect checklist and dynamic analysis result
```

## Rollback Safety

Keep consistency logic separate from inference. Reverting this phase must not remove the working image and model pipeline.

## Exit Criteria

- Result screen uses actual scan-session prediction.
- No hardcoded disease or confidence remains.
- Checklist includes only Model v0-aligned observations.
- Raw AI confidence remains unchanged by checklist answers.
- Reported severity is clearly user-provided.
- All result combinations render without crashing.
- New Scan clears image, prediction, and checklist.
