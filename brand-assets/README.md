# traast brand assets

Logo files generated from the wordmark in `index.html` (`.wordmark` — Inter
ExtraBold, `letter-spacing: -0.02em`, navy text with a cyan dot). The text is
converted to vector outlines, so nothing depends on Inter being installed.

Colours, taken from `:root` in `index.html`:

| Token | Hex | Use |
| --- | --- | --- |
| navy | `#0D1B2A` | wordmark, dark backgrounds |
| cyan | `#06B6D4` | the dot, accents |
| bg | `#F9FAFB` | light backgrounds |

Every asset ships as both `.svg` (vector, for print / resizing) and `.png`
(what Facebook and Ads Manager want). PNGs of the transparent logo files have
no background; all social sizes are flattened onto navy or light grey.

## Facebook / Instagram profile picture

Meta crops profile pictures to a **circle** and shows them as small as 32px, so
the primary avatar is the `t.` monogram rather than the full wordmark.

| File | Size | When to use |
| --- | --- | --- |
| `social/facebook-profile-1080.png` | 1080×1080 | **Recommended.** `t.` monogram, white on navy. Reads at every size. |
| `social/facebook-profile-wordmark-1080.png` | 1080×1080 | Full `traast.` wordmark on navy — fine on desktop, gets tight on mobile. |
| `social/facebook-profile-light-1080.png` | 1080×1080 | Monogram on white, for placements sitting on dark chrome. |

Upload the 1080×1080 file; Facebook downsamples it. The minimum it accepts is
320×320, and everything in these files sits inside the circle's safe area.

## Facebook Page cover

| File | Size | Notes |
| --- | --- | --- |
| `social/facebook-cover-1640x856.png` | 1640×856 | Desktop size. Mobile crops to roughly the middle 640px of the width, so the lockup is centred and stays inside that crop. |

## Meta ad placements

Both a navy and a light (`meta-light-`) version of each:

| File | Size | Placement |
| --- | --- | --- |
| `social/meta-ad-1x1-1080x1080.png` | 1080×1080 | Feed, square — the safe default |
| `social/meta-ad-4x5-1080x1350.png` | 1080×1350 | Feed, vertical — most screen space in the mobile feed |
| `social/meta-ad-1.91x1-1200x628.png` | 1200×628 | Link ads, right column, Audience Network |
| `social/meta-story-9x16-1080x1920.png` | 1080×1920 | Stories and Reels |

For Stories and Reels, keep headlines and CTAs out of the top and bottom ~14%
of the frame — Meta's own UI sits there. The lockup in these files is centred,
so that band is already clear.

## Logo and icons

| File | Notes |
| --- | --- |
| `logo/traast-logo.{svg,png}` | Navy wordmark, cyan dot, transparent background |
| `logo/traast-logo-white.{svg,png}` | White wordmark, cyan dot — for dark backgrounds |
| `logo/traast-logo-mono-navy.{svg,png}` | Single-colour navy, for one-colour printing |
| `logo/traast-logo-mono-white.{svg,png}` | Single-colour white, for photos and dark video |
| `icon/traast-icon-{512,180,32}.png` | App icon / Apple touch icon / favicon |

Clear space: keep at least the height of the `t` free on all sides. Don't
recolour the dot, restretch the lockup, or add effects — scale the SVGs instead
of the PNGs when you need another size.

`preview.html` is a contact sheet of everything in the kit; open it in a
browser to check the set at a glance.

## Rebuilding

```bash
npm install opentype.js playwright
node brand/build-assets.mjs
```

The script downloads Inter ExtraBold (SIL Open Font License) into `brand/` on
first run; that file is gitignored. Set `INTER_TTF` to use a local copy, and
`CHROMIUM_PATH` if Playwright's bundled Chromium isn't where it expects.
Adding a size means adding one line to the asset list in the script.
