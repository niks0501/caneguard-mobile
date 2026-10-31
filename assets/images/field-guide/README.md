# Field guide photo drop

This is the interim drop location for field guide photos, used until the office
authoring page exists. The final steady state is an office upload in the web app
that the phone downloads into app storage. Nothing here is wired into the app
automatically: a photo becomes visible when the app is built with it, which is
what the office booklet edit will do.

The three photos the app already ships stay exactly where they are
(`assets/images/sugarcane-diseases/reference_healthy.jpg`,
`reference_mosaic.jpg`, `reference_rust.jpg`). Do not move or copy them here.

## Folders

One folder per entry, named after the entry id:

```
healthy/   mosaic/   rust/   smut/   rssi/   _incoming/
```

Put anything you have not sorted yet in `_incoming/`.

## File names

`<NN>-<subject>.jpg` — a two-digit order, then a short lowercase hyphenated
subject. The order is the order the photos appear on the entry page, so `01-` is
the one a learner sees first.

Examples:

```
healthy/01-stool.jpg               healthy/02-leaf-green.jpg
mosaic/01-leaf-mottle.jpg          mosaic/02-leaf-mottle-close.jpg
rust/01-leaf-underside.jpg         rust/02-pustules-close.jpg
smut/01-whip.jpg                   smut/02-whip-close.jpg
rssi/01-lower-leaf-colony.jpg      rssi/02-sooty-mold.jpg
```

**Cap: 3 photos per entry.** Two is the working target; three is the hard limit.

## Format

JPEG, long edge about 1200 px, quality about 80 — the 100–300 KB band the three
existing photos already sit in. These become mobile data a farmer spends, so the
size matters.

What makes a usable photo:

- The symptom fills a good part of the frame.
- It is sharp enough to see the feature being described.
- The light is even.
- No watermark, no text overlay, no date stamp.
- Do not over-zoom: a crop so tight that the cue becomes misleading is worse
  than a wider shot.

Keep the full-size originals in the office's own storage for the booklet and for
re-crops. Downscale only what ships.

## Manifest

Add one row per dropped photo to `MANIFEST.csv`. Leave `status` and
`review_status` empty until a person has actually reviewed the file; those
columns are the drop's own record, not app copy.

Fill `source_page`, `source_image_id_or_url`, `author_or_org`, `license_name`,
`license_evidence` and `attribution_text` as soon as the evidence exists. Do
not guess any of them. The app reads a photo's credit from the typed entry data
(`src/features/field-guide/constants/fieldGuideEntries.ts`), not from this CSV,
and today every photo is marked as credit-not-recorded because no licence
evidence has been supplied. When a credit is confirmed, copy the creator,
licence and original page into that photo's `credit` record and set
`recorded: true`.

The app now shows photo credits and sources in a read-only "Sources and photo
credits" disclosure on the entry page and in the full guide, so credited
photos no longer rely on the store listing alone. Keep the banned-word rule for
**reading copy** — signs, summaries, prevention and management text must never
carry licence, provenance or manifest wording. Credit labels are drawn from
`src/constants/copy.ts` and are the only place that wording belongs.

A dropped photo reaches a phone only when `FIELD_GUIDE_DROP_PHOTOS` in
`src/features/field-guide/constants/fieldGuideEntries.ts` requires that exact
file and its `assetKey` matches the row's `local_filename`. A file left in a
folder without both stays out of the build.
