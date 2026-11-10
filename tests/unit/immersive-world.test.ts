import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { frameFor } from "@/features/immersive/lib/frame";
import {
  ARCHES,
  CLOSE_SIGMA,
  HALL_START_SIGMA,
  hallSigma,
  pace,
  SERVICE_COUNT,
  serviceIndexAt,
  serviceIndexFromSigma,
  smoothstep,
  veilAt,
  DOOR_SIGMA,
  FLIP_SIGMA,
  CONTACT_SIGMA,
  SERVICES_END,
} from "@/features/immersive/lib/timeline";
import {
  cameraCurve,
  hallCameraCurve,
  hallLookCurve,
  HALL,
  journey,
  lookCurve,
  PORTAL,
  ribbonCurve,
  SCREEN_GAP,
  BIG_DOOR,
  IVORY,
  zAt,
} from "@/features/immersive/lib/world";

describe("journey (scroll position -> how far the camera has travelled in the opening)", () => {
  it("holds still at the start so the opening stays put, and rests at the end", () => {
    expect(journey(0)).toBe(0);
    expect(journey(0.015)).toBe(0);
    expect(journey(1)).toBe(1);
    expect(journey(0.95)).toBe(1);
  });

  it("never goes backwards as the visitor scrolls down", () => {
    let previous = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const u = journey(p);
      expect(u).toBeGreaterThanOrEqual(previous);
      previous = u;
    }
  });

  it("has the camera at the doorway while the screen is opening, and inside the hall afterwards", () => {
    expect(cameraCurve.getPointAt(journey(0.3)).z).toBeGreaterThan(-6);
    expect(cameraCurve.getPointAt(journey(0.62)).z).toBeLessThan(-6.8);
  });
});

describe("the ribbon", () => {
  it("begins exactly where the approved opening begins", () => {
    const start = ribbonCurve.getPointAt(0);
    expect([start.x, start.y, start.z]).toEqual([1.3, 6, -1.8]);
  });

  it("threads the gap between the screen's leaves without touching either", () => {
    const length = ribbonCurve.getLength();
    for (let s = 0; s <= length; s += 0.05) {
      const point = ribbonCurve.getPointAt(s / length);
      if (point.z < -6 && point.z > -7) expect(Math.abs(point.x - PORTAL.x)).toBeLessThan(SCREEN_GAP - 0.3);
    }
  });

  it("runs the whole length of the corridor, through every service arch's opening", () => {
    const length = ribbonCurve.getLength();
    for (const arch of ARCHES) {
      let nearest = 99;
      for (let s = 0; s <= length; s += 0.05) {
        const point = ribbonCurve.getPointAt(s / length);
        if (Math.abs(point.z - zAt(arch)) < 0.1) nearest = Math.min(nearest, Math.abs(point.x - PORTAL.x));
      }
      expect(nearest).toBeLessThan(0.3);
    }
  });

  it("moves on its own clock and never reads the scroll", () => {
    // The ribbon's motion must not depend on the scroll in any way: its source may not mention the scroll values.
    const source = readFileSync("features/immersive/scene/Ribbon.tsx", "utf8");
    for (const forbidden of ["stageState.value", "stageState.target", "stageState.sigma", "scrollY", "ScrollTrigger"]) {
      expect(source.includes(forbidden), forbidden).toBe(false);
    }
    expect(source).toContain("state.clock.elapsedTime");
    // The one thing it may read from the camera is where the lens is, to keep clear of it.
    expect(source).toContain("stageState.camera");
  });
});

