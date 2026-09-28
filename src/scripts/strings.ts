// Text the browser scripts create themselves, in the page's language.
// (Most script text comes from data-* attributes rendered by the components.)
const STRINGS = {
  es: { today: 'Hoy', now: 'Ahora', place: 'SAN JUAN, PUERTO RICO', loading: 'Cargando', ready: 'Listo', skip: 'Saltar intro', copied: 'Enlace copiado' },
  en: { today: 'Today', now: 'Now', place: 'SAN JUAN, PUERTO RICO', loading: 'Loading', ready: 'Ready', skip: 'Skip intro', copied: 'Link copied' },
};

export const strings = STRINGS[document.documentElement.lang === 'en' ? 'en' : 'es'];
