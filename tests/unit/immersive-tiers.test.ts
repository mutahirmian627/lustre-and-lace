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

  it("falls back to pictures only for the things nobody can change: no WebGL 2, reduced motion, data saver", () => {
    expect(classifyTier({ ...desktop, webgl2: false })).toMatchObject({ tier: "static", stillReason: "no-webgl2" });
    expect(classifyTier({ ...desktop, reducedMotion: true })).toMatchObject({ tier: "static", stillReason: "reduced-motion" });
    expect(classifyTier({ ...desktop, saveData: true })).toMatchObject({ tier: "static", stillReason: "save-data" });
  });

  it("never judges by the browser's guess about the network", () => {
    // A browser labels a link '2g' or '3g' from latency alone, and a wrong guess at load once left a capable machine
    // with a dead page for the whole visit. The network label must not change the decision at all.
    for (const effectiveType of ["slow-2g", "2g", "3g", "4g", undefined]) {
      for (const downlink of [0.1, 1, 10, undefined]) {
        expect(classifyTier({ ...desktop, effectiveType, downlink }).tier).toBe("full");
      }
    }
  });

  it("starts modest hardware on the lighter live scene rather than the pictures; the watchdog decides from there", () => {
    expect(classifyTier({ ...desktop, cores: 2 }).tier).toBe("lite");
    expect(classifyTier({ ...desktop, memoryGb: 2 }).tier).toBe("lite");
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

  it("always explains its decision, and names the reason whenever it picks pictures", () => {
    expect(classifyTier(desktop).reason).not.toBe("");
    expect(classifyTier({ ...desktop, webgl2: false }).reason).toMatch(/WebGL/);
    const results = [
      classifyTier({ ...desktop, webgl2: false }),
      classifyTier({ ...desktop, reducedMotion: true }),
      classifyTier({ ...desktop, saveData: true }),
    ];
    for (const result of results) expect(result.stillReason).toBeDefined();
    expect(classifyTier(desktop).stillReason).toBeUndefined();
  });
});

describe("downgradeTier", () => {
  it("steps down one level at a time and stops at static", () => {
    expect(downgradeTier("full")).toBe("lite");
    expect(downgradeTier("lite")).toBe("static");
    expect(downgradeTier("static")).toBe("static");
  });
});
