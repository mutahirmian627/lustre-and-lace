# Immersive experience (experiment): the Digital Atelier

A 3D, scroll-driven version of the studio homepage. It lives at `/immersive` on the `feature/immersive`
branch and is **not linked from anywhere and not indexed** until it is approved to replace `/`.

Nothing here touches the live site: its styles are scoped to `.immersive-root`, its constants are in
`constants.ts`, its three typefaces load in the route group's own layout, and the route has its own layout
(`app/(immersive)/`).

**Status: stage 2.** The stage 1 art direction is approved and locked. The experience now runs: opening gallery,
doorway and lattice screen, the hall, the approach line, the **seven services** (one bay of the hall each), and a
provisional close (contact). The work exhibition and the process come next, between the services and the close.

## The idea

One installation, not a page with 3D decoration. A **ribbon** of mirror chrome is its spine: it falls from the
top of the gallery, threads the **doorway** and runs down the middle of the **hall**. The camera follows the same
route. **Arches** are the transitions: the doorway in the gallery wall, and the ribs along the hall.
Everything is that one arch silhouette (`lib/arch.ts`) at different sizes.

Four materials only (`lib/materials.ts`):

| Material | Where | How it is made |
|---|---|---|
| Mirror chrome | the ribbon, a hairline inlay round the doorway | almost pure reflection of a bright, high-contrast painted cube |
| Frosted glass | the lattice screen | milky bars, clear gaps; a second fainter lattice sits behind, offset by half a cell, so they slide against each other |
| Ivory ceramic | gallery walls and floor (tiled), ribs | glazed: broad soft sheen; the floor has 1.6 m tile seams, which also make its perspective visible |
| Plum lacquer | the hall | deep colour under a hard, glossy reflection |

The lattice (`lib/textures.ts → createJaliMask`) is a restrained, contemporary reading of a jali screen: a square
grid, a diamond joining the midpoints of its sides and a ring at the centre. Geometry, not ornament.

## How it fits together

```
app/(immersive)/layout.tsx           fonts (Instrument Serif/Sans, DM Mono), page root, data-phase="opening"
app/(immersive)/immersive/page.tsx   the page: a tall "run" with a pinned stage inside it; all the text
features/immersive/
  scene/      The 3D. Stage.tsx (canvas) > Experience.tsx (lights, resources, compile) >
              Architecture, JaliScreen, Ribbon, Dust, CameraRig, Placards.
              StageLoader.tsx decides picture-or-3D and mounts the canvas after idle.
  content.ts  the seven services (words)
  lib/        world.ts (measurements, the ribbon's route, the camera's routes), timeline.ts (scroll maths, no 3D)
              arch.ts, materials.ts, textures.ts, reflection-cubes.ts (the painted light-worlds)
              frame.ts (lens shift per screen shape), tiers.ts (device sorting), stage-state.ts
              pointer.ts, menu-store.ts, when-needed.ts
  sections/   Backdrop (the pre-rendered pictures), ScrollDriver (scroll -> --p), TierBadge (?debug)
  nav/        the bar and full-screen menu
  styles/     immersive.css
scripts/render-immersive-poster.mjs  renders the four fallback pictures from the real scene
```

## Ideas worth knowing

- **HTML is the layout; 3D is a picture behind it.** All text, links and buttons are real HTML, laid out by CSS.
  The scene is framed for the text: the camera uses a *shifted lens* (`lib/frame.ts`), moving the vanishing point
  to where the architecture should sit (right of centre on wide screens, centred and high on tall ones) so
  verticals stay vertical. Wider screens than the reference crop top and bottom, narrower ones crop the sides,
  exactly like `object-fit: cover`, so the live scene lines up with the fallback pictures.
- **Gallery labels** (`Placards.tsx`) are real HTML captions pinned to points in the scene each frame, the way a
  museum label sits beside an object. They name the materials and fade at the first scroll.
- **Scroll is two numbers.** One tall "run" holds everything, pinned stage inside. `ScrollDriver` turns the scroll
  position into `--p` (0..1 across the opening) and `--s` (0..1 across the services and the close), plus
  `data-phase` (opening, transit, approach, services, contact) and `data-service` (0..6) on the page root. No
  re-renders; scrolling stays native. CSS derives the text fades and `--atmosphere` (ivory 0 → plum 1) from them.
  `stageState.target` is `p + s` (0..2) and feeds the camera, which eases towards it: 0..1 rides the opening
  route, 1..2 the hall route (`lib/world.ts`), and the two join at the same point. The sizes of the two parts
  (`RUN`) and the pure scroll maths (`hallJourney`, `serviceIndexAt`) are in `lib/timeline.ts`, which has no 3D
  import so the page's scroll listener doesn't pull the 3D library into the first load.
- **One service per rib.** The hall has a rib every 4 m and the camera passes one per service, so the architecture
  itself paces the list. The hall's lanterns travel with the camera and drift from rose to gold the deeper it goes;
  nothing new is added to the space. The hall ends in an arched door of light, the same silhouette again.
- **Accessibility of the services.** The visual stage (one service at a time) is `aria-hidden`; a screen-reader-only
  list holds all seven in full, so nobody depends on scroll position to read them. The words are in
  `content.ts` (drafted for the owner's review).
- **The picture is always there first.** `public/immersive/opening-*.webp` (landscape and portrait, ~30 KB each)
  are frames of the real scene and are in the server HTML, so the first paint already looks finished. The live
  canvas takes over in the same framing when it has compiled and drawn its first frames
  (`.immersive-root[data-stage="live"]`). Devices that never get 3D (reduced motion, weak, data-saving) also fetch
  the hall picture, and the two crossfade as you scroll.
  Regenerate all four whenever the scene's look changes: `npm run dev`, then `npm run poster:immersive`.
- **Three tiers** (`lib/tiers.ts`): `full`, `lite`, `static`. Phones are capped at `lite` (fewer segments, no
  dust, no second lattice, ribbon updated at half rate, lower resolution). Weak devices, slow networks, data-saver
  and reduced-motion get `static`: no 3D code is downloaded. If a device can't hold its frame rate the scene steps
  itself down one tier.
- **Reflections are painted, not processed.** `lib/reflection-cubes.ts` draws two small "photo studios" into
  six-face cubes in code (one for the room, a brighter one for the chrome) and the materials read them directly.
  The usual environment helper converts a scene into a blurred reflection map on the graphics card, and compiling
  that step's shaders froze the page for ~2.9 s on a Windows laptop. Shaders are also compiled with the browser's
  parallel-compile support before the first frame (`compileAsync`).
- **No fine texture on big surfaces.** A speckled ceramic map looked fine up close and aliased into a visible mesh at
  a distance. Large surfaces are flat glaze or have crisp tile seams.
- **Load what you need, when you need it.** The 3D chunk and the menu (with Framer Motion) are fetched after the
  first paint (`lib/when-needed.ts`: browser idle, first scroll or first touch, whichever comes first). The
  headline is never hidden or clipped on its first frame, because browsers do not count fully clipped text as
  painted, which delays the first paint on slow phones.

## Useful URLs while testing

- `/immersive?debug` shows the tier the device was given and why, which layer is showing, and the live frame rate.
- `/immersive?poster=1&p=0.95` strips the page to just the scene, frozen, at scroll position `p` (used to make
  the fallback pictures).

## Removing it

Delete `app/(immersive)/`, `features/immersive/`, `public/immersive/`, the `poster:immersive` script and
`scripts/render-immersive-poster.mjs`, and the `tests/*/immersive-*` files. Nothing else depends on them.
