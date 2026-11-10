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
| Plum lacquer | the hall (the corridor) | deep colour under a hard, glossy reflection |

The ivory ceramic comes back at the end: beyond the corridor's large lattice doorway is a spacious ivory hall.

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
  nothing new is added to the space.
- **Each service arch is an event** (`scene/ArchVeils.tsx`). Every service rib holds a frosted lattice veil like the
  gallery doorway's screen (two leaves, the ribbon's gap down the middle). It is invisible while the arch is far (so the
  approved opening is untouched), shows closed as the arch comes into the near corridor, and parts by the *camera's
  distance from it* (`veilAt` in `lib/timeline.ts`), so it is the visitor's own approach that opens it. Four lattices
  (scale, angle, tint), three ways of parting, slightly different moments, and a glow in each arch's own colour
  (`HallLights.tsx` has the per-arch lamps).
- **The finale: a doorway, an ivory hall, a sculpture.** The corridor ends in a large lattice doorway (the same veil
  machinery, bigger, seen from further away, so the light of the room beyond arrives as you approach). The camera goes
  through it and rests in `scene/IvoryHall.tsx`: a barrel vault in ivory ceramic with a tiled floor, tall lattice windows
  throwing patterned light, and the ribbon, which continues through the doorway and hangs as a loop in the middle of the
  room with one end on the floor (no pedestal). It is still the same ribbon on the same clock; only the route changes
  (`RIBBON_POINTS` in `lib/world.ts`). `scene/EndCurtain.tsx` keeps the far end of the corridor exactly as the approved
  opening has it until the camera is within about 40 m. The page turns from plum to ivory as the camera passes through
  the doorway (`--flip`, set by `ScrollDriver` from the camera's distance down the corridor), and the contact words
  arrive in the ivory hall (`--c`).
- **The exhibition** (`scene/Gallery.tsx`, `lib/gallery.ts`). The studio's one finished project, the demo store, hangs on the
  ivory hall's right wall as its real screenshots (`public/agency`, the same ones the Work page uses): two pages of the
  store, then two phones, then an empty arch lit like an exhibit: "Next exhibit: yours". Nothing is invented. The camera
  makes four stops along the hall (`WORK_STOPS`, slowing nearly to a stand at each), looking at the work on the wall, and
  then turns to the sculpture for the contact. Its route here is keyed by distance (`galleryPose`) rather than being a curve,
  because the view swings sideways. The ribbon runs over each work and dips between them, so it keeps threading the room.
  The screenshots are fetched only once the visitor is well down the corridor. The words are the Work page's own copy
  (`constants/agency.ts`), one stop at a time (`data-work`), with the links reachable only while their stop is on show.
- **The process: five gates** (`scene/IvoryHall.tsx`, `scene/ArchVeils.tsx`). Beyond the exhibition the ivory hall is
  crossed by five walls, each with the great doorway in it (`GATES`): Talk, Plan, Build, Launch, Grow, the studio's own five
  steps (`PROCESS_STEPS` in `constants/agency.ts`). Looking down the hall they stack into an enfilade of nested arches, with
  the sculpture at the end. Each gate holds a lattice veil like the others that parts as the camera comes up, but the
  lattice is broader and the glass lighter at every step, until the last is nearly open: the process as something that
  clears. The ribbon threads each gate's middle, a metre and a half above the camera. The camera stops five metres before
  each gate (`PROCESS_STOPS`) and looks through it; the words follow the stop (`data-process`), as the exhibition's do.
- **The services' index** (`sections/ServiceRail.tsx`): 01-07 are real buttons that scroll to where the camera stands before
  that service's arch (`progressForSigma` inverts the scroll maths). The services show their four points only.
- **Accessibility of the services.** The visual stage (one service at a time) is `aria-hidden`; a screen-reader-only
  list holds all seven in full, so nobody depends on scroll position to read them. The words are in
  `content.ts` (drafted for the owner's review).
- **The live scene is the experience; the picture is a last resort, and never a dead one.** (`lib/tiers.ts`,
  `scene/StageLoader.tsx`) The first paint is a picture of the opening (`public/immersive/opening-*.webp`, in the
  server HTML), and the live canvas takes over in the same framing once it has compiled and drawn
  (`.immersive-root[data-stage="live"]`).
  - **Only three things put a visitor on pictures straight away:** no WebGL 2, reduced motion, data saver. Weak
    hardware, phones and slow or distant connections all start **live**, on the lighter `lite` tier where it makes
    sense. The browser's guess about the network is **never** used: it labels a link from latency alone, and a wrong
    guess at load once left a capable machine on a dead page for the whole visit.
  - **After that it only steps down, by steps, for a real reason:** the frame-rate watchdog moves `full` to `lite`
    (under 30 fps for several seconds, after a 4 s grace), and `lite` to pictures only if even that is under 18 fps. A
    crash in the 3D (`StageBoundary`), a lost graphics context, or a scene that hasn't drawn within 30 s also fall back.
  - **None of it is silent or permanent.** `data-stage-reason` says why, a quiet note says it to the visitor, and a
    button ("Play 3D" / "Try 3D again", `StillNote`) starts the live scene again on the lighter tier.
  - **The fallback is itself in motion** (`sections/StillJourney.tsx`): 60 frames of the real scene along the whole
    journey (`public/immersive/journey/`, each device loads only its own landscape or portrait cut), played by scroll,
    cross-faded, and never still: the picture drifts and breathes and follows the pointer (switched off for reduced
    motion). Only the ribbon's own movement is missing. Regenerate with `npm run dev`, then
    `npm run poster:immersive` and `npm run journey:immersive`.
- **Two tiers of live 3D** (`full` and `lite`): phones and modest hardware start on `lite` (fewer segments, no dust,
  no second lattice, ribbon updated at half rate, lower resolution).
- **A smoke test for exactly this.** `npm run check:immersive -- <url>` loads a running or deployed site several times
  and fails unless every load reaches the live scene and is moving on its own (no scrolling, no pointer) at the opening
  and deep in the corridor. The e2e suite checks the same on every run. Use it on the hosted build before calling
  anything ready.
- **Accessibility, and how it is kept** (`tests/e2e/immersive-a11y.spec.ts`, `scripts/check-immersive-layout.mjs`):
  - The visual words are mostly `aria-hidden`; the same words are in screen-reader-only sections (services, work, process),
    so no one depends on scroll position. Real controls (the 01-07 index, the exhibition's links, the contact) are never inside
    an `aria-hidden` block, and the ones for a stop that is not on show are `visibility: hidden`, so the keyboard only ever
    lands on something visible. The page's one `h1` stays in the accessibility tree at every scroll position.
  - An axe scan (WCAG 2.2 AA + best practice) runs at the opening, approach, services, corridor's end, exhibition, process
    and contact, on a laptop and a phone, plus the open menu. Controls are at least 44 px tall.
  - `npm run check:immersive-layout` visits every stop (services, work, process, contact...) on 14 screen shapes, from a
    320 px phone to a 1920 px desktop, including phones on their side and desktops zoomed to 200%, and fails if any line of
    text is off the screen, under the bar or under the preview label, or if the page scrolls sideways. Short screens
    (`max-height: 520px`) put the words in a column at the left with their large headings left out.
  - Reduced motion shows the pictures (never a dead page) with a way back to the live scene; the stops' transitions stop too.
  - The gallery captions ("Fig. 01...") are decoration and are shown only from 1280 px wide, where they fit beside the art.
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

Delete `app/(immersive)/`, `features/immersive/`, `public/immersive/`, the `poster:immersive`, `journey:immersive` and `check:immersive` scripts and
`scripts/render-immersive-poster.mjs`, and the `tests/*/immersive-*` files. Nothing else depends on them.
