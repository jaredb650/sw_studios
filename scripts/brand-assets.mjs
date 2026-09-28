#!/usr/bin/env node
// Derives the web brand assets from the master logo (src/assets/brand/shipwreck-logo.png).
// Rerun after the rebrand replaces the logo or colors:  npm run brand

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = path.join(ROOT, 'src/assets/brand/shipwreck-logo.png');
// Colors come from the design tokens in src/styles/global.css, so after a
// rebrand edits the tokens, rerunning this script matches them.
const css = readFileSync(path.join(ROOT, 'src/styles/global.css'), 'utf8');
const token = (name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
const INK = token('bg');
const LIME = token('accent');
const PAPER = token('fg');
const MUTED = token('muted');

const tinted = async (size, color) => {
  const shape = await sharp(LOGO).resize(size, size, { fit: 'contain', background: '#0000' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: color } })
    .composite([{ input: shape, blend: 'dest-in' }])
    .png()
    .toBuffer();
};

async function tile(size, file) {
  const mark = await tinted(Math.round(size * 0.78), LIME);
  const inset = Math.round(size * 0.11);
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: mark, left: inset, top: inset }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}

// Alpha-only silhouette used as a CSS mask, so CSS can recolor it. Only its
// shape matters, so a small 16-color palette keeps it light (it loads on every page).
await sharp(LOGO)
  .resize(384, 384, { fit: 'contain', background: '#0000' })
  .png({ compressionLevel: 9, palette: true, colors: 16 })
  .toFile(path.join(ROOT, 'src/assets/brand/shipwreck-mark.png'));

// Browser tab icon: 64px covers high-density screens.
await tile(64, path.join(ROOT, 'public/favicon.png'));
await tile(180, path.join(ROOT, 'public/apple-touch-icon.png'));

const mark = await tinted(400, LIME);
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${INK}"/>
  <text x="72" y="300" font-family="Impact, 'Arial Narrow', sans-serif" font-size="128" fill="${PAPER}">SHIPWRECK</text>
  <text x="72" y="440" font-family="Impact, 'Arial Narrow', sans-serif" font-size="128" fill="${LIME}">STUDIOS_</text>
  <text x="76" y="540" font-family="Menlo, monospace" font-size="26" letter-spacing="4" fill="${MUTED}">DONDE LAS IDEAS COBRAN VIDA — SAN JUAN, PR</text>
</svg>`;
await sharp(Buffer.from(og))
  .composite([{ input: mark, left: 760, top: 95 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(ROOT, 'public/og-default.jpg'));

console.log('Brand assets written: shipwreck-mark.png, favicon.png, apple-touch-icon.png, og-default.jpg');
