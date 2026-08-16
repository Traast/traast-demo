/**
 * Builds the traast logo asset kit (Facebook profile picture + Meta ad formats)
 * from the wordmark used in index.html:
 *   .wordmark { font-weight: 800; letter-spacing: -0.02em }  font: Inter
 *   .wordmark .dot { color: var(--cyan) }
 *
 * Text is converted to vector outlines with opentype.js, so the SVGs are
 * font-independent. PNGs are rasterised from those SVGs with Chromium.
 *
 * Usage:  node brand/build-assets.mjs
 * Needs:  npm i opentype.js playwright   (and Inter ExtraBold at FONT_PATH)
 */
import opentype from 'opentype.js';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'brand');
const FONT_PATH = process.env.INTER_TTF || join(OUT, 'Inter-ExtraBold.ttf');

// Brand tokens, copied from :root in index.html
const NAVY = '#0D1B2A';
const CYAN = '#06B6D4';
const BG = '#F9FAFB';
const WHITE = '#FFFFFF';
const LETTER_SPACING = -0.02; // em, from .wordmark

// Inter ExtraBold (SIL Open Font License) is fetched on demand rather than
// committed, so the repo stays free of vendored binaries.
const INTER_URL = 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf';
if (!existsSync(FONT_PATH)) {
  mkdirSync(dirname(FONT_PATH), { recursive: true });
  const res = await fetch(INTER_URL);
  if (!res.ok) throw new Error(`Could not download Inter ExtraBold: HTTP ${res.status}`);
  writeFileSync(FONT_PATH, Buffer.from(await res.arrayBuffer()));
  console.log(`downloaded Inter ExtraBold -> ${FONT_PATH}`);
}
const font = opentype.parse(readFileSync(FONT_PATH).buffer);

/**
 * Outline `text` starting at pen position `x`, laid out glyph by glyph with
 * kerning and the wordmark's letter-spacing. Done manually rather than via
 * font.getPath() because opentype.js chokes on Inter's `ccmp` lookup table.
 */
function outline(text, x = 0, size = 1000) {
  const scale = size / font.unitsPerEm;
  const path = new opentype.Path();
  let pen = x, prev = null;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    if (prev) pen += font.getKerningValue(prev, glyph) * scale;
    path.extend(glyph.getPath(pen, 0, size));
    pen += glyph.advanceWidth * scale + LETTER_SPACING * size;
    prev = glyph;
  }
  const bb = path.getBoundingBox();
  return { d: path.toPathData(3), advance: pen - x, x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 };
}

const SIZE = 1000;
const word = outline('traast', 0, SIZE);            // navy part
const dot = outline('.', word.advance, SIZE);       // cyan dot, on the same pen line

// Tight bounds of the whole lockup "traast."
const L = { x1: Math.min(word.x1, dot.x1), y1: Math.min(word.y1, dot.y1),
            x2: Math.max(word.x2, dot.x2), y2: Math.max(word.y2, dot.y2) };
const LW = L.x2 - L.x1, LH = L.y2 - L.y1;

// Monogram "t." — used where the wordmark would be illegible (avatars, favicons)
const mWord = outline('t', 0, SIZE);
const mDot = outline('.', mWord.advance, SIZE);
const mono = {
  word: mWord.d,
  dot: mDot.d,
  x1: Math.min(mWord.x1, mDot.x1), y1: Math.min(mWord.y1, mDot.y1),
  x2: Math.max(mWord.x2, mDot.x2), y2: Math.max(mWord.y2, mDot.y2),
};
const MW = mono.x2 - mono.x1, MH = mono.y2 - mono.y1;

/**
 * Lockup placed inside a box: scaled to `targetW` (or `targetH`) and centred
 * on (cx, cy). Returns an SVG <g>.
 */
function lockup({ cx, cy, width, height, wordColor, dotColor, kind = 'wordmark' }) {
  const src = kind === 'mono'
    ? { w: MW, h: MH, x1: mono.x1, y1: mono.y1, word: mono.word, dot: mono.dot }
    : { w: LW, h: LH, x1: L.x1, y1: L.y1, word: word.d, dot: dot.d };
  const s = width != null ? width / src.w : height / src.h;
  const tx = cx - (src.x1 + src.w / 2) * s;
  const ty = cy - (src.y1 + src.h / 2) * s;
  return `<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(6)})">
    <path fill="${wordColor}" d="${src.word}"/>
    <path fill="${dotColor}" d="${src.dot}"/>
  </g>`;
}

