---
# Copy this file as YYYY-MM-DD-nombre-corto.md (e.g. 2026-11-21-marea-alta.md).
# Files starting with "_" are ignored by the site. A misspelled field name stops
# the build with an error, so check the spelling against this template.
title: "Nombre del evento"
date: 2026-11-21            # Day it starts, Puerto Rico time. An event that starts
                            # after midnight (e.g. 00:30) uses the NEXT day's date.
start: "20:00"              # 24 h, in quotes. Optional.
end: "23:00"                # Earlier than start = the next morning. Needs start.
# endDate: 2026-12-20       # Only for multi-day events such as exhibitions.
flyer: ../../assets/events/2026-11-21-marea-alta.jpg
flyerAlt: "Flyer de Nombre del evento, sábado 21 de noviembre"
# Who presents it. For classes and workshops, only who teaches ("Imparte");
# for wellness sessions, who guides ("Guía"). Comma-separated, one or many.
organizers: "Colectivo B"
lineup:                     # Artists and acts. Resident artists' names become links.
  - "Artista A b2b Artista B"
  - "Artista C"
type: taller                # musica | arte | taller | clase | bienestar | mercado | comunidad
admission: tickets          # tickets | free | door | soon
ticketUrl: https://posh.vip/e/...   # Required for tickets; optional otherwise.
price: "Desde $15"          # Free text, optional. The first $ amount also goes to search engines.
restrictions: "Todas las edades"   # Age policy shown with the admission, e.g. "18+".
featured: false             # true = Evento destacado at the top of the agenda (same fields as any event).
soldOut: false              # true = the ticket button reads "Agotado".
status: scheduled           # scheduled | cancelled | postponed
# statusNote: "Cancelado por lluvia. Los boletos se reembolsan a través de quien los vendió."
# timeNote: "Aclaración sobre el horario."
# source: https://www.instagram.com/p/...   # Original announcement, for reference (not shown on the site).
# sourceLabel: "Instagram"
# draft: true               # Hide this event from the site without deleting the file.
# recap:                    # After the event (archive): photos and YouTube videos.
#   summary: "Una línea sobre la noche."
#   photos:
#     - src: ../../assets/recaps/2026-11-21-marea-alta-01.jpg
#       alt: "Descripción de la foto"
#       credit: "Nombre del fotógrafo"
#   videos:
#     - youtube: dQw4w9WgXcQ   # The 11-character id from the YouTube link.
#       title: "Fotos y video de la noche"
---

Descripción del evento en uno o dos párrafos.
