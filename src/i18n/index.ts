// Spanish is the main language (served at the site root); English lives
// under /en/ with translated page paths. Every component reads the language
// from the page URL, so nothing needs to pass it down.
import { marked } from 'marked';
import { ui, type UI } from './ui';

export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];

// The site is Spanish-only for now. The English version is kept but switched off:
// to bring it back, set this to true and rename src/pages/_en to src/pages/en.
export const ENGLISH_ENABLED = false;

const PATHS = {
  home: { es: '/', en: '/en/' },
  agenda: { es: '/agenda/', en: '/en/events/' },
  archive: { es: '/archivo/', en: '/en/archive/' },
  artists: { es: '/artistas/', en: '/en/artists/' },
  gallery: { es: '/galeria/', en: '/en/gallery/' },
  space: { es: '/espacio/', en: '/en/space/' },
  memberships: { es: '/participa/', en: '/en/participate/' },
  visit: { es: '/visita/', en: '/en/visit/' },
} as const;

export type Route = keyof typeof PATHS;

/** A page path in a language, without the deploy base (see href() in lib/urls). */
export const routePath = (route: Route, lang: Lang): string => PATHS[route][lang];
export const artistPath = (id: string, lang: Lang): string => `${PATHS.artists[lang]}${id}/`;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function langFromUrl(url: URL): Lang {
  const path = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : url.pathname;
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'es';
}

/** Everything a component needs for the current page's language. */
export function useLang(url: URL) {
  const lang = langFromUrl(url);
  return {
    lang,
    t: ui[lang] as UI,
    path: (route: Route) => routePath(route, lang),
    artist: (id: string) => artistPath(id, lang),
  };
}

/** The English version of a content field (`fieldEn`) when viewing in English, else the Spanish one. */
export function pick<T extends Record<string, any>, K extends keyof T & string>(data: T, key: K, lang: Lang): T[K] {
  if (lang === 'en') {
    const english = data[`${key}En`];
    if (english !== undefined && english !== null && english !== '') return english;
  }
  return data[key];
}

/** Renders the English Markdown body (`bodyEn`). */
export function markdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}
