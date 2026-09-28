# Shipwreck Studios — agreed scope and build checklist

Sources: *Shipwreck Studios Website Contract (ES/EN)* and *Shipwreck Studios Proposal — Jared Beguelin (EN/ES)*.
The contract controls over the proposal; the Spanish text of the contract controls over the English.

> **Package: Full Experience.** It is $2,000, $1,750 or $1,500, depending on the upfront payment plan (A, B or C).
> **Still open:** record the payment plan and the designated contact (contract §12) here once confirmed.
> The proposal names Emily as final approver.

Status key: `[x]` built · `[~]` built, waiting on client content or access · `[ ]` to do

Branch `build/full-experience` builds everything that doesn't need client input. Sample content fills the gaps: it is marked **EJEMPLO**, kept out of search engines, and tracked by `npm run content`.
The client-facing checklist of what to send is in [GUIA-DE-CONTENIDO.md](GUIA-DE-CONTENIDO.md).

---

## 1. Site-wide requirements

- [x] Spanish-language site. The English version is out of scope and quoted separately.
- [x] Responsive layout for phones, tablets and desktops, checked at 390 px and 1440 px with no horizontal overflow.
- [x] Basic search metadata: title, description and canonical URL on every page.
- [x] Social metadata:
  - Open Graph and Twitter card tags
  - a branded share image
  - the artist photo as the share image on each profile
- [x] `sitemap-index.xml` and `robots.txt`.
- [x] schema.org structured data:
  - MusicVenue for the venue
  - MusicEvent for real upcoming events
  - Person for real artists
- [x] Standard accessibility practices:
  - semantic landmarks, alt text, focus states and a skip link
  - reduced motion respected, plus a motion toggle
  - axe-core reports no violations on any page at desktop or mobile widths
- [~] Connect the existing Namecheap domain. The steps are in the README.
  - Needs from the client: the domain name and Namecheap access.
  - Also needed: switching GitHub Pages to deploy through Actions.
- [x] Basic handoff documentation: README.md, the content templates (`_plantilla.md`) and GUIA-DE-CONTENIDO.md.
- [x] Purpose-built visual identity. The demo direction is extended to every page, with every color and font in one tokens block for the rebrand.

## 2. Features

### Event agenda
- [x] Events are listed in date order, with one file per event (`src/content/events/`), validated at build time.
- [x] One **Featured Event**: `featured: true`. If it has passed, or none is marked, the next upcoming event is featured.
- [x] Every other event appears as a compact row that expands to show:
  - name, flyer and date
  - start and end time
  - lineup, with links to resident artists
  - description and admission details
  - ticket link, directions and rules
  - a share button
- [x] Without a ticket link, the row shows "Entrada gratuita", "Pago en la entrada" or "Boletos próximamente".
- [x] Ticket links go to the promoter's page, and the button names the platform (for example "Boletos en Posh").
- [x] Past events move to the archive automatically:
  - the site rebuilds daily
  - between rebuilds, the page hides rows that have ended
  - rows show "Hoy" or "Ahora" on the day of the event
- [x] Cancelled and postponed events are marked, with a note explaining the change.
- [~] Real event data: 20 slots, of which 5 hold real public-source events and 15 hold samples.

### Information sections
- [~] Mission, story and founder on `/espacio/`. The copy is sample text.
- [~] Address and directions (Google Maps and Apple Maps) on `/visita/`.
  - The postal code is unconfirmed: 00901 or 00918.
- [~] Contact: Instagram direct messages works now. Email, phone and WhatsApp appear automatically once they are added.
- [x] Social links in the footer and on `/visita/`. Missing networks stay hidden.
- [~] Club rules on `/visita/#reglas`. The 8 rules are samples.
- [~] **Artist Program** on `/club/`, shown separately from Patreon.
  - It displays "Próximamente" until the approved copy from Alacran arrives.

### Patreon memberships
- [x] Up to 3 tiers, each with a price, benefits and a "Unirse en Patreon" button.
- [x] A "Próximamente" state, switched with `patreon.status` in `src/data/site.ts`.
- [~] Real tiers, prices and the Patreon URL. The current ones are samples.
- [ ] One setup and link check, once the account exists.

