#!/usr/bin/env node
// Generates branded mock images for every `placeholders/` path referenced in
// src/content. The site marks them with an EJEMPLO tag (every sample entry has
// `placeholder: true`), so the images themselves carry no stamp. Venue and
// recap samples are daylight scenes of a creative space, not a dance floor.
// When real media arrives, point the content file at the real image and the
// placeholder is no longer used.
//
//   npm run placeholders            # create missing images
//   npm run placeholders -- --force # regenerate all of them

import { readFile, readdir, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { load as parseYaml } from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = process.env.PLACEHOLDER_CONTENT ?? path.join(ROOT, 'src/content');
const LOGO = path.join(ROOT, 'src/assets/brand/shipwreck-logo.png');
const force = process.argv.includes('--force');

const INK = '#111211';
const PAPER = '#f1f1e9';
const LIME = '#d5ff51';
const PALETTES = [
  { bg: INK, fg: PAPER, accent: LIME, extra: '#363595' },
  { bg: LIME, fg: INK, accent: INK, extra: '#f1f1e9' },
  { bg: '#363595', fg: PAPER, accent: LIME, extra: '#ff6b4a' },
  { bg: '#c2502d', fg: INK, accent: PAPER, extra: LIME },
  { bg: PAPER, fg: INK, accent: '#363595', extra: LIME },
  { bg: '#1d3b36', fg: PAPER, accent: '#ff9ecb', extra: LIME },
];
const DISPLAY = "Impact, 'Arial Narrow', sans-serif";
const MONO = "Menlo, 'Courier New', monospace";
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

function rng(seedText) {
  let seed = 2166136261;
  for (const char of seedText) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (random, list) => list[Math.floor(random() * list.length)];
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let logoData;
async function logo(color) {
  logoData ??= await sharp(LOGO).resize(600).png().toBuffer();
  const tinted = await sharp({ create: { width: 600, height: 600, channels: 4, background: color } })
    .composite([{ input: logoData, blend: 'dest-in' }])
    .png()
    .toBuffer();
  return `data:image/png;base64,${tinted.toString('base64')}`;
}

// Splits a title into stacked lines and sizes them to fill the width.
function stack(title, width, maxSize, maxLines = 4) {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last && (last + ' ' + word).length <= 11 && lines.length) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  while (lines.length > maxLines) lines.splice(-2, 2, lines.slice(-2).join(' '));
  const longest = Math.max(...lines.map((line) => line.length));
  const size = Math.min(maxSize, width / (longest * 0.5));
  return { lines, size };
}

function halftone(width, height, color, random, opacity = 0.18) {
  const step = 28;
  const cx = random() * width;
  const cy = random() * height;
  const maxD = Math.hypot(width, height);
  let dots = '';
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const r = (1 - Math.hypot(x - cx, y - cy) / maxD) ** 3 * 11;
      if (r > 0.8) dots += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}"/>`;
    }
  }
  return `<g fill="${color}" opacity="${opacity}">${dots}</g>`;
}

