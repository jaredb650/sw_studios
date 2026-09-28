import type { Event } from './events';

/** Music events lead with their lineup; everything else (workshops, classes,
 *  markets…) leads with who is presenting it. */
export const isMusic = (event: Event) => event.data.type === 'musica';

/** Types where the organizer is the person teaching or leading. */
export const isTaught = (event: Event) => ['taller', 'clase', 'bienestar'].includes(event.data.type);

/** "A", "A y B", "A, B y C". */
export function listNames(names: string[]): string {
  if (names.length < 2) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`;
}
