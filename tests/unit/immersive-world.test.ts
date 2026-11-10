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
  THRESHOLD_END_SIGMA,
  WORK_STOPS,
  WORK_COUNT,
  WORK_END_SIGMA,
  WORK_SIGMA,
  WORK_REACH,
  GATES,
  PROCESS_STOPS,
  PROCESS_SIGMA,
  PROCESS_COUNT,
  processIndexFromSigma,
  progressForSigma,
  workIndexFromSigma,
} from "@/features/immersive/lib/timeline";
import { WALL_X, galleryPose } from "@/features/immersive/lib/gallery";
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
    const metresPerStep = (THRESHOLD_END_SIGMA - HALL_START_SIGMA) / steps;
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
      const u = (arch - HALL_START_SIGMA) / (THRESHOLD_END_SIGMA - HALL_START_SIGMA);
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

  it("brings the camera through the doorway's middle, and to rest where the whole sculpture is in front of it", () => {
    const position = new Vector3();
    const u = (DOOR_SIGMA - HALL_START_SIGMA) / (THRESHOLD_END_SIGMA - HALL_START_SIGMA);
    hallCameraCurve.getPointAt(u, position);
    expect(Math.abs(position.x - PORTAL.x)).toBeLessThan(0.3);
    expect(position.y).toBeLessThan(BIG_DOOR.straight);
    const rest = galleryPose(CLOSE_SIGMA);
    position.set(rest.x, rest.y, zAt(CLOSE_SIGMA));
    let nearest = 99;
    for (const point of inHall) nearest = Math.min(nearest, point.distanceTo(position));
    expect(nearest).toBeGreaterThan(1.2); // at rest the lens is clear of the ribbon
    // And the sculpture, the part of the ribbon that is a loop, is in front of the camera, not beside or behind it.
    for (const point of inHall.filter((p) => p.z < zAt(CLOSE_SIGMA + 5))) expect(point.z).toBeLessThan(position.z);
  });

  it("turns the page from plum to ivory as the camera goes through the doorway, and brings the contact words in after it", () => {
    expect(FLIP_SIGMA[0]).toBeLessThan(DOOR_SIGMA);
    expect(FLIP_SIGMA[1]).toBeGreaterThan(DOOR_SIGMA);
    expect(CONTACT_SIGMA[0]).toBeGreaterThanOrEqual(FLIP_SIGMA[1]);
    expect(CONTACT_SIGMA[1]).toBeLessThanOrEqual(CLOSE_SIGMA);
    expect(CONTACT_SIGMA[0]).toBeGreaterThanOrEqual(PROCESS_SIGMA[3]);
    // The last scroll position: the page is fully ivory and the contact words are fully there.
    expect(hallSigma(1)).toBeGreaterThanOrEqual(CONTACT_SIGMA[1]);
  });

  it("keeps the stylesheet's idea of where the services end in step with the scroll maths", () => {
    const css = readFileSync("features/immersive/styles/immersive.css", "utf8");
    const declared = Number(/--se:\s*([0-9.]+);/.exec(css)?.[1]);
    expect(declared).toBeCloseTo(SERVICES_END, 3);
  });
});