async function flyer({ title, date, lineup = [], organizers }, seed) {
  const presenter = Array.isArray(organizers) ? organizers.join(' · ') : organizers;
  const W = 1080;
  const H = 1350;
  const random = rng(seed);
  const p = pick(random, PALETTES);
  const d = date ? new Date(`${date}T12:00:00Z`) : null;
  const stacked = stack(title, W - 140, 230);
  const lines = stacked.lines;
  // Leave room below the title for the lineup.
  const size = Math.min(stacked.size, (860 - 330) / (lines.length * 0.92));
  const titleTop = 330 + random() * 60;
  const titleSvg = lines
    .map((line, i) => `<text x="70" y="${titleTop + (i + 1) * size * 0.92}" font-family="${DISPLAY}" font-size="${size.toFixed(0)}" fill="${i % 2 ? p.accent : p.fg}">${esc(line)}</text>`)
    .join('');
  const shape = pick(random, ['circle', 'waves', 'bars']);
  let decoration = '';
  if (shape === 'circle') decoration = `<circle cx="${760 + random() * 200}" cy="${200 + random() * 80}" r="${170 + random() * 60}" fill="${p.extra}" opacity=".85"/>`;
  if (shape === 'waves') {
    // A band between the date (top) and the title, so the waves never cross text.
    for (let i = 0; i < 3; i++) {
      const y = 245 + i * 28;
      decoration += `<path d="M0 ${y} Q 135 ${y - 22} 270 ${y} T 540 ${y} T 810 ${y} T 1080 ${y}" stroke="${p.extra}" stroke-width="10" fill="none"/>`;
    }
  }
  if (shape === 'bars') {
    for (let i = 0; i < 9; i++) {
      const y = 70 + random() * 80;
      decoration += `<rect x="${520 + i * 50}" y="${y}" width="28" height="${Math.max(60, titleTop - 40 - y - random() * 120)}" fill="${p.extra}"/>`;
    }
  }
  // The lineup starts below the title, however many lines the title takes.
  const titleBottom = titleTop + lines.length * size * 0.92;
  const shown = lineup.slice(0, 5);
  const ruleY = Math.max(titleBottom + 40, 900);
  const lineupSize = Math.min(36, (1250 - ruleY - 40) / Math.max(shown.length, 1) / 1.22);
  const lineupSvg = shown
    .map((name, i) => `<text x="70" y="${ruleY + 50 + i * lineupSize * 1.22}" font-family="${DISPLAY}" font-size="${lineupSize.toFixed(0)}" fill="${p.fg}">${esc(name.toUpperCase())}</text>`)
    .join('');
  const mark = await logo(p.fg);
  return {
    width: W,
    height: H,
    svg: `<rect width="${W}" height="${H}" fill="${p.bg}"/>${halftone(W, H, p.fg, random)}${decoration}
      <image href="${mark}" x="${W - 230}" y="60" width="160" height="160" opacity=".9"/>
      ${d ? `<text x="70" y="140" font-family="${DISPLAY}" font-size="120" fill="${p.accent}">${String(d.getUTCDate()).padStart(2, '0')}</text>
      <text x="70" y="200" font-family="${MONO}" font-size="30" font-weight="bold" letter-spacing="3" fill="${p.fg}">${DAYS[d.getUTCDay()]} · ${MONTHS[d.getUTCMonth()]} · ${d.getUTCFullYear()}</text>` : ''}
      ${titleSvg}
      <rect x="70" y="${ruleY}" width="${W - 140}" height="3" fill="${p.fg}" opacity=".6"/>
      ${lineupSvg}
      ${presenter ? `<text x="70" y="1300" font-family="${MONO}" font-size="22" letter-spacing="2" fill="${p.fg}" opacity=".75">${esc(presenter.toUpperCase())}</text>` : ''}`,
  };
}

// Recap sample: people gathered in a bright room (a workshop, a talk, an
// opening), with art on the wall behind them.
function gathering(label, seed, { width = 1500, height = 1000 } = {}) {
  const random = rng(seed);
  const wall = pick(random, ['#e9e5da', '#ece2d0', '#dfe4dc']);
  const art = ['#ff6b4a', '#4f7cff', '#1d3b36', '#ffcf3d', '#c2502d', '#363595'];
  let frames = '';
  for (let x = 90; x < width - 200; x += 260 + random() * 120) {
    const w = 140 + random() * 120;
    const h = 110 + random() * 150;
    frames += `<rect x="${x}" y="${120 + random() * 60}" width="${w}" height="${h}" fill="${pick(random, art)}" stroke="#2b2b27" stroke-width="6"/>`;
  }
  let people = '';
  const tones = ['#3b3a36', '#57534b', '#6d665a', '#2f3b39', '#4a3f38'];
  for (let row = 0; row < 2; row++) {
    for (let x = 40 + row * 60; x < width; x += 150 + random() * 90) {
      const y = height - 330 + row * 120 + random() * 30;
      const r = 42 + row * 10;
      people += `<g fill="${pick(random, tones)}"><circle cx="${x}" cy="${y}" r="${r}"/><rect x="${x - r * 1.4}" y="${y + r * 0.8}" width="${r * 2.8}" height="420" rx="${r}"/></g>`;
    }
  }
  return {
    width,
    height,
    svg: `<rect width="${width}" height="${height}" fill="${wall}"/>
      <rect y="${height * 0.62}" width="${width}" height="${height * 0.38}" fill="#b9a98f"/>
      <polygon points="${width * 0.7},0 ${width},0 ${width},${height * 0.62} ${width * 0.55},${height * 0.62}" fill="#fff" opacity=".35"/>
      ${frames}${people}
      <text x="44" y="70" font-family="${MONO}" font-size="26" font-weight="bold" letter-spacing="3" fill="#2b2b27" opacity=".8">${esc(label)}</text>`,
  };
}

