import type { Event } from './events';

/** Music events lead with their lineup; everything else (workshops, classes,
 *  markets…) leads with who is presenting it. */
export const isMusic = (event: Event) => event.data.type === 'musica';

/** How the people in `organizers` are credited, by event type: whoever teaches
 *  a class or workshop, guides a wellness session, or presents anything else.
 *  The same word is used on the card and in the details. */
export function hostRole(event: Event): 'teach' | 'guide' | 'present' {
  if (['taller', 'clase'].includes(event.data.type)) return 'teach';
  if (event.data.type === 'bienestar') return 'guide';
  return 'present';
}

/** "A", "A y B", "A, B y C". */
export function listNames(names: string[]): string {
  if (names.length < 2) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`;
}
