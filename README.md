# Soweto 1976 — In the Eye of Alf Kumalo

An immersive scroll-driven memorial of the 16 June 1976 Soweto uprising, anchored by eleven photographs by **Alf Kumalo**.

The page is built as a journey along the route the students took on the morning of the uprising — each stop pins a Kumalo photograph to the viewport while the narrative passes over it. Ash drifts across the page as the user scrolls. A red index line tracks progress along the route.

## What's inside

```
soweto-1976/
├─ src/
│  ├─ SowetoMemorial.jsx     ← the component
│  └─ images/                 ← all eleven Kumalo photographs (jpg)
├─ package.json
├─ vite.config.js
├─ index.html
├─ tailwind.config.js
├─ postcss.config.js
└─ src/main.jsx, src/index.css
```

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Dropping it into an existing project

If you have a React + Tailwind project already, the only files you actually need are:

- `src/SowetoMemorial.jsx`
- `src/images/*.jpg`
- `framer-motion` installed: `npm install framer-motion`

Then somewhere in your routes:

```jsx
import SowetoMemorial from './SowetoMemorial';

export default function App() {
  return <SowetoMemorial />;
}
```

## Design notes

- **Palette:** charcoal `#0a0908` background, sepia midtones, single accent of `#a11616` (a deep blood-red) reserved for the date, the route progress, and the index numbers. Used sparingly so it carries weight.
- **Typography:** Cormorant Garamond (display serif, italic-capable, elegant) paired with JetBrains Mono (for coordinates, captions, dates). Avoids the default Inter/Roboto AI look.
- **Motion:** Framer Motion drives all scroll-linked transforms. Each "stop" is a 200vh container with a sticky 100vh stage — the image is pinned, a Ken-Burns drift plays out, and the text overlays from the bottom.
- **The ember canvas** is your snowfall — reinterpreted as drifting ash, which feels more honest to the story than literal snow. Intensity scales with scroll position (gentle at hero, denser through the heart of the uprising, easing at the tribute). About 15% of particles are warm-coloured for ember accents.
- **Two photographs depict death** (image07 — bodies before the army vehicle; image09 — the Hector Pieterson grave). They receive a subtler animation treatment (`tone: 'still'`) — slower Ken-Burns, no warm accent, less motion. Restraint matters.
- **Route indicator** on the right shows the eleven stops along the journey. The current stop's name appears beside its dot.
- **Closing** is a direct quote from Kumalo about being told he "didn't get any good pictures" — followed by the photograph and an archival sign-off.

## Customizing

- **Add or reorder stops:** edit the `JOURNEY` array at the top of `SowetoMemorial.jsx`. Each entry needs `id, place, coord, image, title, body, caption, tone`. Set `tone: 'still'` for sober stops, anything else for normal Ken-Burns.
- **Tone down the ash:** in `EmberCanvas`, drop `TARGET` from 140 to ~60.
- **Switch the accent colour:** find `#a11616` and replace.
- **Make it darker / lighter:** the image filter `grayscale(1) contrast(1.05) brightness(0.85)` on each stop controls the moodiness — raise brightness for more visible images, lower for darker.

## Credits

Photographs © Alf Kumalo / BAHA / Kumalo family archive. This page is a tribute and a teaching artifact; if you publish or reproduce it beyond personal use, please clear the photographs with the rights holder.
