/**
 * Decides how much 3D a visitor's device should get.
 *
 *  - "static": no live 3D. The page shows pre-rendered pictures of the scene (see StillJourney).
 *  - "lite":   live WebGL with cheaper rendering (fewer segments, lower resolution, no dust, half-rate ribbon).
 *  - "full":   the complete scene.
 *
 * The rule is deliberately generous. The live scene is the experience; a picture is a last resort. So the only
 * things that put a visitor on the picture straight away are the ones they or their browser cannot change:
 * no WebGL 2, or an explicit request for reduced motion or data saving. Everything else (weak hardware, a slow
 * or distant connection, a phone) starts live, on the lighter tier where it makes sense, and the scene's own
 * frame-rate watchdog steps it down if it truly struggles. A browser's guess about the network is never used:
 * it labels a link from latency alone, and a wrong guess at load used to leave a capable machine with a dead page.
 *
 * The decision is a pure function of a few facts about the device (`classifyTier`), kept separate from
 * reading those facts out of the browser (`readTierSignals`) so the rules can be unit tested.
 */
export type Tier = "static" | "lite" | "full";

/** Why a visitor is looking at pictures, if they are. Shown in the page (`data-stage-reason`) and as a quiet note. */
export type StillReason = "no-webgl2" | "reduced-motion" | "save-data" | "slow-frames" | "error";

export interface TierSignals {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** Network Information API value such as "4g". Shown in the debug badge only; never used to decide. */
  effectiveType?: string;
  /** Estimated bandwidth in Mbit/s. Shown in the debug badge only; never used to decide. */
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
  /** Set when the tier is "static". */
  stillReason?: StillReason;
}

export function classifyTier(s: TierSignals): TierResult {
  if (!s.webgl2) return { tier: "static", reason: "WebGL 2 is not available", stillReason: "no-webgl2" };
  if (s.reducedMotion) return { tier: "static", reason: "Reduced motion is on", stillReason: "reduced-motion" };
  if (s.saveData) return { tier: "static", reason: "Data saver is on", stillReason: "save-data" };

  const phone = s.coarsePointer && s.screenWidth < 768;
  const weak = (s.cores !== undefined && s.cores <= 2) || (s.memoryGb !== undefined && s.memoryGb <= 2);
  const midRange = (s.cores !== undefined && s.cores <= 4) || (s.memoryGb !== undefined && s.memoryGb <= 4);
  if (phone) return { tier: "lite", reason: "Phone" };
  if (weak) return { tier: "lite", reason: "Modest hardware: starts light, the watchdog decides" };
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
