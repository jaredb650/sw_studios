import type { Route } from '../i18n';

/** The Instagram account, without the @. Every Instagram link and mention uses it. */
const INSTAGRAM = 'shipwreckstudios_';

// Venue-wide settings. Leave a value as null to hide it on the site.

export type PatreonTier = {
  /** Tier names are names: not translated. */
  name: string;
  /** Monthly price in USD. */
  price: number;
  summary?: string;
  benefits: string[];
  /** Tier-specific join link; falls back to patreon.url. */
  url?: string;
};

export const site = {
  name: 'Shipwreck Studios',
  // Tagline, intro, and the site description are interface copy: see src/i18n/ui.ts.
  // Dates and times use Puerto Rico time: see src/lib/dates.ts.
  instagramHandle: `@${INSTAGRAM}`,

  address: {
    venue: 'Shipwreck Studios',
    street: '202 Calle San Agustín',
    neighborhood: 'Puerta de Tierra',
    city: 'San Juan',
    region: 'PR',
    // Sources disagree (00901 vs 00918); confirm with the client before publishing.
    postalCode: null as string | null,
    country: 'PR',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Shipwreck+Studios+202+Calle+San+Agustin+San+Juan+Puerto+Rico',
    // Shipwreck's own Apple Maps listing (not a bare address pin).
    appleMapsUrl: 'https://maps.apple.com/place?place-id=I1DF188EEC3914351',
  },

  // Pending from the client. Each entry is hidden while null.
  contact: {
    email: null as string | null,
    phone: null as string | null,
    whatsapp: null as string | null,
    instagramDm: `https://ig.me/m/${INSTAGRAM}`,
  },

  // General opening hours are not established; events list their own times.
  hours: null as string | null,

  // "Antes de venir" on /visita/: short answers visitors look for (parking,
  // accessibility, age policy, what to bring…). Hidden while empty; the
  // client supplies the text.
  visitNotes: [] as { title: string; text: string }[],

  socials: {
    instagram: `https://www.instagram.com/${INSTAGRAM}/`,
    facebook: null as string | null,
    tiktok: null as string | null,
    youtube: null as string | null,
    soundcloud: null as string | null,
  },

  patreon: {
    // 'coming-soon' hides the tiers and shows "Próximamente".
    // 'live' shows up to three tiers with join buttons.
    status: 'coming-soon' as 'live' | 'coming-soon',
    url: 'https://example.com/patreon-shipwreck' as string | null,
    placeholder: true,
    tiers: [
      {
        name: 'Tripulación',
        price: 5,
        summary: 'Para quienes quieren apoyar el espacio y enterarse primero.',
        benefits: ['Contenido exclusivo y anuncios antes que nadie', 'Descuento en talleres y clases', 'Tu nombre en el muro de la tripulación'],
      },
      {
        name: 'Cubierta',
        price: 15,
        summary: 'Para quienes vienen a aprender, crear y compartir.',
        benefits: [
          'Todo lo de Tripulación',
          'Inscripción anticipada y cupos reservados en talleres',
          'Sesiones y encuentros exclusivos para miembros',
        ],
      },
      {
        name: 'Capitanía',
        price: 40,
        summary: 'Para quienes sostienen el barco.',
        benefits: [
          'Todo lo de Cubierta',
          'Entrada gratuita a eventos, talleres y clases seleccionados',
          'Invitación al encuentro anual de la comunidad',
        ],
      },
    ] as PatreonTier[],
  },
};

// Header navigation: each item jumps to a section of the home page (labels
// in src/i18n/ui.ts → nav.sections). `pages` are the deeper pages that belong
// to that section, so the item stays highlighted while visiting them.
export const nav: { section: 'inicio' | 'agenda' | 'espacio' | 'artistas' | 'galeria' | 'participa' | 'reglas' | 'visita'; pages: Route[] }[] = [
  { section: 'inicio', pages: [] },
  { section: 'espacio', pages: ['space'] },
  { section: 'agenda', pages: ['agenda', 'archive'] },
  { section: 'artistas', pages: ['artists'] },
  { section: 'galeria', pages: ['gallery'] },
  { section: 'participa', pages: ['participate'] },
  { section: 'reglas', pages: [] },
  { section: 'visita', pages: ['visit'] },
];

// Full pages, listed in the footer (labels in src/i18n/ui.ts → footer.pages).
export const pages: Exclude<Route, 'home'>[] = ['space', 'agenda', 'archive', 'artists', 'gallery', 'participate', 'visit'];