function portrait(name, discipline, seed) {
  const W = 1080;
  const H = 1350;
  const random = rng(seed);
  const p = pick(random, PALETTES);
  const cx = W / 2 + (random() - 0.5) * 160;
  const headY = 560 + random() * 60;
  return {
    width: W,
    height: H,
    svg: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg}"/><stop offset="1" stop-color="${p.extra}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      ${halftone(W, H, p.fg, random, 0.14)}
      <circle cx="${cx + 180}" cy="${headY - 240}" r="${190 + random() * 60}" fill="${p.accent}" opacity=".9"/>
      <g fill="${p.bg === INK ? LIME : INK}">
        <ellipse cx="${cx}" cy="${headY}" rx="170" ry="205"/>
        <rect x="${cx - 70}" y="${headY + 150}" width="140" height="140"/>
        <path d="M ${cx - 430} ${H} C ${cx - 420} ${headY + 330} ${cx - 250} ${headY + 250} ${cx} ${headY + 250} C ${cx + 250} ${headY + 250} ${cx + 420} ${headY + 330} ${cx + 430} ${H} Z"/>
      </g>
      <text x="60" y="110" font-family="${DISPLAY}" font-size="92" fill="${p.fg}">${esc(name.toUpperCase())}</text>
      <text x="62" y="160" font-family="${MONO}" font-size="26" letter-spacing="3" fill="${p.fg}" opacity=".85">${esc(discipline.toUpperCase())}</text>`,
  };
}

function artwork(title, seed) {
  const random = rng(seed);
  const [width, height] = pick(random, [
    [1200, 1500],
    [1400, 1400],
    [1800, 1200],
    [2000, 1125],
  ]);
  const p = pick(random, PALETTES);
  const colors = [p.fg, p.accent, p.extra, pick(random, ['#ff6b4a', '#4f7cff', '#ffcf3d', '#ff9ecb', '#1d3b36'])];
  let shapes = '';
  const count = 7 + Math.floor(random() * 7);
  for (let i = 0; i < count; i++) {
    const color = pick(random, colors);
    const x = random() * width;
    const y = random() * height;
    const s = (0.15 + random() * 0.45) * Math.min(width, height);
    const kind = random();
    if (kind < 0.35) shapes += `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${color}"/>`;
    else if (kind < 0.65) shapes += `<rect x="${x - s / 2}" y="${y - s / 4}" width="${s}" height="${s / 2}" fill="${color}" transform="rotate(${(random() - 0.5) * 70} ${x} ${y})"/>`;
    else shapes += `<path d="M ${x - s} ${y} C ${x - s / 2} ${y - s} ${x + s / 2} ${y + s} ${x + s} ${y}" stroke="${color}" stroke-width="${18 + random() * 40}" fill="none" stroke-linecap="round"/>`;
  }
  return {
    width,
    height,
    svg: `<rect width="${width}" height="${height}" fill="${p.bg}"/>${shapes}
      ${halftone(width, height, INK, random, 0.12)}`,
  };
}