describe("the exhibition", () => {
  it("makes four stops, one work each, in order, and shows each stop's words once", () => {
    expect(WORK_COUNT).toBe(4);
    const seen: number[] = [];
    for (let s = 0; s <= 1; s += 0.001) {
      const index = workIndexFromSigma(hallSigma(s));
      if (index >= 0 && seen[seen.length - 1] !== index) seen.push(index);
    }
    expect(seen).toEqual([0, 1, 2, 3]);
    expect(workIndexFromSigma(THRESHOLD_END_SIGMA - 1)).toBe(-1);
  });

  it("slows nearly to a stand at each stop and walks on between them", () => {
    const speed = (sigma: number) => {
      const s = progressForSigma(sigma);
      return (hallSigma(s + 0.0005) - hallSigma(s - 0.0005)) / 0.001;
    };
    for (let i = 0; i < WORK_STOPS.length - 1; i++) {
      const middle = (WORK_STOPS[i] + WORK_STOPS[i + 1]) / 2;
      expect(speed(WORK_STOPS[i])).toBeLessThan(speed(middle) * 0.6);
    }
  });

  it("finds the scroll position for a distance down the hall, and back again", () => {
    for (const sigma of [12, 30, 58, 72, 80, 95, 103]) expect(hallSigma(progressForSigma(sigma))).toBeCloseTo(sigma, 2);
  });

  it("joins the corridor's route without a seam, and glides along the hall", () => {
    const corridor = new Vector3();
    const corridorLook = new Vector3();
    hallCameraCurve.getPointAt(1, corridor);
    hallLookCurve.getPointAt(1, corridorLook);
    const pose = galleryPose(THRESHOLD_END_SIGMA);
    expect(Math.hypot(pose.x - corridor.x, pose.y - corridor.y)).toBeLessThan(0.05);
    expect(Math.hypot(pose.lx - corridorLook.x, pose.ly - corridorLook.y, zAt(pose.lsigma) - corridorLook.z)).toBeLessThan(0.3);

    let previous = new Vector3();
    let previousDirection = new Vector3();
    for (let sigma = THRESHOLD_END_SIGMA; sigma <= CLOSE_SIGMA; sigma += 0.05) {
      const p = galleryPose(sigma);
      const position = new Vector3(p.x, p.y, zAt(sigma));
      const direction = new Vector3(p.lx, p.ly, zAt(p.lsigma)).sub(position).normalize();
      if (sigma > THRESHOLD_END_SIGMA) {
        expect(position.distanceTo(previous)).toBeLessThan(0.08);
        // No sudden swing of the view: under 3.5 degrees per 5 cm of walking (the turn to the sculpture is the quickest).
        expect((Math.acos(Math.min(1, direction.dot(previousDirection))) * 180) / Math.PI).toBeLessThan(3.5);
      }
      previous = position;
      previousDirection = direction;
    }
  });

  it("looks at the work on the wall at each stop, and keeps the camera clear of the walls and the ribbon", () => {
    for (const stop of WORK_STOPS) {
      const pose = galleryPose(stop);
      expect(pose.lx).toBeCloseTo(WALL_X, 0);
      expect(Math.abs(pose.lsigma - (stop + WORK_REACH))).toBeLessThan(1);
      expect(pose.y).toBeGreaterThan(1.3);
      expect(pose.y).toBeLessThan(1.9);
    }
    const length = ribbonCurve.getLength();
    const ribbon: Vector3[] = [];
    for (let s = 0; s <= length; s += 0.05) ribbon.push(ribbonCurve.getPointAt(s / length));
    for (let sigma = THRESHOLD_END_SIGMA; sigma <= CLOSE_SIGMA; sigma += 0.25) {
      const pose = galleryPose(sigma);
      expect(Math.abs(pose.x - PORTAL.x)).toBeLessThan(1.2);
      const position = new Vector3(pose.x, pose.y, zAt(sigma));
      let nearest = 99;
      for (const point of ribbon) if (Math.abs(point.z - position.z) < 3) nearest = Math.min(nearest, point.distanceTo(position));
      expect(nearest).toBeGreaterThan(1.1); // the ribbon also sways about a quarter of a metre
    }
  });

  it("ends the exhibition at the last stop and turns to the sculpture in the close", () => {
    expect(WORK_END_SIGMA).toBe(WORK_STOPS[WORK_STOPS.length - 1]);
    expect(hallSigma(1)).toBeCloseTo(CLOSE_SIGMA, 5);
    expect(WORK_SIGMA[3]).toBeGreaterThan(WORK_END_SIGMA);
  });
});

describe("the process", () => {
  it("has five gates down the ivory hall, each with a stop five metres before it, and shows each step once, in order", () => {
    expect(PROCESS_COUNT).toBe(5);
    expect(GATES.length).toBe(5);
    PROCESS_STOPS.forEach((stop, i) => expect(GATES[i] - stop).toBe(5));
    const seen: number[] = [];
    for (let s = 0; s <= 1; s += 0.001) {
      const index = processIndexFromSigma(hallSigma(s));
      if (index >= 0 && seen[seen.length - 1] !== index) seen.push(index);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4]);
  });

  it("keeps the gates between the exhibition and the sculpture, inside the room, clear of the works", () => {
    expect(GATES[0] - 3).toBeGreaterThan(WORK_END_SIGMA + 3);
    for (const gate of GATES) {
      expect(gate).toBeLessThan(DOOR_SIGMA + IVORY.length - 15);
    }
    const sculpture = ribbonCurve.getPointAt(1);
    expect(sculpture.z).toBeLessThan(zAt(GATES[GATES.length - 1] + 3));
  });

  it("threads the ribbon through the middle of every gate, a metre and a half above the camera, and the camera through the opening", () => {
    const length = ribbonCurve.getLength();
    for (const gate of GATES) {
      let nearest = 99;
      let height = 0;
      for (let s = 0; s <= length; s += 0.02) {
        const point = ribbonCurve.getPointAt(s / length);
        if (Math.abs(point.z - (zAt(gate) + 0.17)) < 0.05 && Math.abs(point.x - PORTAL.x) < nearest) {
          nearest = Math.abs(point.x - PORTAL.x);
          height = point.y;
        }
      }
      expect(nearest).toBeLessThan(0.3);
      expect(height).toBeGreaterThan(2.9);
      expect(height).toBeLessThan(BIG_DOOR.straight + 0.2);
      const pose = galleryPose(gate);
      expect(Math.abs(pose.x - PORTAL.x)).toBeLessThan(BIG_DOOR.width / 2 - 1.2);
      expect(pose.y).toBeLessThan(2);
    }
  });

  it("brings in the words of each step with its gate, and the contact words after the last", () => {
    expect(PROCESS_SIGMA[0]).toBeGreaterThan(WORK_SIGMA[3]);
    expect(PROCESS_SIGMA[1]).toBeLessThanOrEqual(PROCESS_STOPS[0]);
    expect(PROCESS_SIGMA[3]).toBeLessThanOrEqual(CONTACT_SIGMA[0]);
    expect(CONTACT_SIGMA[1]).toBeLessThanOrEqual(CLOSE_SIGMA);
  });
});
