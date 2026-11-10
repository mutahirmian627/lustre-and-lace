/**
 * Decides how much 3D a visitor's device should get.
 *
 *  - "static": no WebGL at all. The page shows a pre-rendered picture of the gem.
 *  - "lite":   WebGL with cheaper rendering (no antialiasing, lower resolution, simpler lighting).
 *  - "full":   the complete scene.
 *
 * The decision is a pure function of a few facts about the device (`classifyTier`), kept separate from
 * reading those facts out of the browser (`readTierSignals`) so the rules can be unit tested.
 */
export type Tier = "static" | "lite" | "full";

export interface TierSignals {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** Network Information API value such as "4g" or "3g". Undefined where the browser doesn't expose it. */
  effectiveType?: string;
  /** Estimated bandwidth in Mbit/s (Network Information API). Undefined where the browser doesn't expose it. */
  downlink?: number;
  /** Logical CPU cores. Undefined where hidden. */
  cores?: number;
  /** Approximate device memory in GB (Chrome/Android only). */
  memoryGb?: number;
  screenWidth: number;
  /** True for touch-first devices (phones and tablets). */
  coarsePointer: boolean;
  devicePixelRatio: number;
}

export interface TierResult {
  tier: Tier;
  /** A short human-readable explanation, shown in the ?debug badge. */
  reason: string;
}

export function classifyTier(s: TierSignals): TierResult {
  if (!s.webgl2) return { tier: "static", reason: "WebGL 2 is not available" };
  if (s.reducedMotion) return { tier: "static", reason: "Reduced motion is on" };
  if (s.saveData) return { tier: "static", reason: "Data saver is on" };
  if (s.effectiveType && /^(slow-2g|2g)$/.test(s.effectiveType)) {
    return { tier: "static", reason: `Slow network (${s.effectiveType})` };
  }
  // Browsers label a link "3g" from its latency alone, so a fast connection to a distant server can look like one.
  // Only treat it as slow if its bandwidth is low too (the 3D code is about a third of a megabyte).
  if (s.effectiveType === "3g" && (s.downlink === undefined || s.downlink < 1.5)) {
    return { tier: "static", reason: `Slow network (3g, ${s.downlink ?? "?"} Mbps)` };
  }
  if ((s.cores !== undefined && s.cores <= 2) || (s.memoryGb !== undefined && s.memoryGb <= 2)) {
    return { tier: "static", reason: "Low-end device" };
  }

  const phone = s.coarsePointer && s.screenWidth < 768;
  const midRange = (s.cores !== undefined && s.cores <= 4) || (s.memoryGb !== undefined && s.memoryGb <= 4);
  if (phone) return { tier: "lite", reason: "Phone" };
  if (midRange) return { tier: "lite", reason: "Mid-range device" };

  return { tier: "full", reason: "Capable desktop-class device" };
}

/** One step down, used when the scene can't hold its frame rate. */
export function downgradeTier(tier: Tier): Tier {
  return tier === "full" ? "lite" : "static";
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string; downlink?: number };
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Hand the context straight back: browsers only allow a handful per page.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Reads the facts `classifyTier` needs. Browser only. */
export function readTierSignals(): TierSignals {
  const nav = navigator as NavigatorWithHints;
  return {
    webgl2: supportsWebGL2(),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    effectiveType: nav.connection?.effectiveType,
    downlink: nav.connection?.downlink,
    cores: nav.hardwareConcurrency || undefined,
    memoryGb: nav.deviceMemory,
    screenWidth: window.innerWidth,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}
