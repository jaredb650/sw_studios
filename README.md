# Shipwreck Studios

Website for Shipwreck Studios, a music venue and living art gallery in Puerta de Tierra, San Juan.
The site is in Spanish and scoped to the **Full Experience** package (see [SCOPE.md](SCOPE.md)).

- Preview: https://jaredb650.github.io/sw_studios/ (until the client's domain is connected)
- Stack: [Astro 7](https://astro.build) static site, no client framework, deployed to GitHub Pages
- Node 22 (`.nvmrc`)

```sh
npm install
npm run dev          # local site at http://localhost:4321/sw_studios/
npm run build        # production build into dist/
npm run check        # type and content-schema check
npm run content      # allowance usage + what is still sample content
npm run placeholders # (re)generate mock images referenced by content
npm run brand        # regenerate favicon, share image, logo mask from the master logo
```

## How the site is organized

The home page is an overview with one section per header nav item:
Inicio, El espacio, Agenda, Artistas, Galería, Membresías, Reglas and Visítanos.
Order: hero → scrolling ribbon → El espacio (the manifesto in brief, open to everyone) → rules checkpoint → everything else.
The nav only scrolls between these sections; from other pages it returns to the matching section.
Each section ends in a "Ver…" link to its full page. The agenda goes one level deeper:
home preview → **Ver toda la agenda** (`/agenda/`) → **Ver eventos anteriores** (`/archivo/`).
The footer links to every full page.

| Page | Path | Source |
| --- | --- | --- |
| Home: hero, Featured Event + up to 4 event cards, section previews | `/` | all of the below (`HOME_CARDS` in `src/views/Home.astro`) |
| Full agenda: compact heading, Featured Event, a card for every upcoming event, then "Ver eventos anteriores" | `/agenda/` | `src/content/events/*.md` |
| Archive of past events with recaps | `/archivo/` | same events, once they end |
| Resident artists + profile pages | `/artistas/`, `/artistas/<id>/` | `src/content/artists/*.md` |
| Gallery: on the walls now / archived work | `/galeria/` | `src/content/artworks/*.md` |
| Intro, virtual tour, manifesto + the SEVENS, venue photos, founder, links to the rest of the venue | `/espacio/` | `src/content/pages/espacio.md`, `manifiesto.md`, `fundador.md` |
| Patreon memberships + Artist Program | `/membresias/` | `src/data/site.ts` (Patreon), `src/content/pages/programa-de-artistas.md` |
| Club rules (home section `#reglas`, plus the checkpoint) | `/#reglas` | `src/content/pages/reglas.md` |
| Address, directions, contact | `/visita/` | `src/data/site.ts` |

Everything the client provides lives in `src/content/` (Markdown with front matter) and
`src/data/site.ts` (address, contact, socials, Patreon). Images go in `src/assets/`
and are resized and converted to WebP at build time. Front matter is validated against
`src/content.config.ts`, so a missing field or a malformed time fails the build with a
message naming the file.

### Events

One file per event: `src/content/events/YYYY-MM-DD-name.md`. Copy `_plantilla.md`
(files starting with `_` are ignored). Times are Puerto Rico local time in quotes
(`"23:45"`), and an end time earlier than the start means the next morning.

- **Every event uses the same fields**; the featured one is just shown larger.
- **Featured Event** ("Evento destacado"): set `featured: true` on any event. If several upcoming events are marked, the soonest wins. If none is marked (or it has passed), the next upcoming event is shown.
- **Other upcoming events** appear as flyer cards: 4 per row on large screens, 3 on tablets, 2 on phones. Opening a card spans the full row with all details, and only one card is open at a time.
- **Organizers**: `organizers: "PromotoresPR, Shipwreck Studios, Radio Underground PR"`. Separate several with commas; they show as "Organiza"/"Organizan".
- **Admission** (`admission`): `tickets` (needs `ticketUrl`), `free`, `door`, or `soon`.
- **One screen per event.** The Featured Event and any opened event fit on one screen, down to an iPhone SE:
  - the flyer is sized from the screen height
  - the lineup and organizers run inline, separated by the star
  - descriptions longer than 3 lines are clipped behind "Leer más"
  - on phones the flyer becomes a thumbnail beside the date and admission

  The layout lives in the "Event layout" block at the end of `src/styles/components.css`.
- **Every event has the same four actions, in this order:** main button · Cómo llegar · Reglas · Compartir.
  - With a ticket or RSVP link, the main button is yellow and names the platform (e.g. "Boletos en Posh").
  - Otherwise it's a greyed-out status that doesn't link anywhere: "Entrada gratuita", "Pago en la entrada · $10", "Boletos próximamente", "Evento cancelado", or "Evento finalizado".
  - Don't add other buttons. `source` is kept for reference only and isn't shown on the site.
- **Past events move to the archive automatically.** The site rebuilds daily at 9:15 AM Puerto Rico time. Between rebuilds, the page hides rows that have ended and marks today's events.
- **Corrections**: `status: cancelled | postponed` with a `statusNote`. Cancelled events never enter the archive.
- **Recaps** (archive): `recap.photos` and `recap.videos` (YouTube id).
- Resident artists named in a lineup become links, and their profiles list their events automatically. Use `aliases` for alternative spellings.
- Upcoming real events publish schema.org `MusicEvent` data for search results.

### Rules checkpoint

Visitors confirm the club rules once before exploring:

- **Home page:** the hero and the El espacio section are open. The rules appear after El espacio, and everything below (events included) is locked and faded, and can't be scrolled to, clicked or tabbed into, until the visitor presses "He leído y entiendo las reglas". The page then opens at the agenda, or at the section the visitor was trying to reach.
- **El espacio page:** readable without accepting, like its home section.
- **Other pages** (for example a shared event link): the same rules open as a dialog on arrival.
- **Remembering:** acceptance lasts for the visit (`sessionStorage`), so moving between pages doesn't ask again. A reload (normal or hard) or a new visit asks again. The rules stay available in the home page's "Reglas" section.
- **Without JavaScript**, nothing is locked.
- **Code:** `src/components/RulesGate.astro` and `src/scripts/rules.ts`. To turn the dialog off on inner pages, remove the `gate === 'dialog'` line in `src/layouts/Base.astro`.

### Artists on the home page (carousel)

`src/components/ArtistSpotlight.astro` runs the home carousel:
- **Spotlight:** a large card shows one artist (photo, tags, bio preview, next event at Shipwreck), and a lime bar counts down `SECONDS` (7) before the next artist. Clicking the card opens the profile.
- **Strip:** thumbnails of every artist below the card, paged with the < > arrows (swipe on phones). Clicking a thumbnail shows that artist and restarts the countdown. Rotation moves the strip to the next row automatically and loops after the last artist.
- **Pausing:** the carousel pauses while the card is hovered or focused, while it's off screen or the tab is hidden, and while the visitor browses another row with the arrows. It has a pause button and starts paused when animations are switched off.
- **Order:** follows each artist's `order`.

### Artist filters

The Artistas page shows a filter for every tag the artists use (`disciplines`, genres included), plus two shortcuts, Música and Arte visual. `src/data/artist-tags.ts` decides which roles count toward each shortcut. Any number of filters can be on at once; the grid shows artists with any of the selected tags, and **Todos** clears them. The selection is kept in the address (e.g. `/artistas/?tag=dj,pintura`), so filtered views can be shared.

### Artists and gallery

Artists: copy `src/content/artists/_plantilla.md`. The file name is the URL.
Artworks: copy `src/content/artworks/_plantilla.md`. `status: current` shows it under
"En las paredes ahora"; `archived` moves it to the archive of repainted work with
`archivedNote`. Every image opens in the lightbox.

### Videos

YouTube embeds load only when the visitor presses play (youtube-nocookie). Leave
`youtube` empty to show a "Video próximamente" frame.

### Patreon and the Artist Program

`src/data/site.ts → patreon`: `status: 'coming-soon'` shows "Próximamente";
`'live'` shows up to three tiers with join buttons to the Patreon page.
The Artist Program shows "Próximamente" until `programa-de-artistas.md` is set to
`status: published` with the approved copy.

## Languages

The site is **Spanish only**. An English version is fully built but switched off at the client's request:
- **Where it lives:** its pages are in `src/pages/_en/`. Astro skips folders that start with `_`, so they aren't published.
- **To turn it back on:** set `ENGLISH_ENABLED = true` in `src/i18n/index.ts` and rename `src/pages/_en` to `src/pages/en`.
- **Interface text** for both languages is in `src/i18n/ui.ts`. Content files carry `xEn` fields (for example `bodyEn` and `timeNoteEn`) for the English copy.
- **Recent Spanish edits:** some Spanish copy was reworded after the English was written, so review the English before re-enabling it.

## Sample content

The client has not delivered events, photos or videos yet, so the site ships with
clearly marked sample content:

- Entries with `placeholder: true` show an **EJEMPLO** tag.
- While any exist, every page shows a "Vista previa" banner and a `noindex` tag, so search engines won't index fake events.
- Mock images live in `src/assets/placeholders/` and are generated by `npm run placeholders`.
- `npm run content` lists what is still sample; `npm run content -- --strict` fails until none remains. Run it before launch.

Real public-source items (CHINONEGRO and four past events) are not marked as samples;
see [RESEARCH.md](RESEARCH.md) for their sources and caveats.

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `main`, daily, and on demand.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Connecting the domain (Namecheap)

1. In `astro.config.mjs`, set `SITE` to `https://<domain>` and `BASE` to `'/'`.
2. Add `public/CNAME` containing the bare domain (e.g. `shipwreckstudios.com`).
3. In Namecheap → Advanced DNS: four `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` → `jaredb650.github.io`.
4. In GitHub → Settings → Pages, enter the custom domain and enable **Enforce HTTPS** once the certificate is issued.
5. Handoff: transfer the repository to a Shipwreck-owned GitHub account (contract §4, §8).

## Rebrand

All colors, fonts and spacing are CSS custom properties at the top of
`src/styles/global.css`. Fonts load through Astro's font API in `astro.config.mjs`. To apply the
designer's guide:

1. Replace `src/assets/brand/shipwreck-logo.png`.
2. Update the tokens.
3. Run `npm run brand` to regenerate the favicon, share image and logo mask.

## Design and motion

The logo preloader plays on the first home page view of a visit and again after any reload, and clears within 2.6 seconds.
A reload starts the visit over at the top: the page scrolls to the top, the intro plays and the rules are asked again.
The site restores scroll position itself (`history.scrollRestoration = 'manual'`) so that a reload opens at the top while the Back button still returns to where the visitor was.
Reduced-motion preferences skip it, and the footer includes a motion toggle. Scroll
effects update only on scroll, resize and visibility changes. Content, expandable
rows and image links all work without JavaScript.

Visual research: [fabric](https://www.fabriclondon.com/), [KOKO](https://www.koko.co.uk/),
[Club Transit on Awwwards](https://www.awwwards.com/inspiration/event-section-club-transit).
No third-party copy or assets were imported.
