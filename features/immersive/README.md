# Immersive experience (experiment)

A 3D, scroll-driven version of the studio homepage. It lives at `/immersive` on the `feature/immersive`
branch and is **not linked from anywhere and not indexed** until it is approved to replace `/`.

Nothing here touches the live site: its styles are scoped to `.immersive-root`, its constants are in
`constants.ts`, and the route has its own layout (`app/(immersive)/`).

## How it fits together

```
app/(immersive)/immersive/page.tsx   the page; assembles the sections
features/immersive/
  sections/   Plain HTML (React server components): hero, services, contact.
              Real text and links, so search engines and screen readers see everything.
  stage/      The 3D. One canvas, loaded lazily. Gem.tsx is the object, StageCanvas.tsx the scene and
              lighting, GemStage.tsx decides picture-or-3D and mounts the canvas.
  lib/        tiers.ts (device sorting), gem-geometry.ts (the gem, built from numbers), pointer.ts.
  hooks/      useDeviceTier, useQueryFlag.
  styles/     immersive.css: the paper-and-plum look.
```

## Ideas worth knowing

- **HTML decides layout, 3D follows.** The gem is attached to a normal page element (the "anchor",
  `#gem-anchor`). Every frame the scene reads that element's on-screen box and puts the gem there. So
  CSS and Tailwind control where the gem sits at every screen size.
- **Three tiers** (`lib/tiers.ts`): `full`, `lite`, `static`. Phones are capped at `lite`. Weak devices, slow
  networks, data-saver and reduced-motion get `static`: a pre-rendered picture, no 3D code downloaded.
  If a device can't hold its frame rate the scene steps itself down.
- **The picture is always there first.** `public/immersive/gem-poster.png` shows instantly; the live gem
  fades in over it once the browser is idle. Regenerate it whenever the gem's look changes:
  `npm run dev` in one terminal, then `npm run poster:immersive`.
- **Reflections are painted, not processed.** `lib/studio-cube.ts` draws a small studio (panels of light at
  chosen directions) into a six-face cube in code, and the gem's materials read it directly. The usual
  environment helper converts a scene into a blurred reflection map on the graphics card, and compiling that
  step's shaders froze the page for ~2.9 s on a Windows laptop. A near-mirror gem doesn't need the blur,
  and this version freezes it for ~0.3 s. If you change the lighting, edit the `PANELS` list there.
- **Load what you need, when you need it.** The 3D chunk, the menu (and Framer Motion) and GSAP are all
  fetched after the first paint (`lib/when-needed.ts`: browser idle, first scroll or first touch, whichever
  comes first). The headline is never hidden or clipped on its first frame, because browsers do not count
  fully clipped text as painted, which delays the first paint on slow phones.
- **One number drives the mood.** `--atmosphere` (0 paper, 1 plum night) is updated by GSAP ScrollTrigger
  as you scroll; every colour on the page is mixed from it in CSS. Scrolling itself stays native.

## Useful URLs while testing

- `/immersive?debug` shows what tier the device was given and why (handy on a real phone).
- `/immersive?poster=1` strips the page to just the gem, used to render the fallback picture.

## Removing it

Delete `app/(immersive)/`, `features/immersive/`, `public/immersive/`, the `poster:immersive` script and
`scripts/render-immersive-poster.mjs`. Nothing else depends on them.
