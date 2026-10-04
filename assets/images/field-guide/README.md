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

Add one row per dropped photo to `MANIFEST.csv`. Leave `status` empty; do not
write `pending` or licence wording, because those words are banned from the
app's user-facing copy by a build guard. If a licence requires a credit, record
it in `attribution_text` and say where the credit should appear — until told
otherwise the app puts required credits in the store listing only.