### YouTube
- [x] Click-to-load player (youtube-nocookie). Without a video id it shows a "Video próximamente" frame.
- [~] 3 video slots (the venue tour and two recaps), all waiting on YouTube ids.

## 3. Full Experience features

- [x] **Public event archive** (`/archivo/`):
  - grouped by year
  - rows expand to the flyer, lineup and recap
  - recap photos open in the lightbox, and recap videos play inline
- [x] **Resident artist profiles** (`/artistas/`, `/artistas/<id>/`), each with:
  - photo, bio and disciplines
  - social links and selected work
  - their works in the gallery
  - their upcoming and past events, found automatically from lineups
  - previous and next artist navigation
- [x] **Art gallery** (`/galeria/`):
  - justified rows that never crop a work
  - lightbox with keyboard, swipe and next/previous
  - artist credits and technical details
  - "En la pared" and "Archivada" sections, so repainted work stays online
- [~] Real artist and artwork content: 10 artists and 8 works, all samples.

## 4. Initial content allowances

| Content | Allowance |
|---|---|
| Events | 20 upcoming or past |
| Artist profiles | up to 10 |
| Photos, excluding flyers | 30 in total: venue, artists, artwork, recaps |
| YouTube videos | up to 3 |
| General copy | 1,500 words |
| Final Artist Program copy | 1 publication, up to 1,000 words |

Light cropping, compression, formatting and copy editing are included. Jared may draft general copy from the client's notes, within the allowance and subject to approval.
Unused allowances do not carry over.

## 5. Client inputs to collect (shared Drive folder)

- [ ] Selected package and payment plan, plus the upfront payment. Work starts once it is received.
- [ ] Designated single contact (contract §12).
- [ ] Namecheap domain access.
- [ ] Event data for up to 20 upcoming or past events, with flyers.
- [ ] Up to 30 photos in total: venue, artists, artwork and recaps.
- [ ] YouTube links.
- [ ] Copy:
  - mission
  - founder
  - story
  - rules
  - contact
  - socials
- [ ] Artist Program copy from Alacran. It can arrive after launch.
- [ ] Patreon account URL and up to 3 tiers (name, price, benefits). These can arrive after launch.
- [ ] Up to 10 artist profiles, plus gallery images with credits and current or archived status.
- [ ] Final brand guide, assets and font licenses from the designer. This does not block launch (see section 6).

## 6. Process, revisions and timeline

1. **Choose and organize.** The client picks a package, pays upfront and shares approved content.
2. **Design and review.** Build the preview. The client sends one consolidated feedback round within 5 business days.
   The pre-launch allowance is 1 visual direction and 1 revision round.
3. **Publish.** After approval **and payment of the balance**, connect the domain and hand over the source files and account access.

- **Estimate:** 3 to 4 weeks from receiving the upfront payment, access and complete content.
- **After launch:**
  - Up to 3 rounds of minor adjustments within 60 days, up to 2 hours each.
  - Defects in agreed features are fixed free for 60 days.
- **Rebrand:** up to 10 hours to apply the designer's final guide (logo, colors, type, graphic treatments), requested within 6 months of launch.
  After that the rate is $40/hour.
- **Additional work:** $40/hour with a 30-minute minimum, and only with prior written approval.
- **Pauses:** the project may pause after 15 business days of client inactivity.

## 7. Out of scope (quote separately)

- English version
- full backlog import
- sorting large volumes of media
- photo or video production or editing
- extensive copywriting or translation
- month-grid calendar
- recurring-event scheduling
- ticket-platform integration
- individual artwork pages
- advanced filters
- interactive maps
- art sales
- staff CMS or editing accounts
- social media management
- promoter coordination
- ticketing support

## 8. Optional monthly service (post-launch, $250/month)

The client can opt in after launch. Each month includes, with the limits applied together and no rollover:

- up to 4 weekly batches
- up to 4 priority event corrections, with a 1-business-day target
- up to 10 hours in total

Complete content for a batch is due 2 business days before the agreed publishing day.
