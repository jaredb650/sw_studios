# Shipwreck Studios

Website for Shipwreck Studios, a creative event space and living art gallery in Puerta de Tierra, San Juan.
The site is in Spanish and built to the agreed **Full Experience** package.

- Preview: https://jaredb650.github.io/sw_studios/ (until the client's domain is connected)
- Stack: [Astro 7](https://astro.build) static site, no client framework, deployed to GitHub Pages
- Node 22 (`.nvmrc`)

```sh
npm install
npm run dev          # local site at http://localhost:4321/sw_studios/
npm run build        # production build into dist/ (then removes unused built files)
npm run check        # type and content-schema check
npm run content      # allowance usage + what is still sample content
npm run placeholders # (re)generate mock images referenced by content
npm run brand        # regenerate favicon, share image, logo mask from the master logo and tokens
```

## How the site is organized

The home page is an overview with one section per header nav item:
Inicio, El espacio, Agenda, Artistas, Galería, Participa, Reglas and Visítanos.
Order: hero → El espacio (the manifesto in brief, open to everyone) → rules checkpoint → everything else.
The nav only scrolls between these sections; from other pages it returns to the matching section.
Sections end in a link to their full page. The agenda goes one level deeper:
home preview → **Ver toda la agenda** (`/agenda/`) → **Ver eventos anteriores** (`/archivo/`).
The footer links to every full page.

| Page | Path | Source |
| --- | --- | --- |
| Home: hero, Featured Event + up to 4 event cards, section previews | `/` | all of the below (`HOME_CARDS` in `src/views/Home.astro`) |
| Full agenda: Featured Event, a card for every upcoming event, then "Ver eventos anteriores" | `/agenda/` | `src/content/events/*.md` |
| Archive of past events with photos and video | `/archivo/` | same events, once they end |
| Resident artists + profile pages | `/artistas/`, `/artistas/<id>/` | `src/content/artists/*.md` |
| Gallery: on the walls now / archived work | `/galeria/` | `src/content/artworks/*.md` |
| Intro, virtual tour, "Nuestra historia", manifesto + the SEVENS, venue photos, founder | `/espacio/` | `src/content/pages/espacio.md`, `manifiesto.md`, `fundador.md` |
| Participa: membership (support), Artist Program (contribute), propose an event (Instagram DM) | `/participa/` (old `/membresias/` redirects) | `src/data/site.ts` (Patreon), `src/content/pages/programa-de-artistas.md` |
| Rules of the space (home section `#reglas`, plus the checkpoint) | `/#reglas` | `src/content/pages/reglas.md` |
| Address, directions, contact, "Antes de venir" notes | `/visita/` | `src/data/site.ts` |

Everything the client provides lives in `src/content/` (Markdown with front matter) and
`src/data/site.ts` (address, contact, socials, Patreon, visit notes). Images go in `src/assets/`
and are resized and converted to WebP at build time. Front matter is validated against
`src/content.config.ts`: a missing field, a misspelled field name, a malformed time, a link that
isn't `https://…`, or an artwork crediting an artist file that doesn't exist fails the build with a
message naming the file.

### Events

One file per event: `src/content/events/YYYY-MM-DD-name.md`. Copy `_plantilla.md`
(files starting with `_` are ignored). Times are Puerto Rico local time in quotes
(`"23:45"`), and an end time earlier than the start means the next morning. An event that starts
after midnight uses the next day's date.

- **Every event uses the same fields**; the featured one is just shown larger.
- **Type** (`type`): `musica`, `arte`, `taller`, `clase`, `bienestar`, `mercado` or `comunidad`. It shows as a label on each card and drives the multi-select filter on the agenda page (`?tipo=taller,clase`; Back steps through selections).
- **Who presents it** (`organizers`, comma-separated). The same word is used on the card and in the details (`src/lib/event-kind.ts`): "Imparte" for classes and workshops (only whoever teaches), "Guía" for wellness sessions, "Presenta" for everything else. Music events lead with their lineup instead.
- **Featured Event** ("Evento destacado"): set `featured: true` on any event. If several upcoming events are marked, the soonest wins. If none is marked (or it has passed), the next upcoming event is shown.
- **Other upcoming events** appear as flyer cards: 4 per row on large screens, 3 on tablets (agenda page), 2 on phones. Opening a card spans the full row with all details, and only one card is open at a time.
- **Admission** (`admission`): `tickets` (needs `ticketUrl`), `free`, `door`, or `soon`. `restrictions` is the age policy ("Todas las edades", "18+"), shown with the admission. `soldOut: true` turns the ticket button into a greyed-out "Agotado".
- **One screen per event.** The Featured Event and any opened event fit on one screen, down to an iPhone SE:
  - the flyer is sized from the screen height
  - the lineup and organizers run inline, separated by a slash
  - descriptions longer than 3 lines are clipped behind "Leer más"
  - on phones the flyer becomes a thumbnail beside the date and admission

  The layout lives in the "Event layout" block at the end of `src/styles/components.css`.
- **Every event has the same four actions, in this order:** main button · Cómo llegar · Reglas · Compartir.
  - With a ticket or RSVP link, the main button is yellow and names the platform (e.g. "Boletos en Posh").
  - Otherwise it's a greyed-out status that doesn't link anywhere: "Entrada gratuita", "Pago en la entrada · $10", "Boletos próximamente", "Agotado", "Evento cancelado", or "Evento finalizado".
  - Don't add other buttons. `source` is kept for reference only and isn't shown on the site.
- **Past events move to the archive automatically.** The site rebuilds twice a day (9:15 AM and 9:15 PM Puerto Rico time). Between rebuilds, the page hides events that have ended, updates the counts, and marks today's events.
- **Corrections**: `status: cancelled | postponed` with a `statusNote`. Cancelled and postponed events never enter the archive or an artist's upcoming list.
- **Hide without deleting**: `draft: true`.
- **Recaps** (archive): `recap.photos` and `recap.videos` (YouTube id).
- Resident artists named in a lineup become links, and their profiles list their events automatically. Use `aliases` for alternative spellings.
- Upcoming real events publish schema.org `Event` data (`MusicEvent` for music) for search results.

### Rules checkpoint

Visitors confirm the rules of the space once before exploring:

- **Home page:** the hero and the El espacio section are open. The rules appear after El espacio, and everything below (events included) is locked and faded, and can't be scrolled to, clicked or tabbed into, until the visitor accepts. The footer (address, links) stays visible. A nav link to a locked section leads to the rules, and the button then says where it goes ("Entiendo las reglas: ver cómo llegar").
- **El espacio and Visítanos:** readable without accepting.
- **Other pages:** arriving from another page of the site, the rules open as a pop-up. Arriving straight from a search or a shared link, they open as a sheet along the bottom so the page stays readable; links wait until the visitor accepts.
- **Remembering:** acceptance lasts for the visit (`sessionStorage`), so moving between pages doesn't ask again. A reload or a new visit asks again. The rules stay available in the home page's "Reglas" section.
- **Without JavaScript**, nothing is locked.
- **Code:** `src/components/RulesGate.astro` and `src/scripts/rules.ts`. To turn the pop-up off on inner pages, remove the `gate === 'dialog'` line in `src/layouts/Base.astro`.

### Artists on the home page (carousel)

`src/components/ArtistSpotlight.astro` (behavior in `src/scripts/spotlight.ts`) runs the home carousel:
- **Spotlight:** a large card shows one artist (photo, tags, bio preview, next event at Shipwreck), and a lime bar counts down `SECONDS` (7) before the next artist. Clicking the card opens the profile.
- **Strip:** thumbnails of every artist, paged with the < > arrows (swipe on phones). Clicking a thumbnail shows that artist and stops the rotation (the pause button then reads "Reanudar"). Rotation moves the strip to the next row automatically and loops.
- **Pausing:** the carousel holds while a mouse moves over the card (up to 8 seconds after it stops moving) or the card has keyboard focus, while it's off screen or the tab is hidden, and while the visitor browses another row (it resumes after 6 seconds). It starts paused when animations are switched off.
- **Never frozen:** `src/scripts/alive.ts` restarts the carousel and the hero typewriter whenever they should be running, including after Back or a tab switch.
- **Order:** follows each artist's `order`.

### Artist filters

The Artistas page offers two shortcuts, Música and Arte visual, plus every tag (`disciplines`, genres included) that at least two artists share. Every tag still shows on each artist's card. `src/data/artist-tags.ts` decides which roles count toward each shortcut; reuse existing tag spellings so they group. Any number of filters can be on at once, and **Todos** clears them. The selection is kept in the address (e.g. `/artistas/?tag=dj,pintura`) and an artist profile's "Artistas" link returns to it.

### Artists and gallery

Artists: copy `src/content/artists/_plantilla.md`. The file name is the URL.
Artworks: copy `src/content/artworks/_plantilla.md`. `status: current` shows it under
"En las paredes ahora"; `archived` moves it to the archive of repainted work with
`archivedNote`. Every image opens in the lightbox (Back or Escape closes it).

### Videos

YouTube players load only when the visitor presses play (youtube-nocookie); their thumbnails are
downloaded at build time and served from the site. Leave `youtube` empty to show a
"Video próximamente" frame.

### The hero video

The home hero plays `public/media/hero-wide.mp4` on larger screens and `public/media/hero-tall.mp4`
on phones, over the still frames `hero-wide.jpg` and `hero-tall.jpg` (shown until the video plays,
and instead of it with reduced motion, paused animations or data saver). To replace it, export
two muted H.264 MP4 loops of about 20 seconds with the index at the start ("fast start"):
wide at 16:9 (about 1280 px wide, under 1 MB) and tall at 9:16 (about 540 px wide, under 1.2 MB),
and a JPG still of each. Keep the same file names.

### Patreon and the Artist Program

`src/data/site.ts → patreon`: `status: 'coming-soon'` shows "Próximamente";
`'live'` shows up to three tiers (name, monthly price, benefits, join link) as a list.
The Artist Program shows "Próximamente" until `programa-de-artistas.md` is set to
`status: published` with the approved copy. The home page's Participa band follows both.

### El espacio and Visítanos

- **Nuestra historia:** write the story as the body of `src/content/pages/espacio.md`; the section appears on `/espacio/` once it has text.
- **Manifesto:** `manifiesto.md`. Each soul's paragraph is its `about` field and shows in its cell.
- **Antes de venir:** `site.visitNotes` in `src/data/site.ts` (e.g. parking, accessibility, age policy); the section appears on `/visita/` once it has entries.

## Language

The site is **Spanish only**; an English version is quoted separately. The earlier bilingual
build is kept in git history under the tag `english-v1`.

## Sample content

The client has not delivered most events, photos or videos yet, so the site ships with
clearly marked sample content:

- Entries with `placeholder: true` show an **EJEMPLO** tag.
- While any exist, every page shows a "Vista previa" banner and a `noindex` tag, so search engines won't index fake events. Each deploy's log lists what is still sample.
- Mock images live in `src/assets/placeholders/` and are generated by `npm run placeholders`.
- `npm run content` shows usage against the contract allowances (20 events, 10 artists, 30 photos including the venue photo used as a section background, 3 videos) and lists what is still sample. `npm run content -- --strict` fails until no samples remain and every allowance is respected. Run it before launch.

Real public-source items (CHINONEGRO and the past events taken from public listings) are not marked as samples.

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `main`, twice a day, and on demand.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Keeping the site current

- The twice-daily rebuild is what moves finished events to the archive. GitHub switches scheduled workflows off after 60 days without activity in a repository; `.github/workflows/keepalive.yml` re-enables them every month. If the agenda ever stops updating, check **Actions → Deploy** and press "Enable workflow".
- If a build fails (for example a content file with a mistake), nothing is published and the last good version stays online. GitHub emails the failure to whoever last changed the schedule in `deploy.yml`; after the repository is handed over, make that someone who can fix content.

### Connecting the domain (Namecheap)

1. In `astro.config.mjs`, set `SITE` to `https://<domain>` and `BASE` to `'/'`.
2. Add `public/CNAME` containing the bare domain (e.g. `shipwreckstudios.com`).
3. In Namecheap → Advanced DNS: four `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` → the owner's `<account>.github.io`.
4. In GitHub → Settings → Pages, enter the custom domain and enable **Enforce HTTPS** once the certificate is issued.
5. Handoff: transfer the repository to a Shipwreck-owned GitHub account (contract §4, §8).

## Rebrand

All colors, the text scale and the fonts are CSS custom properties at the top of
`src/styles/global.css`; every tint elsewhere is derived from them. Fonts load through Astro's
font API in `astro.config.mjs`. To apply the designer's guide:

1. Replace `src/assets/brand/shipwreck-logo.png`.
2. Update the tokens (and the fonts in `astro.config.mjs`).
3. Run `npm run brand` to regenerate the favicon, share image and logo mask in the new colors.

## Design and motion

The logo preloader plays on the first home page view of a visit and again after a reload. It is
switched on before the first paint, lasts about 2.5 seconds, and any tap, scroll or key skips it.
A reload starts the visit over at the top: the page scrolls to the top, the intro plays and the rules are asked again.
The site restores scroll position itself (`history.scrollRestoration = 'manual'`) so that a reload opens at the top while the Back button still returns to where the visitor was.
Reduced-motion preferences skip the preloader, the video, the typewriter and the carousel. A pause
button in the hero and one in the footer stop all animation. Content, expandable rows and image
links all work without JavaScript.
