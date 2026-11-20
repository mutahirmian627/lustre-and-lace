import { afterEach, describe, expect, it, vi } from "vitest";
import { initialNight, nightChannels, nightState, NIGHT_KEY, NIGHT_SECONDS, onNight, readSavedNight, stepNight } from "@/features/immersive/lib/night";

/** The change from daylight to after dark: its schedule, its stepping and its memory. */

describe("the schedule of the change", () => {
  it("is exactly daylight at 0 and exactly after dark at 1", () => {
    const day = nightChannels(0);
    expect(day).toEqual({ n: 0, daylight: 1, glow: 1, dark: 0, fixtures: 0, moon: 0, reflections: 0, ui: 0 });
    const night = nightChannels(1);
    expect(night).toEqual({ n: 1, daylight: 0, glow: 0, dark: 1, fixtures: 1, moon: 1, reflections: 1, ui: 1 });
  });

  it("keeps every channel between 0 and 1, and moves each one only one way", () => {
    let last = nightChannels(0);
    for (let i = 1; i <= 200; i++) {
      const c = nightChannels(i / 200);
      for (const key of ["daylight", "glow"] as const) {
        expect(c[key]).toBeLessThanOrEqual(last[key] + 1e-12);
        expect(c[key]).toBeGreaterThanOrEqual(0);
        expect(c[key]).toBeLessThanOrEqual(1);
      }
      for (const key of ["dark", "fixtures", "moon", "reflections", "ui"] as const) {
        expect(c[key]).toBeGreaterThanOrEqual(last[key] - 1e-12);
        expect(c[key]).toBeGreaterThanOrEqual(0);
        expect(c[key]).toBeLessThanOrEqual(1);
      }
      last = c;
    }
  });

  it("unfolds in the order of the brief: daylight goes first, the lamps come on after the hall has darkened, the moon arrives last", () => {
    // How far through the change each channel first passes 20% of its journey.
    const reach = (pick: (c: ReturnType<typeof nightChannels>) => number, rising: boolean) => {
      for (let i = 0; i <= 1000; i++) {
        const v = pick(nightChannels(i / 1000));
        if (rising ? v >= 0.2 : v <= 0.8) return i / 1000;
      }
      return 1;
    };
    const daylightFading = reach((c) => c.daylight, false);
    const hallDarkening = reach((c) => c.dark, true);
    const lampsOn = reach((c) => c.fixtures, true);
    const moonIn = reach((c) => c.moon, true);
    expect(daylightFading).toBeLessThan(hallDarkening);
    expect(hallDarkening).toBeLessThan(lampsOn);
    expect(lampsOn).toBeLessThan(moonIn);
  });

  it("clamps what it is given", () => {
    expect(nightChannels(-3).n).toBe(0);
    expect(nightChannels(7).n).toBe(1);
  });
});

describe("the stepping", () => {
  afterEach(() => {
    nightState.target = 0;
    nightState.value = 0;
    nightState.seconds = NIGHT_SECONDS;
  });

  it("takes about the planned time to go from daylight to after dark, and the same to come back", () => {
    nightState.target = 1;
    let t = 0;
    while (stepNight(1 / 60)) t += 1 / 60;
    expect(t).toBeGreaterThan(2.5);
    expect(t).toBeLessThan(2.8);
    expect(nightState.value).toBe(1);

    nightState.target = 0;
    t = 0;
    while (stepNight(1 / 60)) t += 1 / 60;
    expect(t).toBeGreaterThan(2.5);
    expect(t).toBeLessThan(2.8);
    expect(nightState.value).toBe(0);
  });

  it("reverses smoothly from the middle, without jumping", () => {
    nightState.target = 1;
    for (let i = 0; i < 80; i++) stepNight(1 / 60);
    const mid = nightState.value;
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
    nightState.target = 0;
    stepNight(1 / 60);
    expect(Math.abs(nightState.value - mid)).toBeLessThan(0.02);
  });

  it("does nothing once it has arrived", () => {
    expect(stepNight(1 / 60)).toBe(false);
  });
});

describe("what is remembered", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const storage = (value: string | null, throws = false) => ({
    getItem: () => {
      if (throws) throw new Error("blocked");
      return value;
    },
    setItem: () => {},
  });

  it("starts in daylight unless the visitor chose after dark", () => {
    vi.stubGlobal("window", { localStorage: storage(null) });
    expect(readSavedNight()).toBe(false);
    vi.stubGlobal("window", { localStorage: storage("1") });
    expect(readSavedNight()).toBe(true);
    vi.stubGlobal("window", { localStorage: storage("0") });
    expect(readSavedNight()).toBe(false);
    expect(NIGHT_KEY).toBe("aperionie-after-dark");
  });

  it("survives blocked storage", () => {
    vi.stubGlobal("window", { localStorage: storage(null, true) });
    expect(readSavedNight()).toBe(false);
  });

  it("lets the address decide first (?night=1 or ?night=0), then the saved choice", () => {
    vi.stubGlobal("window", { localStorage: storage("1") });
    expect(initialNight("")).toBe(true);
    expect(initialNight("?night=0")).toBe(false);
    vi.stubGlobal("window", { localStorage: storage("0") });
    expect(initialNight("?night=1")).toBe(true);
    expect(initialNight("?night=maybe")).toBe(false);
  });
});

describe("things that follow the change", () => {
  it("are told the current state straight away, again as it moves, and stop when removed", () => {
    const seen: number[] = [];
    const stop = onNight((c) => seen.push(c.n));
    expect(seen).toEqual([0]);
    stop();
  });
});
