import { getCollection, type CollectionEntry } from 'astro:content';
import { addDays, localDate } from './dates';

export type Event = CollectionEntry<'events'> & { startsAt: Date; endsAt: Date };

// Without an end time, a night is assumed to finish six hours after it starts,
// or at 6 AM the next day when no start time is given either.
const DEFAULT_LENGTH_MS = 6 * 60 * 60 * 1000;

function withTimes(entry: CollectionEntry<'events'>): Event {
  const { date, endDate, start, end } = entry.data;
  const startsAt = localDate(date, start);
  let endsAt: Date;
  if (endDate) {
    endsAt = localDate(endDate, end ?? '23:59');
  } else if (end) {
    endsAt = localDate(start && end <= start ? addDays(date, 1) : date, end);
  } else if (start) {
    endsAt = new Date(startsAt.getTime() + DEFAULT_LENGTH_MS);
  } else {
    endsAt = localDate(addDays(date, 1), '06:00');
  }
  return { ...entry, startsAt, endsAt };
}

export async function getEvents(): Promise<Event[]> {
  const entries = await getCollection('events', ({ data }) => !data.draft);
  return entries.map(withTimes).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Splits events at build time. The site rebuilds daily (see
 * .github/workflows/deploy.yml), and src/scripts/agenda.ts hides any row that
 * ends between builds, so finished events leave the agenda on their own.
 */
export async function getAgenda(now = new Date()) {
  const events = await getEvents();
  const upcoming = events.filter((event) => event.endsAt > now);
  const past = events
    .filter((event) => event.endsAt <= now && event.data.status !== 'cancelled')
    .reverse();
  const featured =
    upcoming.find((event) => event.data.featured && event.data.status === 'scheduled') ??
    upcoming.find((event) => event.data.status === 'scheduled');
  const rest = upcoming.filter((event) => event !== featured);
  return { events, upcoming, past, featured, rest };
}

export function hasRecap(event: Event): boolean {
  const recap = event.data.recap;
  return Boolean(recap && (recap.photos.length || recap.videos.length || recap.summary));
}

/** The in-page anchor for an event, e.g. "evento-2026-10-17-chinonegro". */
export const eventAnchor = (event: Event) => `evento-${event.id}`;
