# 06 — Acceptance Criteria

The enhancement is complete only when all applicable items pass.

## Scope and class alignment

- [ ] UI-supported class references are exactly Healthy, Mosaic, Rust.
- [ ] No Home/education surface presents Downy Mildew or Smut as supported classes.
- [ ] `MODEL_LABELS` is unchanged by this UI enhancement.
- [ ] Result screens still treat AI as decision support rather than confirmed diagnosis.

## Real asset policy

- [ ] Healthy reference uses a real licensed photo.
- [ ] Mosaic reference uses a real licensed photo.
- [ ] Rust reference uses a real licensed photo.
- [ ] All three assets are local bundled files.
- [ ] All three have completed license/source manifest entries.
- [ ] No AI-generated disease reference image ships in the app.
- [ ] No runtime remote-image URL is introduced.

## Decorative visual cleanup

- [ ] Home no longer needs a decorative sugarcane hero illustration.
- [ ] Scan empty state uses standard UI/icon treatment, not an AI-looking illustration.
- [ ] Sync state uses icon/text/status, not decorative artwork.
- [ ] Decorative leaf corner/ornament does not appear in the normal scan/checklist flow.
- [ ] No new decorative illustration library is added.

## Branding

- [ ] Current CaneGuard mark remains the source brand.
- [ ] Launcher icon is visually centered and cropped safely.
- [ ] Android adaptive foreground survives circular/squircle masks.
- [ ] Monochrome icon is legible in themed icon mode.
- [ ] Splash uses normalized CaneGuard brand treatment.
- [ ] No obsolete blue splash/adaptive treatment remains unless explicitly justified.

## UX hierarchy

### Home
- [ ] Start Scan is the most prominent action.
- [ ] Duplicate sync calls-to-action are removed/consolidated.
- [ ] Three-class reference section is clearly labeled as education/reference.

### Scan
- [ ] Capture and gallery actions are obvious.
- [ ] Photo guidance is short and actionable.
- [ ] Permission/error states still work.

### Preview
- [ ] User image is dominant.
- [ ] Analyze is the clear primary CTA.
- [ ] Technical preprocessing copy is not dominant in normal UX.

### Symptoms
- [ ] Observation selection behavior is unchanged.
- [ ] Severity remains explicitly user-reported/optional.
- [ ] Checklist does not alter model scores.

### Result
- [ ] Result label and confidence can be understood quickly.
- [ ] Image-quality warnings remain distinct from model confidence.
- [ ] Checklist consistency remains visible but secondary.
- [ ] Raw class scores/diagnostics are lower priority.
- [ ] User scan image is used; no stock/reference disease photo impersonates a result.

### Records / Reports / Field Report
- [ ] Core data and actions remain intact.
- [ ] Sync states remain accurate.
- [ ] Offline behavior remains functional.
- [ ] Technical metadata no longer dominates operational content.

### Settings
- [ ] Navigation affordances use Feather icons consistently.
- [ ] Unimplemented settings do not masquerade as completed features.

## Accessibility

- [ ] Touch targets remain at least practical mobile size.
- [ ] Existing accessibility labels are preserved or improved.
- [ ] Text remains readable in light and dark themes.
- [ ] Color is not the only signal for result/status.
- [ ] Reference photos have useful accessibility labels.
- [ ] Dynamic/error messages retain appropriate live-region behavior.

## Regression verification

- [ ] Type check passes.
- [ ] Lint passes.
- [ ] Existing unit/integration tests pass or pre-existing failures are documented.
- [ ] Maestro critical-path flows pass.
- [ ] Home → Scan → Preview → Analyze → Symptoms → Result works.
- [ ] Save record → Records → Record Details works.
- [ ] Field Report draft/finalize/sync flow works.
- [ ] Offline pending-sync behavior works.
- [ ] Light and dark theme screenshots reviewed.
- [ ] App icon/splash tested in a development/release build as required by native asset changes.
