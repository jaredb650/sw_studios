import { ROLE_CATEGORIES, type ArtistCategory } from '../data/artist-tags';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Event } from './events';

export type Artist = CollectionEntry<'artists'>;
export type LineupSegment = { text: string; artist?: Artist };

export async function getArtists(): Promise<Artist[]> {
  const artists = await getCollection('artists', ({ data }) => !data.draft);
  return artists.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'es'));
}

// Lineup lines combine names with connectors ("A b2b B", "A + B", "Colectivo (A + B)").
const SEPARATORS = /(\s+b2b\s+|\s+x\s+|\s*\+\s*|\s*&\s*|\s*,\s*|\s*·\s*|\s*\(\s*|\s*\)\s*)/i;

export const normalize = (name: string) =>
  name.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

export function artistIndex(artists: Artist[]): Map<string, Artist> {
  const index = new Map<string, Artist>();
  for (const artist of artists) {
    for (const name of [artist.data.name, ...artist.data.aliases]) index.set(normalize(name), artist);
  }
  return index;
}

/** Splits a lineup line and links the names that match a resident artist. */
export function linkLineup(line: string, index: Map<string, Artist>): LineupSegment[] {
  return line
    .split(SEPARATORS)
    .filter((text) => text !== '')
    .map((text) => ({ text, artist: SEPARATORS.test(text) ? undefined : index.get(normalize(text)) }));
}

/** Events whose lineup mentions the artist, by name or alias. */
export function eventsForArtist(artist: Artist, events: Event[], index: Map<string, Artist>): Event[] {
  return events.filter((event) =>
    event.data.lineup.some((line) => linkLineup(line, index).some((segment) => segment.artist?.id === artist.id)),
  );
}

/** Static paths for artist profile pages. */
export async function artistPaths() {
  const artists = await getArtists();
  return artists.map((artist, i) => ({
    params: { id: artist.id },
    props: { artist, prev: artists[(i - 1 + artists.length) % artists.length], next: artists[(i + 1) % artists.length] },
  }));
}


export type ArtistTag = { slug: string; label: string; count: number; kind: 'category' | 'role' };

const tagSlug = (text: string) => normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Every tag of one artist plus its broad categories, as filter slugs. */
export function artistFilterSlugs(artist: Artist): string[] {
  const slugs = new Set<string>();
  for (const tag of artist.data.disciplines) {
    slugs.add(tagSlug(tag));
    const category = ROLE_CATEGORIES[normalize(tag)];
    if (category) slugs.add(category);
  }
  return [...slugs];
}

/** Filter chips for the Artistas page: the two broad categories, then the tags two or more artists share. */
export function artistFilterTags(artists: Artist[], categoryLabels: Record<ArtistCategory, string>): ArtistTag[] {
  const roles = new Map<string, ArtistTag>();
  const categories = new Map<ArtistCategory, number>();
  for (const artist of artists) {
    const seenCategories = new Set<ArtistCategory>();
    artist.data.disciplines.forEach((tag) => {
      const category = ROLE_CATEGORIES[normalize(tag)];
      if (category) seenCategories.add(category);
      const slug = tagSlug(tag);
      const existing = roles.get(slug);
      if (existing) existing.count++;
      else roles.set(slug, { slug, label: tag, count: 1, kind: 'role' });
    });
    seenCategories.forEach((category) => categories.set(category, (categories.get(category) ?? 0) + 1));
  }
  const categoryTags: ArtistTag[] = (['musica', 'arte'] as ArtistCategory[])
    .filter((category) => categories.has(category))
    .map((category) => ({ slug: category, label: categoryLabels[category], count: categories.get(category)!, kind: 'category' }));
  // Tags only one artist has would each filter down to that one card, so they aren't offered.
  const roleTags = [...roles.values()].filter((tag) => tag.count >= 2).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
  return [...categoryTags, ...roleTags];
}

/** First paragraph of a Markdown bio as plain text, for previews. */
export function bioPreview(markdown: string | undefined): string {
  const paragraph = (markdown ?? '').trim().split(/\n\s*\n/)[0] ?? '';
  return paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
