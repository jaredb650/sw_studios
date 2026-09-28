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

const normalize = (name: string) =>
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

/** Static paths for artist profile pages (shared by the Spanish and English routes). */
export async function artistPaths() {
  const artists = await getArtists();
  return artists.map((artist, i) => ({
    params: { id: artist.id },
    props: { artist, prev: artists[(i - 1 + artists.length) % artists.length], next: artists[(i + 1) % artists.length] },
  }));
}
