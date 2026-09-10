# Shipwreck Studios

Website: https://jaredb650.github.io/sw_studios/

Static website published by GitHub Pages from the `docs/` directory on `main`.
Edits pushed to `main` are published automatically by GitHub Pages.

- `docs/index.html`: source-linked venue and event content
- `docs/style.css`: responsive styles
- `docs/site.js`: prevents expired featured events from appearing upcoming
- `RESEARCH.md`: public-source audit and verification limitations

Information was checked September 10, 2026. The calendar is maintained manually;
it does not synchronize with Instagram. Refresh event details before making updates.

The `.openai/hosting.json` file preserves the identity of the earlier private Sites preview;
GitHub Pages serves only `docs/`.

## Design and motion

The logo preloader runs once per tab session and clears after a maximum of 2.6 seconds, even if assets stall. Escape, Tab, and the skip button dismiss it. Reduced-motion preferences skip it entirely. The footer includes a motion toggle. No scroll hijacking, autoplay audio, or animation dependencies are used.

`docs/motion.css` contains the visual refinement and motion styles. Scroll updates are scheduled only on scroll, resize, and visibility changes; they do not run continuously while idle. Content remains visible without JavaScript.

Visual research: [fabric](https://www.fabriclondon.com/) (event hierarchy), [KOKO](https://www.koko.co.uk/) (large typography and visual scale), and [Club Transit on Awwwards](https://www.awwwards.com/inspiration/event-section-club-transit) (typographic scrolling and event layouts). These informed the design direction; no third-party copy or assets were imported.