describe("the camera in the corridor", () => {
  const position = new Vector3();
  const look = new Vector3();

  it("starts exactly where the approved opening ends, so the two routes meet without a seam", () => {
    hallCameraCurve.getPointAt(0, position);
    hallLookCurve.getPointAt(0, look);
    expect(position.distanceTo(cameraCurve.getPointAt(1))).toBeLessThan(0.05);
    expect(look.distanceTo(lookCurve.getPointAt(1))).toBeLessThan(0.05);
  });

  it("glides: no jump in position, and no sudden swing of the view, anywhere along the route", () => {
    const previous = new Vector3();
    const previousLook = new Vector3();
    hallCameraCurve.getPointAt(0, previous);
    hallLookCurve.getPointAt(0, previousLook);
    let previousDirection = previousLook.clone().sub(previous).normalize();
    const steps = 800;
    const metresPerStep = (CLOSE_SIGMA - HALL_START_SIGMA) / steps;
    for (let i = 1; i <= steps; i++) {
      hallCameraCurve.getPointAt(i / steps, position);
      hallLookCurve.getPointAt(i / steps, look);
      expect(position.distanceTo(previous)).toBeLessThan(metresPerStep * 1.5);
      const direction = look.clone().sub(position).normalize();
      // Under 1.3 degrees of turn per 7 cm of travel: gentle enough for a cinematic move.
      expect((Math.acos(Math.min(1, direction.dot(previousDirection))) * 180) / Math.PI).toBeLessThan(1.3);
      previous.copy(position);
      previousDirection = direction;
    }
  });

  it("stays well inside the corridor's walls and under the vault", () => {
    for (let i = 0; i <= 400; i++) {
      hallCameraCurve.getPointAt(i / 400, position);
      expect(Math.abs(position.x - PORTAL.x)).toBeLessThan(HALL.width / 2 - 2);
      expect(position.y).toBeGreaterThan(1);
      expect(position.y).toBeLessThan(2.2);
    }
  });

  it("passes close beside the ribbon at several arches (about a metre), and keeps well clear at others", () => {
    const length = ribbonCurve.getLength();
    const gaps = ARCHES.map((arch) => {
      const u = (arch - HALL_START_SIGMA) / (CLOSE_SIGMA - HALL_START_SIGMA);
      hallCameraCurve.getPointAt(u, position);
      let nearest = 99;
      const point = new Vector3();
      for (let s = 0; s <= length; s += 0.05) {
        ribbonCurve.getPointAt(s / length, point);
        nearest = Math.min(nearest, point.distanceTo(position));
      }
      return nearest;
    });
    // (The ribbon also swings about a metre either way between arches, which the nominal route doesn't show.)
    expect(gaps.filter((gap) => gap < 1.4).length).toBeGreaterThanOrEqual(3);
    expect(Math.min(...gaps)).toBeGreaterThan(0.6);
  });
});

describe("scrolling through the services", () => {
  it("moves the camera steadily forward as the services scroll past, and rests at the end", () => {
    let previous = 0;
    for (let s = 0; s <= 1; s += 0.005) {
      const sigma = hallSigma(s);
      expect(sigma).toBeGreaterThanOrEqual(previous);
      previous = sigma;
    }
    expect(hallSigma(0)).toBe(HALL_START_SIGMA);
    expect(hallSigma(1)).toBeCloseTo(CLOSE_SIGMA, 5);
  });

  it("travels fastest as it passes under an arch and slowest between them: each service is a beat", () => {
    expect(pace(ARCHES[2])).toBeGreaterThan(pace((ARCHES[2] + ARCHES[3]) / 2) + 0.3);
  });

  it("shows every service in order, first to last", () => {
    const seen: number[] = [];
    for (let s = 0; s <= 1; s += 0.002) {
      const index = serviceIndexAt(s);
      if (seen[seen.length - 1] !== index) seen.push(index);
    }
    expect(seen).toEqual(Array.from({ length: SERVICE_COUNT }, (_, i) => i));
  });

  it("brings each service in as its arch comes within 3 m, and keeps it while the camera passes under", () => {
    for (let i = 0; i < ARCHES.length; i++) {
      expect(serviceIndexFromSigma(ARCHES[i] - 2.9)).toBe(i);
      expect(serviceIndexFromSigma(ARCHES[i])).toBe(i);
      expect(serviceIndexFromSigma(ARCHES[i] + 2)).toBe(i);
    }
  });

  it("puts the service arches on the approved opening's rib grid (every 4 m from 2.2)", () => {
    for (const arch of ARCHES) expect(Math.abs((arch - 2.2) / 4 - Math.round((arch - 2.2) / 4))).toBeLessThan(1e-9);
  });
});

describe("frameFor (how the scene is framed for a screen shape)", () => {
  it("uses the wide framing, with the architecture right of centre, on landscape screens", () => {
    const frame = frameFor(16 / 9);
    expect(frame.fov).toBeCloseTo(32, 5);
    expect(frame.vpx).toBeGreaterThan(0.55);
  });

  it("narrows the vertical field of view on screens wider than the reference, like object-fit: cover", () => {
    expect(frameFor(21 / 9).fov).toBeLessThan(frameFor(16 / 9).fov);
  });

  it("switches to the tall framing, centred, on portrait screens", () => {
    const frame = frameFor(390 / 844);
    expect(frame.fov).toBeGreaterThan(32);
    expect(frame.vpx).toBe(0.5);
  });
});

describe("helpers", () => {
  it("smoothstep is 0 below, 1 above and 0.5 halfway", () => {
    expect(smoothstep(0.2, 0.6, 0)).toBe(0);
    expect(smoothstep(0.2, 0.6, 1)).toBe(1);
    expect(smoothstep(0.2, 0.6, 0.4)).toBeCloseTo(0.5, 5);
  });
});

