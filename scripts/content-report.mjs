#!/usr/bin/env node
// Content status: usage against the contract allowances (Full Experience,
// Appendix C) and everything still marked as sample content.
//
//   npm run content              # print the report
//   npm run content -- --strict  # also fail if any sample content remains (use before launch)

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const strict = process.argv.includes('--strict');

const LIMITS = { events: 20, artists: 10, photos: 30, videos: 3, words: 1500, programWords: 1000 };

async function entries(collection) {
  const dir = path.join(CONTENT, collection);
  const files = (await readdir(dir)).filter((name) => name.endsWith('.md') && !name.startsWith('_'));
  return Promise.all(
    files.map(async (name) => {
      const text = await readFile(path.join(dir, name), 'utf8');
      const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      return { id: name.replace(/\.md$/, ''), data: match ? parseYaml(match[1]) ?? {} : {}, body: match ? match[2] : text };
    }),
  );
}

const words = (text = '') => (text.replace(/[#*_>`-]/g, ' ').match(/[\p{L}\p{N}’']+/gu) ?? []).length;
const live = (list) => list.filter((entry) => !entry.data.draft);

const events = live(await entries('events'));
const artists = live(await entries('artists'));
const artworks = live(await entries('artworks'));
const pages = await entries('pages');
const siteSource = await readFile(path.join(ROOT, 'src/data/site.ts'), 'utf8');

const photos = {
  venue: pages.reduce((n, page) => n + (page.data.photos?.length ?? 0) + (page.data.photo ? 1 : 0), 0),
  artists: artists.length,
  artworks: artworks.length,
  recaps: events.reduce((n, event) => n + (event.data.recap?.photos?.length ?? 0), 0),
};
const photoTotal = Object.values(photos).reduce((a, b) => a + b, 0);
const videos = [
  ...pages.flatMap((page) => page.data.videos ?? []),
  ...events.flatMap((event) => event.data.recap?.videos ?? []),
];
const program = pages.find((page) => page.id === 'programa-de-artistas');
const generalPages = pages.filter((page) => page.id !== 'programa-de-artistas');
const generalWords = generalPages.reduce(
  (n, page) =>
    n + words(page.body) + words(page.data.lead) + (page.data.items ?? []).reduce((m, item) => m + words(item.title) + words(item.text), 0),
  0,
);
const programWords = program?.data.status === 'published' ? words(program.body) : 0;

const row = (label, used, limit, note = '') => {
  const flag = used > limit ? '  ← over the allowance' : '';
  console.log(`  ${label.padEnd(30)} ${String(used).padStart(5)} / ${String(limit).padEnd(6)}${note}${flag}`);
};

console.log('\nShipwreck Studios — content report\n');
console.log('Allowances (Full Experience)          used / limit');
row('Events', events.length, LIMITS.events);
row('Artist profiles', artists.length, LIMITS.artists);
row('Photos, excluding flyers', photoTotal, LIMITS.photos, `  venue ${photos.venue} · artists ${photos.artists} · artwork ${photos.artworks} · recaps ${photos.recaps}`);
row('YouTube videos', videos.length, LIMITS.videos, `  ${videos.filter((v) => v.youtube).length} with a video id`);
row('General copy (words)', generalWords, LIMITS.words, '  espacio, fundador, reglas');
row('Artist Program copy (words)', programWords, LIMITS.programWords, program?.data.status === 'published' ? '' : '  not published yet (shows "Próximamente")');

const samples = [
  ...[['events', events], ['artists', artists], ['artworks', artworks], ['pages', pages]].flatMap(([name, list]) =>
    list.filter((entry) => entry.data.placeholder).map((entry) => `${name}/${entry.id}`),
  ),
  ...(/patreon:\s*{[\s\S]*?placeholder:\s*true/.test(siteSource) ? ['src/data/site.ts → patreon'] : []),
];
const placeholderImages = [...events, ...artists, ...artworks, ...pages].flatMap((entry) =>
  JSON.stringify(entry.data).match(/[^"]*\/placeholders\/[^"]*/g) ?? [],
);

console.log(`\nSample content still in use: ${samples.length} entries, ${placeholderImages.length} placeholder images`);
const grouped = Object.groupBy(samples, (id) => id.split('/')[0]);
for (const [group, ids] of Object.entries(grouped)) console.log(`  ${group.padEnd(9)} ${ids.map((id) => id.split('/').slice(1).join('/')).join(', ')}`);

console.log('\nPending from the client');
const pending = [
  [/status:\s*'coming-soon'/.test(siteSource.match(/patreon:[\s\S]*?tiers/)?.[0] ?? ''), 'Patreon account (section shows "Próximamente")'],
  [program?.data.status !== 'published', 'Artist Program copy from Alacran'],
  [videos.some((v) => !v.youtube), `${videos.filter((v) => !v.youtube).length} YouTube video id(s)`],
  [/email:\s*null/.test(siteSource), 'Contact email'],
  [/postalCode:\s*null/.test(siteSource), 'Confirmed postal code (00901 vs 00918)'],
  [/placeholder:\s*true/.test(siteSource), 'Real Patreon tiers, prices and URL'],
].filter(([open]) => open);
for (const [, label] of pending) console.log(`  · ${label}`);
console.log('');

if (strict && (samples.length || placeholderImages.length)) {
  console.error('Sample content remains. Replace it (or mark the entries draft: true) before launch.');
  process.exit(1);
}
