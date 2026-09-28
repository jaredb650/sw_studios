#!/usr/bin/env node
// Generates branded mock images for every `placeholders/` path referenced in
// src/content. Each image is clearly marked EJEMPLO. When real media arrives,
// point the content file at the real image and the placeholder is no longer used.
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

function stamp(width, height, label, color, background, top = false) {
  const w = Math.round(label.length * 18.5 + 44);
  return `<g transform="translate(${width - w - 36} ${top ? 36 : height - 92})">
    <rect width="${w}" height="56" fill="${background}" stroke="${color}" stroke-width="3"/>
    <text x="${w / 2}" y="37" text-anchor="middle" font-family="${MONO}" font-size="24" font-weight="bold" letter-spacing="4" fill="${color}">${esc(label)}</text>
  </g>`;
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
  const { lines, size } = stack(title, W - 140, 230);
  const titleTop = 330 + random() * 60;
  const titleSvg = lines
    .map((line, i) => `<text x="70" y="${titleTop + (i + 1) * size * 0.92}" font-family="${DISPLAY}" font-size="${size.toFixed(0)}" fill="${i % 2 ? p.accent : p.fg}">${esc(line)}</text>`)
    .join('');
  const shape = pick(random, ['circle', 'waves', 'bars']);
  let decoration = '';
  if (shape === 'circle') decoration = `<circle cx="${760 + random() * 200}" cy="${200 + random() * 80}" r="${170 + random() * 60}" fill="${p.extra}" opacity=".85"/>`;
  if (shape === 'waves') {
    for (let i = 0; i < 7; i++) {
      const y = 170 + i * 34;
      decoration += `<path d="M0 ${y} Q 135 ${y - 40} 270 ${y} T 540 ${y} T 810 ${y} T 1080 ${y}" stroke="${p.extra}" stroke-width="12" fill="none"/>`;
    }
  }
  if (shape === 'bars') {
    for (let i = 0; i < 9; i++) {
      const y = 70 + random() * 80;
      decoration += `<rect x="${520 + i * 50}" y="${y}" width="28" height="${Math.max(60, titleTop - 40 - y - random() * 120)}" fill="${p.extra}"/>`;
    }
  }
  const lineupSvg = lineup
    .slice(0, 5)
    .map((name, i) => `<text x="70" y="${1080 + i * 44}" font-family="${DISPLAY}" font-size="36" fill="${p.fg}">${esc(name.toUpperCase())}</text>`)
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
      <rect x="70" y="1030" width="${W - 140}" height="3" fill="${p.fg}" opacity=".6"/>
      ${lineupSvg}
      ${presenter ? `<text x="70" y="1300" font-family="${MONO}" font-size="22" letter-spacing="2" fill="${p.fg}" opacity=".75">${esc(presenter.toUpperCase())}</text>` : ''}
      ${stamp(W, H, 'FLYER · EJEMPLO', p.fg, p.bg)}`,
  };
}

function crowd(label, seed, { width = 1500, height = 1000 } = {}) {
  const random = rng(seed);
  const hues = [LIME, '#ff5fa2', '#4f7cff', '#ffb347', '#9b6bff'];
  let lights = '';
  for (let i = 0; i < 26; i++) {
    lights += `<circle cx="${random() * width}" cy="${random() * height * 0.65}" r="${30 + random() * 110}" fill="${pick(random, hues)}" opacity="${0.18 + random() * 0.4}"/>`;
  }
  let beams = '';
  for (let i = 0; i < 5; i++) {
    const x = random() * width;
    beams += `<polygon points="${x},0 ${x + 30},0 ${x + 260 - random() * 520},${height} ${x - 120},${height}" fill="${pick(random, hues)}" opacity=".12"/>`;
  }
  let heads = '';
  for (let row = 0; row < 3; row++) {
    for (let x = -40; x < width + 40; x += 70 + random() * 60) {
      const y = height - 250 + row * 95 + random() * 40;
      const r = 36 + row * 10 + random() * 10;
      heads += `<circle cx="${x}" cy="${y}" r="${r}"/><rect x="${x - r * 1.5}" y="${y + r * 0.7}" width="${r * 3}" height="400" rx="${r}"/>`;
    }
  }
  return {
    width,
    height,
    svg: `<defs><filter id="b"><feGaussianBlur stdDeviation="28"/></filter></defs>
      <rect width="${width}" height="${height}" fill="#0b0c0b"/>
      <g filter="url(#b)">${lights}</g>${beams}
      <g fill="#050505">${heads}</g>
      <text x="44" y="70" font-family="${MONO}" font-size="26" font-weight="bold" letter-spacing="3" fill="${PAPER}" opacity=".8">${esc(label)}</text>
      ${stamp(width, height, 'FOTO · EJEMPLO', PAPER, '#0b0c0b')}`,
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
      <text x="62" y="160" font-family="${MONO}" font-size="26" letter-spacing="3" fill="${p.fg}" opacity=".85">${esc(discipline.toUpperCase())}</text>
      ${stamp(W, H, 'RETRATO · EJEMPLO', PAPER, INK)}`,
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
      ${halftone(width, height, INK, random, 0.12)}
      <text x="44" y="${height - 44}" font-family="${MONO}" font-size="26" font-weight="bold" letter-spacing="3" fill="${p.fg}" stroke="${p.bg}" stroke-width="6" paint-order="stroke">${esc(title.toUpperCase().slice(0, 42))}</text>
      ${stamp(width, height, 'OBRA · EJEMPLO', p.fg, p.bg, true)}`,
  };
}

function room(label, seed) {
  const W = 1500;
  const H = 1000;
  const random = rng(seed);
  const vx = W / 2 + (random() - 0.5) * 500;
  const vy = H * (0.4 + random() * 0.1);
  let floor = '';
  for (let i = -8; i <= 8; i++) floor += `<line x1="${vx}" y1="${vy}" x2="${vx + i * 220}" y2="${H}" stroke="#2d3029" stroke-width="3"/>`;
  for (let i = 1; i < 7; i++) {
    const y = vy + (H - vy) * (i / 7) ** 1.6;
    floor += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#2d3029" stroke-width="2"/>`;
  }
  const muralColors = [LIME, '#ff6b4a', '#4f7cff', '#ff9ecb', '#ffcf3d', PAPER];
  let murals = '';
  for (let i = 0; i < 5; i++) {
    const x = random() * (W - 300);
    const y = 80 + random() * (vy - 200);
    murals += `<rect x="${x}" y="${y}" width="${120 + random() * 260}" height="${80 + random() * 160}" fill="${pick(random, muralColors)}" opacity="${0.55 + random() * 0.35}" transform="skewY(${(x < vx ? 1 : -1) * 6})"/>`;
  }
  let beams = '';
  for (let i = 0; i < 4; i++) {
    const x = 150 + random() * (W - 300);
    beams += `<polygon points="${x - 10},0 ${x + 10},0 ${x + 180},${H} ${x - 180},${H}" fill="${LIME}" opacity=".07"/>`;
  }
  return {
    width: W,
    height: H,
    svg: `<rect width="${W}" height="${H}" fill="#161815"/>
      <rect y="${vy}" width="${W}" height="${H - vy}" fill="#0d0e0c"/>${floor}${murals}${beams}
      <text x="44" y="70" font-family="${MONO}" font-size="26" font-weight="bold" letter-spacing="3" fill="${PAPER}" opacity=".85">${esc(label)}</text>
      ${stamp(W, H, 'FOTO · EJEMPLO', PAPER, '#161815')}`,
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
      return crowd(`${(data.title ?? 'RECAP').toUpperCase()} · ${index ?? ''}`, name);
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
