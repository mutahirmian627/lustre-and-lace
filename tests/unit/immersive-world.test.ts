import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { frameFor } from "@/features/immersive/lib/frame";
import { cameraPose, hallScale, newFrame, spineFrame, SPINE_LENGTH } from "@/features/immersive/lib/corridor";
import { makeSpline } from "@/features/immersive/lib/spline";
import { ribbonArcAt, ribbonCurve, RIBBON_ARCH_ARCS, RIBBON_LENGTH } from "@/features/immersive/lib/ribbon-path";
import {
  ARCHES,
  CLOSE_SIGMA,
  DOOR_SIGMA,
  HALL_START_SIGMA,
  hallSigma,
  pace,
  SERVICE_COUNT,
  serviceIndexAt,
  serviceIndexFromSigma,
  smoothstep,
} from "@/features/immersive/lib/timeline";
import { cameraCurve, journey, lookCurve, PORTAL, SCREEN_GAP, HALL } from "@/features/immersive/lib/world";

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
    // The wall is at z = -6 and the hall begins behind it.
    expect(cameraCurve.getPointAt(journey(0.3)).z).toBeGreaterThan(-6);
    expect(cameraCurve.getPointAt(journey(0.62)).z).toBeLessThan(-6.8);
  });
});

describe("the ribbon and the screen", () => {
  it("threads the gap between the screen's leaves without touching either", () => {
    for (let s = 0; s <= RIBBON_LENGTH; s += 0.05) {
      const point = ribbonCurve.getPointAt(s / RIBBON_LENGTH);
      if (point.z < -6 && point.z > -7) expect(Math.abs(point.x - PORTAL.x)).toBeLessThan(SCREEN_GAP - 0.3);
    }
  });

  it("begins exactly where the approved opening begins", () => {
    const start = ribbonCurve.getPointAt(0);
    expect([start.x, start.y, start.z]).toEqual([1.3, 6, -1.8]);
  });
});

describe("the corridor", () => {
  it("runs straight, on the doorway's axis, as far as the opening's view reaches, and then bends gently", () => {
    const frame = newFrame();
    for (let sigma = 0; sigma <= ARCHES[0]; sigma += 0.5) {
      spineFrame(sigma, frame);
      expect(frame.point.x).toBeCloseTo(PORTAL.x, 1);
      expect(frame.tangent.z).toBeLessThan(-0.99);
    }
    // No part of the bend turns the visitor by more than about 28 degrees from straight ahead.
    let widest = 0;
    for (let sigma = 0; sigma <= DOOR_SIGMA; sigma += 0.5) {
      spineFrame(sigma, frame);
      widest = Math.max(widest, Math.acos(-frame.tangent.z));
    }
    expect((widest * 180) / Math.PI).toBeLessThan(28);
    expect(widest).toBeGreaterThan(0.2);
  });

  it("is long enough to hold the door and the camera's resting place", () => {
    expect(SPINE_LENGTH).toBeGreaterThan(DOOR_SIGMA + 2);
    expect(CLOSE_SIGMA).toBeLessThan(DOOR_SIGMA - 6);
  });

  it("opens out only slightly with depth", () => {
    expect(hallScale(0)).toBe(1);
    expect(hallScale(DOOR_SIGMA)).toBeCloseTo(1.2, 5);
  });

  it("keeps the service arches in order, with room for a bay between each", () => {
    for (let i = 1; i < ARCHES.length; i++) expect(ARCHES[i] - ARCHES[i - 1]).toBeGreaterThan(5.5);
    expect(ARCHES[0]).toBeGreaterThan(HALL_START_SIGMA);
  });
});

