# CaneGuard brand masters

This directory contains the captain-delivered SVG masters and the derived dark colourway used by the mobile app.
The SVGs are design masters; app-consumed raster exports remain under `assets/`.

## Provenance

- Author: **TODO — captain to provide**
- Licence: **TODO — captain to provide**
- Original creation/delivery date: **TODO — captain to provide**

## Palette

| Role | On-light | On-dark |
| --- | --- | --- |
| Structural green | `#074424` | `#91B79A` |
| Green | `#3E7C30` | `#3E7C30` |
| Lime | `#81A92A` | `#81A92A` |
| Gold | `#BB941D` | `#E2A15F` |
| Cream | `#F0E4B8` | `#F0E4B8` |
| Dark field | — | `#101711` |

The on-dark variant changes only the structural green and gold. All exports are sRGB.

## Geometry and clear space

- The lockup master is a 1000×1000 SVG. Artwork bounds are `38 18 920 939`.
- The mark is paths 1–5 with bounds `177 18 646 736`; the wordmark is paths 6–7.
- Derived exports crop the artwork, centre it, and preserve the source proportions. The launcher mark is 650 px tall in
  the 1024 px opaque icon, and the adaptive mark is 199 px tall in the 432 px layers.
- Keep at least one mark-height of clear space around the full lockup. Use the simplified favicon mark at small sizes;
  icon-only artwork should not be used below 24–32 px.

## Export map

- `assets/images/icon.png`: 1024×1024 opaque dark-field launcher/iOS icon.
- `assets/images/android-icon-foreground.png`: 432×432 transparent on-dark adaptive foreground.
- `assets/images/android-icon-background.png`: 432×432 opaque `#101711` adaptive background.
- `assets/images/android-icon-monochrome.png`: 432×432 transparent white silhouette.
- `assets/images/splash-icon.png`: 1024×1024 transparent on-dark stacked lockup.
- `assets/images/favicon.png`: 196×196 transparent on-light simplified mark.
- `assets/cane_guard_logo.png`: 829×829 transparent on-light in-app mark.
- `assets/cane_guard_logo_onDark.png`: 829×829 transparent on-dark in-app mark.
- `assets/cane_guard_wordmark.png`: 1024×256 transparent wordmark export.
