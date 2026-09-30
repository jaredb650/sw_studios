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

// An 11-character YouTube video id, e.g. the `dQw4w9WgXcQ` in youtube.com/watch?v=dQw4w9WgXcQ.
// Omit `youtube` to show a "video coming soon" frame instead.
// Web links (tickets, socials, selected work) must be http(s) addresses.
const link = z.url({ protocol: /^https?$/, error: 'Usa un enlace completo que empiece con https://' });

// Every schema is strict: a misspelled field (e.g. "featued") stops the build
// instead of being silently ignored.
const video = z.object({
  youtube: z.string().regex(/^[\w-]{11}$/, { error: 'Usa solo el id de 11 caracteres del video.' }).optional(),
  // Or a video served from this site: an MP4 in public/, e.g. /media/recorrido.mp4.
  file: z.string().regex(/^\/.+\.mp4$/, { error: 'Usa la ruta del MP4 dentro de public/, por ejemplo /media/recorrido.mp4.' }).optional(),
  poster: z.string().optional(),
  title: z.string(),
}).strict();

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
        ticketUrl: link.optional(),
        price: z.string().optional(),
        restrictions: z.string().optional(),
        // Any event can be the Featured Event at the top of the agenda. If several
        // upcoming events are marked, the soonest wins; if none is, the next event is shown.
        // What kind of event it is: shown on the card and used by the agenda filters.
        type: z.enum(['musica', 'arte', 'taller', 'clase', 'bienestar', 'mercado', 'comunidad']).default('musica'),
        featured: z.boolean().default(false),
        // true = the button reads "Agotado" (greyed out) instead of linking to tickets.
        soldOut: z.boolean().default(false),
        status: z.enum(['scheduled', 'cancelled', 'postponed']).default('scheduled'),
        statusNote: z.string().optional(),
        timeNote: z.string().optional(),
        source: link.optional(),
        sourceLabel: z.string().optional(),
        recap: z
          .object({
            summary: z.string().optional(),
            photos: z
              .array(z.object({ src: image(), alt: z.string(), credit: z.string().optional() }))
              .default([]),
            videos: z.array(video).default([]),
          })
          .optional(),
        placeholder: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .strict()
      .refine((event) => event.admission !== 'tickets' || event.ticketUrl, {
        error: 'admission: tickets requiere ticketUrl.',
        path: ['ticketUrl'],
      })
      .refine((event) => !event.endDate || event.endDate >= event.date, {
        error: 'endDate no puede ser anterior a date.',
        path: ['endDate'],
      })
      .refine((event) => !event.end || event.start, {
        error: 'Si indicas end (hora de cierre), indica también start.',
        path: ['end'],
      }),
});

const socials = z
  .object({
    instagram: link,
    soundcloud: link,
    mixcloud: link,
    spotify: link,
    bandcamp: link,
    beatport: link,
    residentAdvisor: link,
    youtube: link,
    tiktok: link,
    website: link,
  })
  .partial()
  .strict()
  .default({});

const artists = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      // Other spellings used in event lineups, for automatic linking.
      aliases: z.array(z.string()).default([]),
      disciplines: z.array(z.string()).min(1),
      photo: image(),
      photoAlt: z.string(),
      base: z.string().optional(),
      socials,
      // Selected external work: mixes, releases, videos, press.
      work: z
        .array(z.object({ title: z.string(), url: link, kind: z.string().optional() }))
        .default([]),
      order: z.number().default(100),
      placeholder: z.boolean().default(false),
      draft: z.boolean().default(false),
    }).strict(),
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
        dimensions: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(['current', 'archived']),
        // Shown on archived work, e.g. "Repintada en agosto de 2026".
        archivedNote: z.string().optional(),
        image: image(),
        alt: z.string(),
        order: z.number().default(100),
        placeholder: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .strict()
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
      status: z.enum(['published', 'coming-soon']).default('published'),
      lead: z.string().optional(),
      name: z.string().optional(),
      role: z.string().optional(),
      photo: image().optional(),
      photoAlt: z.string().optional(),
      photos: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
        .default([]),
      // El espacio: venue photos grouped by room, in the order they appear.
      rooms: z
        .array(
          z.object({
            name: z.string(),
            kind: z.string().optional(),
            photos: z.array(z.object({ src: image(), alt: z.string() })).min(1),
          }),
        )
        .default([]),
      videos: z.array(video).default([]),
      items: z
        .array(z.object({ title: z.string(), text: z.string(), about: z.string().optional() }))
        .default([]),
      // Text after the item list (Markdown), e.g. the manifesto's closing after the SEVENS.
      outro: z.string().optional(),
      placeholder: z.boolean().default(false),
    }).strict(),
});

export const collections = { events, artists, artworks, pages };