function svg(w, h, body, bg) {
  const back = bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${back}${body}</svg>`;
}

// ---------------------------------------------------------------- asset list
const assets = [];
const add = (name, w, h, markup) => assets.push({ name, w, h, svg: markup });

// 1. Core logo files (transparent, tight crop + a little breathing room)
{
  const pad = LH * 0.18;
  const w = Math.round(LW + pad * 2), h = Math.round(LH + pad * 2);
  add('logo/traast-logo', w, h,
    svg(w, h, lockup({ cx: w / 2, cy: h / 2, width: LW, wordColor: NAVY, dotColor: CYAN })));
  add('logo/traast-logo-white', w, h,
    svg(w, h, lockup({ cx: w / 2, cy: h / 2, width: LW, wordColor: WHITE, dotColor: CYAN })));
  add('logo/traast-logo-mono-navy', w, h,
    svg(w, h, lockup({ cx: w / 2, cy: h / 2, width: LW, wordColor: NAVY, dotColor: NAVY })));
  add('logo/traast-logo-mono-white', w, h,
    svg(w, h, lockup({ cx: w / 2, cy: h / 2, width: LW, wordColor: WHITE, dotColor: WHITE })));
}

// 2. Facebook / Instagram profile picture — 1080x1080, cropped to a circle by
//    Meta, so everything lives inside the inscribed circle's safe area (~70%).
{
  const S = 1080;
  // Primary: "t." monogram on navy — stays legible down to 32px.
  add('social/facebook-profile-1080', S, S, svg(S, S,
    lockup({ cx: S / 2, cy: S / 2, height: S * 0.46, wordColor: WHITE, dotColor: CYAN, kind: 'mono' }),
    NAVY));
  // Alternative: full wordmark on navy, sized to fit the circle's safe width.
  add('social/facebook-profile-wordmark-1080', S, S, svg(S, S,
    lockup({ cx: S / 2, cy: S / 2, width: S * 0.62, wordColor: WHITE, dotColor: CYAN }),
    NAVY));
  // Light variant, for placements that sit on dark chrome.
  add('social/facebook-profile-light-1080', S, S, svg(S, S,
    lockup({ cx: S / 2, cy: S / 2, height: S * 0.46, wordColor: NAVY, dotColor: CYAN, kind: 'mono' }),
    WHITE));
}
// 3. Facebook Page cover — 1640x856 desktop; mobile crops to the middle
//    ~640/1640 of the width, so the lockup stays centred and small.
{
  const w = 1640, h = 856;
  add('social/facebook-cover-1640x856', w, h, svg(w, h,
    lockup({ cx: w / 2, cy: h / 2, width: 560, wordColor: WHITE, dotColor: CYAN }), NAVY));
}

// 4. Meta ad placements. Under 20% text is the old rule and no longer enforced,
//    but keeping the lockup modest still performs better in auction.
const adSizes = [
  ['social/meta-ad-1x1-1080x1080', 1080, 1080, 0.46],
  ['social/meta-ad-4x5-1080x1350', 1080, 1350, 0.46],
  ['social/meta-ad-1.91x1-1200x628', 1200, 628, 0.40],
  ['social/meta-story-9x16-1080x1920', 1080, 1920, 0.46],
];
for (const [name, w, h, frac] of adSizes) {
  add(name, w, h, svg(w, h,
    lockup({ cx: w / 2, cy: h / 2, width: w * frac, wordColor: WHITE, dotColor: CYAN }), NAVY));
  add(name.replace('meta-', 'meta-light-'), w, h, svg(w, h,
    lockup({ cx: w / 2, cy: h / 2, width: w * frac, wordColor: NAVY, dotColor: CYAN }), BG));
}

// 5. Square app icon / favicon set
for (const s of [512, 180, 32]) {
  add(`icon/traast-icon-${s}`, s, s, svg(s, s,
    lockup({ cx: s / 2, cy: s / 2, height: s * 0.46, wordColor: WHITE, dotColor: CYAN, kind: 'mono' }),
    NAVY));
}

// ------------------------------------------------------------------ emit
mkdirSync(OUT, { recursive: true });
for (const a of assets) mkdirSync(join(OUT, dirname(a.name)), { recursive: true });

for (const a of assets) writeFileSync(join(OUT, `${a.name}.svg`), a.svg);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
for (const a of assets) {
  await page.setViewportSize({ width: a.w, height: a.h });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${a.svg}`,
    { waitUntil: 'load' });
  await page.screenshot({
    path: join(OUT, `${a.name}.png`),
    omitBackground: true,
    clip: { x: 0, y: 0, width: a.w, height: a.h },
  });
  console.log(`${a.name}.png  ${a.w}x${a.h}`);
}
await browser.close();

// Contact sheet, so the whole kit can be checked at a glance.
const cards = assets.map(a => `
  <figure>
    <div class="frame${a.name.includes('profile') ? ' circle' : ''}">
      <img src="${a.name}.png" alt="${a.name}">
    </div>
    <figcaption>${a.name}.png<span>${a.w}x${a.h}</span></figcaption>
  </figure>`).join('');
writeFileSync(join(OUT, 'preview.html'), `<!doctype html>
<meta charset="utf-8"><title>traast brand assets</title>
<style>
  body { margin:0; padding:40px; background:${BG}; color:${NAVY};
         font:400 14px/1.5 'Inter','Segoe UI',system-ui,sans-serif; }
  h1 { font-weight:800; letter-spacing:-0.02em; margin:0 0 28px; }
  .grid { display:grid; gap:28px; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); }
  figure { margin:0; }
  .frame { background:#fff; border:1px solid #E5E7EB; border-radius:12px; overflow:hidden;
           display:flex; align-items:center; justify-content:center; height:200px;
           background-image:linear-gradient(45deg,#eee 25%,transparent 25%,transparent 75%,#eee 75%),
                            linear-gradient(45deg,#eee 25%,transparent 25%,transparent 75%,#eee 75%);
           background-size:16px 16px; background-position:0 0,8px 8px; }
  .frame.circle img { border-radius:50%; }
  img { max-width:88%; max-height:88%; }
  figcaption { margin-top:8px; font-size:12px; color:#6B7280; display:flex;
               justify-content:space-between; gap:8px; }
  figcaption span { color:${CYAN}; font-weight:700; }
</style>
<h1>traast brand assets</h1>
<div class="grid">${cards}</div>
`);
console.log('preview.html');