describe("the service arches' lattice veils", () => {
  it("are invisible from the approved opening's camera, so the opening's view down the hall is untouched", () => {
    // Where the opening starts, how far ahead of the camera is each arch (the veil sits in the middle of its 0.34 m rib)?
    const start = cameraCurve.getPointAt(0);
    for (const arch of ARCHES) expect(veilAt(start.z - (zAt(arch) + 0.17)).fade).toBe(0);
  });

  it("show closed as the arch nears, part by the camera's distance, and stay parted behind the camera", () => {
    expect(veilAt(14)).toMatchObject({ fade: 1, open: 0 });
    expect(veilAt(9, 9, 2.6).open).toBe(0);
    expect(veilAt(2.6, 9, 2.6).open).toBe(1);
    expect(veilAt(-5).open).toBe(1);
    let last = -1;
    for (let d = 10; d >= -2; d -= 0.5) {
      const { open } = veilAt(d);
      expect(open).toBeGreaterThanOrEqual(last);
      last = open;
    }
  });

  it("are fully open well before the lens reaches them, so the camera never goes through a closed leaf", () => {
    for (const to of [2.6, 2.8, 3.2, 3.4]) expect(veilAt(to - 0.5, 9, to).open).toBe(1);
    expect(veilAt(1.5).open).toBe(1);
  });
});

describe("the large doorway and the ivory hall", () => {
  const length = ribbonCurve.getLength();
  const inHall = [] as Vector3[];
  for (let s = 0; s <= length; s += 0.05) {
    const point = ribbonCurve.getPointAt(s / length);
    if (point.z < zAt(DOOR_SIGMA)) inHall.push(point);
  }

  it("has the ribbon thread the middle of the large doorway, where the leaves part, and arrive in the ivory hall", () => {
    let nearest = 99;
    for (let s = 0; s <= length; s += 0.02) {
      const point = ribbonCurve.getPointAt(s / length);
      if (Math.abs(point.z - (zAt(DOOR_SIGMA) + 0.17)) < 0.05) nearest = Math.min(nearest, Math.abs(point.x - PORTAL.x));
    }
    expect(nearest).toBeLessThan(0.3);
    expect(inHall.length).toBeGreaterThan(300);
  });

  it("hangs the ribbon as a sculpture inside the room, with its one end on the floor and no part of it through the floor, walls or vault", () => {
    const end = ribbonCurve.getPointAt(1);
    expect(end.y).toBeLessThan(0.25);
    expect(end.y).toBeGreaterThan(0);
    for (const point of inHall) {
      expect(point.y).toBeGreaterThan(0.05);
      expect(Math.abs(point.x - PORTAL.x)).toBeLessThan(IVORY.width / 2 - 1.5);
      expect(point.y).toBeLessThan(IVORY.straight + 1.8);
      expect(point.z).toBeGreaterThan(zAt(DOOR_SIGMA) - IVORY.length + 1);
    }
  });

  it("never runs steeply enough for the strip's width to flip: no stretch within 15 degrees of vertical", () => {
    const first = ribbonCurve.getPointAt(0.5);
    expect(first).toBeDefined();
    for (let u = 0.85; u <= 1; u += 0.001) {
      const tangent = ribbonCurve.getTangentAt(u);
      expect(Math.hypot(tangent.x, tangent.z)).toBeGreaterThan(0.26);
    }
  });

  it("brings the camera through the doorway's middle and to rest where the whole sculpture is in front of it", () => {
    const position = new Vector3();
    const u = (DOOR_SIGMA - HALL_START_SIGMA) / (CLOSE_SIGMA - HALL_START_SIGMA);
    hallCameraCurve.getPointAt(u, position);
    expect(Math.abs(position.x - PORTAL.x)).toBeLessThan(0.3);
    expect(position.y).toBeLessThan(BIG_DOOR.straight);
    hallCameraCurve.getPointAt(1, position);
    let nearest = 99;
    for (const point of inHall) nearest = Math.min(nearest, point.distanceTo(position));
    expect(nearest).toBeGreaterThan(1.2); // at rest the lens is clear of the ribbon, though it passes close overhead on the way in
    for (const point of inHall.filter((p) => p.z < position.z - 3)) expect(point.z).toBeLessThan(position.z);
  });

  it("turns the page from plum to ivory as the camera goes through the doorway, and brings the contact words in after it", () => {
    expect(FLIP_SIGMA[0]).toBeLessThan(DOOR_SIGMA);
    expect(FLIP_SIGMA[1]).toBeGreaterThan(DOOR_SIGMA);
    expect(CONTACT_SIGMA[0]).toBeGreaterThanOrEqual(FLIP_SIGMA[1]);
    expect(CONTACT_SIGMA[1]).toBeLessThanOrEqual(CLOSE_SIGMA);
    // The last scroll position: the page is fully ivory and the contact words are fully there.
    expect(hallSigma(1)).toBeGreaterThanOrEqual(CONTACT_SIGMA[1]);
  });

  it("keeps the stylesheet's idea of where the services end in step with the scroll maths", () => {
    const css = readFileSync("features/immersive/styles/immersive.css", "utf8");
    const declared = Number(/--se:\s*([0-9.]+);/.exec(css)?.[1]);
    expect(declared).toBeCloseTo(SERVICES_END, 3);
  });
});
