import type { Event } from './events';

/** Music events lead with their lineup; everything else (workshops, classes,
 *  markets…) leads with who is presenting it. */
export const isMusic = (event: Event) => event.data.type === 'musica';

/** Types where the organizer is the person teaching or leading. */
export const isTaught = (event: Event) => ['taller', 'clase', 'bienestar'].includes(event.data.type);

/** "A", "A y B", "A, B y C" (or "and" in English). */
export function listNames(names: string[], lang: 'es' | 'en' = 'es'): string {
  if (names.length < 2) return names[0] ?? '';
  const and = lang === 'en' ? (names.length > 2 ? ', and ' : ' and ') : ' y ';
  return `${names.slice(0, -1).join(', ')}${and}${names.at(-1)}`;
}
