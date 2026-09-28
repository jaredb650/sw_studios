import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Dates are written as YYYY-MM-DD and times as "HH:MM" (24 h, quoted) in
// Puerto Rico local time. Puerto Rico has no daylight saving time, so every
// date/time is interpreted at UTC−04:00 (see src/lib/dates.ts).
// Unquoted YAML dates arrive as Date objects at UTC midnight, so their UTC
// calendar day is the intended day.
const day = z
  .union([z.date(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .transform((value) => (typeof value === 'string' ? value : value.toISOString().slice(0, 10)));

const time = z
  .string({ error: 'Escribe la hora entre comillas en formato 24 h, p. ej. "23:45".' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Formato de hora 24 h entre comillas, p. ej. "23:45".' });

// English: any translatable field `x` may have an English version `xEn`
// (`bodyEn` holds the English Markdown body). Missing English falls back to
// Spanish. Proper names (event titles, artist names, artwork titles, lineups,
// organizers) are never translated.
const en = z.string().optional();

// An 11-character YouTube video id, e.g. the `dQw4w9WgXcQ` in youtube.com/watch?v=dQw4w9WgXcQ.
// Omit `youtube` to show a "video coming soon" frame instead.
const video = z.object({
  youtube: z.string().regex(/^[\w-]{11}$/, { error: 'Usa solo el id de 11 caracteres del video.' }).optional(),
  title: z.string(),
  titleEn: en,
});

const events = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        date: day,
        // Last day for multi-day events such as exhibitions.
        endDate: day.optional(),
        start: time.optional(),
        // An end time earlier than the start time means the next morning.
        end: time.optional(),
        flyer: image().optional(),
        flyerAlt: z.string().optional(),
        flyerAltEn: en,
        // Promoters/organizers, as a comma-separated list or a YAML list:
        // organizers: "PromotoresPR, Shipwreck Studios, Radio Underground PR"
        organizers: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .transform((value) =>
            (value === undefined ? [] : Array.isArray(value) ? value : value.split(','))
              .map((name) => name.trim())
              .filter(Boolean),
          ),
        lineup: z.array(z.string()).default([]),
        admission: z.enum(['tickets', 'free', 'door', 'soon']),
        ticketUrl: z.url().optional(),
        price: z.string().optional(),
        priceEn: en,
        restrictions: z.string().optional(),
        restrictionsEn: en,
        // Any event can be the Featured Event at the top of the agenda. If several
        // upcoming events are marked, the soonest wins; if none is, the next event is shown.
        featured: z.boolean().default(false),
        status: z.enum(['scheduled', 'cancelled', 'postponed']).default('scheduled'),
        statusNote: z.string().optional(),
        statusNoteEn: en,
        timeNote: z.string().optional(),
        timeNoteEn: en,
        source: z.url().optional(),
        sourceLabel: z.string().optional(),
        recap: z
          .object({
            summary: z.string().optional(),
            summaryEn: en,
            photos: z
              .array(z.object({ src: image(), alt: z.string(), altEn: en, credit: z.string().optional() }))
              .default([]),
            videos: z.array(video).default([]),
          })
          .optional(),
        bodyEn: en,
        placeholder: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .refine((event) => event.admission !== 'tickets' || event.ticketUrl, {
        error: 'admission: tickets requiere ticketUrl.',
        path: ['ticketUrl'],
      }),
});

const socials = z
  .object({
    instagram: z.url(),
    soundcloud: z.url(),
    mixcloud: z.url(),
    spotify: z.url(),
    bandcamp: z.url(),
    beatport: z.url(),
    residentAdvisor: z.url(),
    youtube: z.url(),
    tiktok: z.url(),
    website: z.url(),
  })
  .partial()
  .default({});

const artists = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      // Other spellings used in event lineups, for automatic linking.
      aliases: z.array(z.string()).default([]),
      disciplines: z.array(z.string()).min(1),
      disciplinesEn: z.array(z.string()).optional(),
      photo: image(),
      photoAlt: z.string(),
      photoAltEn: en,
      base: z.string().optional(),
      baseEn: en,
      socials,
      // Selected external work: mixes, releases, videos, press.
      work: z
        .array(z.object({ title: z.string(), url: z.url(), kind: z.string().optional(), kindEn: en }))
        .default([]),
      bodyEn: en,
      order: z.number().default(100),
      placeholder: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const artworks = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/artworks' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        // A resident artist (file name in src/content/artists) or, for guests, a name.
        artist: reference('artists').optional(),
        artistName: z.string().optional(),
        year: z.number().int().optional(),
        medium: z.string().optional(),
        mediumEn: en,
        dimensions: z.string().optional(),
        dimensionsEn: en,
        location: z.string().optional(),
        locationEn: en,
        status: z.enum(['current', 'archived']),
        // Shown on archived work, e.g. "Repintada en agosto de 2026".
        archivedNote: z.string().optional(),
        archivedNoteEn: en,
        image: image(),
        alt: z.string(),
        altEn: en,
        bodyEn: en,
        order: z.number().default(100),
        placeholder: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .refine((work) => work.artist || work.artistName, {
        error: 'Indica artist (residente) o artistName (invitado).',
        path: ['artist'],
      }),
});

// Editorial copy. Each file uses the fields that apply to it.
const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      titleEn: en,
      status: z.enum(['published', 'coming-soon']).default('published'),
      lead: z.string().optional(),
      leadEn: en,
      name: z.string().optional(),
      // Only for placeholder names like "Nombre por confirmar"; real names aren't translated.
      nameEn: en,
      role: z.string().optional(),
      roleEn: en,
      photo: image().optional(),
      photoAlt: z.string().optional(),
      photoAltEn: en,
      photos: z
        .array(z.object({ src: image(), alt: z.string(), altEn: en, caption: z.string().optional(), captionEn: en }))
        .default([]),
      videos: z.array(video).default([]),
      items: z
        .array(z.object({ title: z.string(), titleEn: en, text: z.string(), textEn: en }))
        .default([]),
      bodyEn: en,
      // Text after the item list (Markdown), e.g. the manifesto's closing after the SEVENS.
      outro: z.string().optional(),
      outroEn: en,
      placeholder: z.boolean().default(false),
    }),
});

export const collections = { events, artists, artworks, pages };
