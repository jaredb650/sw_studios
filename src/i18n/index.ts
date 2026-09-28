// Interface text and page paths. The site is Spanish only: an English version
// is quoted separately (a snapshot of the earlier bilingual build is tagged
// `english-v1` in git).
import { ui, type UI } from './ui';

export type Lang = 'es';

const PATHS = {
  home: '/',
  agenda: '/agenda/',
  archive: '/archivo/',
  artists: '/artistas/',
  gallery: '/galeria/',
  space: '/espacio/',
  participate: '/participa/',
  visit: '/visita/',
} as const;

export type Route = keyof typeof PATHS;

/** A page path, without the deploy base (see href() in lib/urls). */
export const routePath = (route: Route): string => PATHS[route];
export const artistPath = (id: string): string => `${PATHS.artists}${id}/`;

/** Everything a component needs: the interface text and path helpers. */
export function useLang(_url?: URL) {
  return {
    lang: 'es' as Lang,
    t: ui as UI,
    path: routePath,
    artist: artistPath,
  };
}
