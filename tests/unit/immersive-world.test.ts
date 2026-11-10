import { describe, expect, it } from "vitest";
import { frameFor } from "@/features/immersive/lib/frame";
import { cameraCurve, journey, ribbonCurve, smoothstep, SCREEN_GAP, PORTAL } from "@/features/immersive/lib/world";

describe("journey (scroll position -> how far the camera has travelled)", () => {
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
    // Sample the ribbon where it passes through the wall (z between -7 and -6).
    for (let u = 0; u <= 1; u += 0.002) {
      const point = ribbonCurve.getPointAt(u);
      if (point.z < -6 && point.z > -7) expect(Math.abs(point.x - PORTAL.x)).toBeLessThan(SCREEN_GAP - 0.3);
    }
  });

  it("stays well above the camera inside the hall, so the camera never passes through it", () => {
    // Where the ribbon is, as height by depth, sampled finely along its length.
    const ribbon = Array.from({ length: 800 }, (_, i) => ribbonCurve.getPointAt(i / 799));
    for (let p = 0.5; p <= 1; p += 0.01) {
      const camera = cameraCurve.getPointAt(journey(p));
      if (camera.z > -7) continue;
      const nearest = ribbon.reduce((best, point) => (Math.abs(point.z - camera.z) < Math.abs(best.z - camera.z) ? point : best));
      expect(nearest.y - camera.y).toBeGreaterThan(0.7);
    }
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

describe("smoothstep", () => {
  it("is 0 below, 1 above and 0.5 halfway", () => {
    expect(smoothstep(0.2, 0.6, 0)).toBe(0);
    expect(smoothstep(0.2, 0.6, 1)).toBe(1);
    expect(smoothstep(0.2, 0.6, 0.4)).toBeCloseTo(0.5, 5);
  });
});