// Venue sample: the space by day, with murals, easels and big windows.
function room(label, seed) {
  const W = 1500;
  const H = 1000;
  const random = rng(seed);
  const vx = W / 2 + (random() - 0.5) * 500;
  const vy = H * (0.45 + random() * 0.08);
  const wall = pick(random, ['#ebe7dc', '#e4ddcf', '#dde3dc']);
  let floor = '';
  for (let i = -8; i <= 8; i++) floor += `<line x1="${vx}" y1="${vy}" x2="${vx + i * 220}" y2="${H}" stroke="#a8977c" stroke-width="3"/>`;
  const muralColors = ['#ff6b4a', '#4f7cff', '#1d3b36', '#ffcf3d', '#363595', '#c2502d'];
  let murals = '';
  for (let i = 0; i < 4; i++) {
    const x = random() * (W - 360);
    const y = 90 + random() * (vy - 260);
    murals += `<rect x="${x}" y="${y}" width="${160 + random() * 260}" height="${90 + random() * 150}" fill="${pick(random, muralColors)}" opacity=".85" transform="skewY(${(x < vx ? 1 : -1) * 5})"/>`;
  }
  let windows = '';
  for (let i = 0; i < 3; i++) windows += `<rect x="${W - 120 - i * 150}" y="60" width="110" height="${vy - 120}" fill="#f7f6f0" stroke="#8c8373" stroke-width="6"/>`;
  let easels = '';
  for (let i = 0; i < 3; i++) {
    const x = 140 + random() * (W - 400);
    const y = vy + 60 + random() * 120;
    easels += `<g stroke="#5b4a36" stroke-width="10"><line x1="${x}" y1="${y}" x2="${x - 60}" y2="${y + 260}"/><line x1="${x}" y1="${y}" x2="${x + 60}" y2="${y + 260}"/></g><rect x="${x - 70}" y="${y - 40}" width="140" height="170" fill="${pick(random, muralColors)}" stroke="#2b2b27" stroke-width="5"/>`;
  }
  return {
    width: W,
    height: H,
    svg: `<rect width="${W}" height="${H}" fill="${wall}"/>
      <rect y="${vy}" width="${W}" height="${H - vy}" fill="#c9b99c"/>${floor}${windows}${murals}${easels}
      <text x="44" y="70" font-family="${MONO}" font-size="26" font-weight="bold" letter-spacing="3" fill="#2b2b27" opacity=".85">${esc(label)}</text>`,
  };
}

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => path.join(e.parentPath, e.name));
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return match ? parseYaml(match[1]) ?? {} : {};
}

function collectPaths(value, found = []) {
  if (typeof value === 'string' && value.includes(process.env.PLACEHOLDER_MARK ?? '/placeholders/')) found.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectPaths(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectPaths(item, found));
  return found;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function render(target, data) {
  const kind = path.basename(path.dirname(target));
  const name = path.basename(target, path.extname(target));
  const index = name.match(/-(\d+)$/)?.[1];
  switch (kind) {
    case 'flyers':
      return flyer(data, name);
    case 'recaps':
      return gathering(`${(data.title ?? 'RECAP').toUpperCase()} · ${index ?? ''}`, name);
    case 'artists':
      return portrait(data.name ?? name, data.disciplines?.[0] ?? 'Artista', name);
    case 'artworks':
      return artwork(data.title ?? name, name);
    case 'venue':
      return name === 'fundador'
        ? portrait('Fundador', 'Shipwreck Studios', name)
        : room(`SHIPWRECK STUDIOS · ESPACIO ${index ?? ''}`, name);
    default:
      throw new Error(`No placeholder style for folder "${kind}" (${target})`);
  }
}

const files = await markdownFiles(CONTENT);
let created = 0;
let skipped = 0;
for (const file of files) {
  const data = frontmatter(await readFile(file, 'utf8'));
  for (const ref of new Set(collectPaths(data))) {
    const target = path.resolve(path.dirname(file), ref);
    if (!force && (await exists(target))) {
      skipped++;
      continue;
    }
    const { width, height, svg } = await render(target, data);
    await mkdir(path.dirname(target), { recursive: true });
    const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svg}</svg>`;
    await sharp(Buffer.from(doc)).jpeg({ quality: 82, mozjpeg: true }).toFile(target);
    created++;
    console.log(`  ${path.relative(ROOT, target)}`);
  }
}
console.log(`Placeholders: ${created} created, ${skipped} already present.`);