describe("the camera in the corridor", () => {
  const position = new Vector3();
  const look = new Vector3();
  const pose = { fov: 0, roll: 0 };

  it("starts exactly where the approved opening ends, so the two routes meet without a seam", () => {
    cameraPose(HALL_START_SIGMA, position, look, pose);
    expect(position.distanceTo(cameraCurve.getPointAt(1))).toBeLessThan(0.05);
    expect(look.distanceTo(lookCurve.getPointAt(1))).toBeLessThan(0.3);
    expect(pose.fov).toBe(0);
    expect(pose.roll).toBeCloseTo(0, 3);
  });

  it("glides: no jump in position, and no sudden swing of the view, anywhere along the route", () => {
    const previous = new Vector3();
    const previousLook = new Vector3();
    cameraPose(HALL_START_SIGMA, previous, previousLook, pose);
    let previousDirection = previousLook.clone().sub(previous).normalize();
    for (let sigma = HALL_START_SIGMA + 0.1; sigma <= CLOSE_SIGMA; sigma += 0.1) {
      cameraPose(sigma, position, look, pose);
      expect(position.distanceTo(previous)).toBeLessThan(0.16); // a step of 0.1 m along the route
      const direction = look.clone().sub(position).normalize();
      // Under 0.8 degrees of turn per tenth of a metre: gentle enough for a cinematic move.
      expect((Math.acos(Math.min(1, direction.dot(previousDirection))) * 180) / Math.PI).toBeLessThan(0.8);
      previous.copy(position);
      previousDirection = direction;
    }
  });

  it("stays well inside the corridor's walls, and never tips more than a few degrees", () => {
    const frame = newFrame();
    for (let sigma = HALL_START_SIGMA; sigma <= CLOSE_SIGMA; sigma += 0.25) {
      cameraPose(sigma, position, look, pose);
      spineFrame(sigma, frame);
      const sideways = position.clone().sub(frame.point).dot(frame.right);
      expect(Math.abs(sideways)).toBeLessThan((HALL.width / 2) * hallScale(sigma) - 1.8);
      expect(Math.abs(pose.roll)).toBeLessThan((4 * Math.PI) / 180);
      expect(pose.fov).toBeLessThan(6);
    }
  });

  it("frames each arch differently: the seven moments are not the same shot", () => {
    const seen = ARCHES.map((arch) => {
      cameraPose(arch, position, look, pose);
      const frame = spineFrame(arch);
      return [
        Math.round(position.clone().sub(frame.point).dot(frame.right) * 4) / 4,
        Math.round(position.y * 4) / 4,
        Math.round(pose.fov * 2) / 2,
      ].join("/");
    });
    expect(new Set(seen).size).toBe(ARCHES.length);
  });

  it("keeps the ribbon off the lens: nominally at least a metre away along the whole route", () => {
    // (The scene also eases the ribbon aside before it gets nearer than about two metres.)
    const point = new Vector3();
    for (let sigma = HALL_START_SIGMA; sigma <= CLOSE_SIGMA; sigma += 0.5) {
      cameraPose(sigma, position, look, pose);
      const sCamera = ribbonArcAt(sigma);
      for (let s = sCamera - 0.3; s <= sCamera + 16; s += 0.2) {
        ribbonCurve.getPointAt(Math.min(1, Math.max(0, s / RIBBON_LENGTH)), point);
        expect(point.distanceTo(position)).toBeGreaterThan(0.9);
      }
    }
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

  it("starts on the first service and ends on the last", () => {
    expect(serviceIndexAt(0)).toBe(0);
    expect(serviceIndexAt(1)).toBe(SERVICE_COUNT - 1);
  });

  it("puts the ribbon's turn at each arch where the arch is, in order", () => {
    for (let k = 1; k < ARCHES.length; k++) expect(RIBBON_ARCH_ARCS[k]).toBeGreaterThan(RIBBON_ARCH_ARCS[k - 1]);
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

  it("keeps the same vertical field between the reference and a squarer screen (it crops the sides instead)", () => {
    expect(frameFor(1.2).fov).toBeCloseTo(frameFor(16 / 9).fov, 5);
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

  it("the framing spline passes through its keys and glides between them", () => {
    const f = makeSpline([0, 1, 2], [0, 5, 2]);
    expect(f(0)).toBe(0);
    expect(f(1)).toBeCloseTo(5, 5);
    expect(f(2)).toBe(2);
    expect(f(-1)).toBe(0);
    expect(f(3)).toBe(2);
    expect(f(0.5)).toBeGreaterThan(0);
    expect(f(0.5)).toBeLessThan(5.5);
  });
});
