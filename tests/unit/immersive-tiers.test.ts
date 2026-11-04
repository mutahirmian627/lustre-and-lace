import { describe, expect, it } from "vitest";
import { classifyTier, downgradeTier, type TierSignals } from "@/features/immersive/lib/tiers";

const desktop: TierSignals = {
  webgl2: true,
  reducedMotion: false,
  saveData: false,
  effectiveType: "4g",
  cores: 8,
  memoryGb: 8,
  screenWidth: 1440,
  coarsePointer: false,
  devicePixelRatio: 1,
};

describe("classifyTier", () => {
  it("gives a capable desktop the full scene", () => {
    expect(classifyTier(desktop).tier).toBe("full");
  });

  it("falls back to the static picture without WebGL 2", () => {
    expect(classifyTier({ ...desktop, webgl2: false }).tier).toBe("static");
  });

  it("respects reduced motion and data saver", () => {
    expect(classifyTier({ ...desktop, reducedMotion: true }).tier).toBe("static");
    expect(classifyTier({ ...desktop, saveData: true }).tier).toBe("static");
  });

  it("keeps slow networks off the 3D download", () => {
    for (const effectiveType of ["slow-2g", "2g", "3g"]) {
      expect(classifyTier({ ...desktop, effectiveType }).tier).toBe("static");
    }
    expect(classifyTier({ ...desktop, effectiveType: "4g" }).tier).toBe("full");
  });

  it("treats very weak hardware as static", () => {
    expect(classifyTier({ ...desktop, cores: 2 }).tier).toBe("static");
    expect(classifyTier({ ...desktop, memoryGb: 2 }).tier).toBe("static");
  });

  it("caps phones at the lite scene, however strong they are", () => {
    const phone = { ...desktop, coarsePointer: true, screenWidth: 390, cores: 8, memoryGb: 8 };
    expect(classifyTier(phone).tier).toBe("lite");
  });

  it("gives mid-range hardware the lite scene", () => {
    expect(classifyTier({ ...desktop, cores: 4 }).tier).toBe("lite");
    expect(classifyTier({ ...desktop, memoryGb: 4 }).tier).toBe("lite");
  });

  it("does not guess when a browser hides cores and memory", () => {
    expect(classifyTier({ ...desktop, cores: undefined, memoryGb: undefined }).tier).toBe("full");
  });

  it("always explains its decision", () => {
    expect(classifyTier(desktop).reason).not.toBe("");
    expect(classifyTier({ ...desktop, webgl2: false }).reason).toMatch(/WebGL/);
  });
});

describe("downgradeTier", () => {
  it("steps down one level at a time and stops at static", () => {
    expect(downgradeTier("full")).toBe("lite");
    expect(downgradeTier("lite")).toBe("static");
    expect(downgradeTier("static")).toBe("static");
  });
});
