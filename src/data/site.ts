import type { Route } from '../i18n';

// Venue-wide settings. Leave a value as null to hide it on the site.

export type PatreonTier = {
  /** Tier names are names: not translated. */
  name: string;
  /** Monthly price in USD. */
  price: number;
  summary?: string;
  summaryEn?: string;
  benefits: string[];
  benefitsEn?: string[];
  /** Tier-specific join link; falls back to patreon.url. */
  url?: string;
  highlight?: boolean;
};

export const site = {
  name: 'Shipwreck Studios',
  // Tagline, intro, and the site description are interface copy: see src/i18n/ui.ts.
  timezone: 'America/Puerto_Rico',

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
    appleMapsUrl: 'https://maps.apple.com/?q=Shipwreck+Studios&address=202+Calle+San+Agustin,+San+Juan,+Puerto+Rico',
  },

  // Pending from the client. Each entry is hidden while null.
  contact: {
    email: null as string | null,
    phone: null as string | null,
    whatsapp: null as string | null,
    instagramDm: 'https://ig.me/m/shipwreckstudios_',
  },

  // General opening hours are not established; events list their own times.
  hours: null as string | null,

  socials: {
    instagram: 'https://www.instagram.com/shipwreckstudios_/',
    facebook: null as string | null,
    tiktok: null as string | null,
    youtube: null as string | null,
    soundcloud: null as string | null,
  },

  patreon: {
    // 'coming-soon' hides the tiers and shows "Próximamente".
    // 'live' shows up to three tiers with join buttons.
    status: 'live' as 'live' | 'coming-soon',
    url: 'https://example.com/patreon-shipwreck' as string | null,
    placeholder: true,
    tiers: [
      {
        name: 'Tripulación',
        price: 5,
        summary: 'Para quienes quieren apoyar el espacio y enterarse primero.',
        summaryEn: 'For those who want to support the space and hear first.',
        benefits: ['Contenido exclusivo y anuncios antes que nadie', 'Descuento en talleres y clases', 'Tu nombre en el muro de la tripulación'],
        benefitsEn: ['Exclusive content and announcements before anyone else', 'Discounts on workshops and classes', 'Your name on the crew wall'],
      },
      {
        name: 'Cubierta',
        price: 15,
        summary: 'Para quienes vienen a aprender, crear y compartir.',
        summaryEn: 'For those who come to learn, create, and share.',
        benefits: [
          'Todo lo de Tripulación',
          'Inscripción anticipada y cupos reservados en talleres',
          'Sesiones y encuentros exclusivos para miembros',
        ],
        benefitsEn: ['Everything in Tripulación', 'Early registration and reserved spots in workshops', 'Members-only sessions and gatherings'],
        highlight: true,
      },
      {
        name: 'Capitanía',
        price: 40,
        summary: 'Para quienes sostienen el barco.',
        summaryEn: 'For those who keep the ship afloat.',
        benefits: [
          'Todo lo de Cubierta',
          'Entrada gratuita a eventos, talleres y clases seleccionados',
          'Invitación al encuentro anual de la comunidad',
        ],
        benefitsEn: ['Everything in Cubierta', 'Free entry to select events, workshops, and classes', 'An invitation to the annual community gathering'],
      },
    ] as PatreonTier[],
  },
};

// Header navigation: each item jumps to a section of the home page (labels
// in src/i18n/ui.ts → nav.sections). `pages` are the deeper pages that belong
// to that section, so the item stays highlighted while visiting them.
export const nav: { section: 'inicio' | 'agenda' | 'espacio' | 'artistas' | 'galeria' | 'membresias' | 'reglas' | 'visita'; pages: Route[] }[] = [
  { section: 'inicio', pages: [] },
  { section: 'espacio', pages: ['space'] },
  { section: 'agenda', pages: ['agenda', 'archive'] },
  { section: 'artistas', pages: ['artists'] },
  { section: 'galeria', pages: ['gallery'] },
  { section: 'membresias', pages: ['memberships'] },
  { section: 'reglas', pages: [] },
  { section: 'visita', pages: ['visit'] },
];

// Full pages, listed in the footer (labels in src/i18n/ui.ts → footer.pages).
export const pages: Exclude<Route, 'home'>[] = ['space', 'agenda', 'archive', 'artists', 'gallery', 'memberships', 'visit'];
