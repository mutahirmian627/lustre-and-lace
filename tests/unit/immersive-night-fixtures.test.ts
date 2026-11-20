import { describe, expect, it } from "vitest";
import { HALL_RIBS, IVORY_RIBS, planFixtures } from "@/features/immersive/lib/night-fixtures";
import { litness } from "@/features/immersive/scene/NightFixtures";
import { DOOR_SIGMA, WORK_END_SIGMA, WORK_STOPS } from "@/features/immersive/lib/timeline";
import { HALL, IVORY, PORTAL, zAt } from "@/features/immersive/lib/world";

/** The plan of the lights after dark: where they are, how many, and in what order they come on. */

const plan = planFixtures();
const everything = [...plan.lamps, ...plan.pools, ...plan.bars];

describe("the plan", () => {
  it("is not crowded: a light every few metres, not a hundred a metre", () => {
    expect(plan.lamps.length).toBeLessThan(260);
    expect(plan.pools.length).toBeLessThan(120);
    expect(plan.bars.length).toBeLessThan(60);
    // Down the corridor: one crown light per rib, one wall light per bay at most.
    const crowns = plan.lamps.filter((lamp) => lamp.zone === "hall" && lamp.position[1] > HALL.straight);
    expect(crowns).toHaveLength(HALL_RIBS.length);
  });

  it("has every delay in 0..1, so the wave of ignition completes", () => {
    for (const item of everything) {
      expect(item.delay).toBeGreaterThanOrEqual(0);
      expect(item.delay).toBeLessThanOrEqual(1);
    }
  });

  it("lights the doorway first, then the corridor from its entrance inwards, then the ivory hall", () => {
    const average = (zone: string) => {
      const these = everything.filter((item) => item.zone === zone);
      return these.reduce((sum, item) => sum + item.delay, 0) / these.length;
    };
    expect(average("gallery")).toBeLessThan(average("hall"));
    expect(average("hall")).toBeLessThan(average("ivory"));
    // Within the corridor, further down comes on later.
    const crowns = plan.lamps.filter((lamp) => lamp.zone === "hall" && lamp.position[1] > HALL.straight).sort((a, b) => b.position[2] - a.position[2]);
    for (let i = 1; i < crowns.length; i++) expect(crowns[i].delay).toBeGreaterThanOrEqual(crowns[i - 1].delay);
  });

  it("keeps every light inside the architecture", () => {
    const hallZ = [zAt(DOOR_SIGMA), zAt(0)];
    for (const lamp of plan.lamps.filter((l) => l.zone === "hall")) {
      expect(Math.abs(lamp.position[0] - PORTAL.x)).toBeLessThanOrEqual(HALL.width / 2);
      expect(lamp.position[1]).toBeGreaterThanOrEqual(0);
      expect(lamp.position[1]).toBeLessThanOrEqual(HALL.straight + HALL.width / 2);
      expect(lamp.position[2]).toBeGreaterThan(hallZ[0]);
      expect(lamp.position[2]).toBeLessThan(hallZ[1]);
    }
    for (const lamp of plan.lamps.filter((l) => l.zone === "ivory")) {
      expect(Math.abs(lamp.position[0] - PORTAL.x)).toBeLessThanOrEqual(IVORY.width / 2);
      expect(lamp.position[2]).toBeLessThan(zAt(DOOR_SIGMA));
      expect(lamp.position[2]).toBeGreaterThan(zAt(DOOR_SIGMA + IVORY.length));
    }
  });

  it("puts a lit line on each rib of the ivory hall, alternating sides", () => {
    const wall = plan.lamps.filter((lamp) => lamp.zone === "ivory" && lamp.position[1] > 1);
    expect(wall).toHaveLength(IVORY_RIBS.length);
    const sides = wall.map((lamp) => Math.sign(lamp.position[0] - PORTAL.x));
    expect(new Set(sides).size).toBe(2);
  });

  it("is the same every time it is made", () => {
    expect(planFixtures()).toEqual(plan);
  });
});

describe("how lit a light is", () => {
  it("is off while the change has not reached it, and fully on at the end, for any place in the wave", () => {
    for (const delay of [0, 0.25, 0.5, 0.75, 1]) {
      expect(litness(0, delay)).toBe(0);
      expect(litness(1, delay)).toBe(1);
    }
  });

  it("comes on in order: an earlier light is never dimmer than a later one", () => {
    for (let f = 0; f <= 1; f += 0.05) {
      for (let delay = 0; delay < 1; delay += 0.1) expect(litness(f, delay)).toBeGreaterThanOrEqual(litness(f, delay + 0.1) - 1e-12);
    }
  });
});

describe("the lanterns", () => {
  const { lanterns } = plan;

  it("are a few, not a ceiling full: one at the gallery doorway pair, one on each plain rib, a handful in the work hall", () => {
    expect(lanterns.length).toBeGreaterThan(10);
    expect(lanterns.length).toBeLessThan(40);
    expect(lanterns.filter((l) => l.zone === "gallery")).toHaveLength(2);
  });

  it("hang inside the architecture, below their chain's top, and clear of the camera's and the ribbon's route down the middle", () => {
    for (const lantern of lanterns.filter((l) => l.zone !== "gallery")) {
      const half = lantern.zone === "hall" ? HALL.width / 2 : IVORY.width / 2;
      const offset = Math.abs(lantern.position[0] - PORTAL.x);
      expect(offset).toBeLessThan(half);
      // Off to the side: nowhere near the camera's lane (the middle, within a metre and a half of the axis).
      expect(offset).toBeGreaterThan(1.5);
      expect(lantern.position[1]).toBeGreaterThan(2.5); // above head height
      const top = lantern.position[1] + lantern.scale * 1.18 + lantern.chain;
      const vault = (lantern.zone === "hall" ? HALL.straight : IVORY.straight) + Math.sqrt(half ** 2 - offset ** 2);
      expect(top).toBeLessThanOrEqual(vault);
    }
  });

  it("light the doorway into the work hall before the first of its own ribs, so the step in is a step into light", () => {
    const entry = lanterns.filter((l) => l.zone === "ivory").sort((a, b) => b.position[2] - a.position[2])[0];
    expect(entry.position[2]).toBeGreaterThan(zAt(DOOR_SIGMA + 8));
    expect(entry.delay).toBeLessThan(0.55);
  });

  it("keep the ribbon's side of the work hall free (the works hang on the right, the ribbon runs between them and the middle)", () => {
    // Along the exhibition (from its first stop to its end) the ribbon runs on the right, so nothing hangs there.
    const along = lanterns.filter((l) => l.zone === "ivory" && l.position[2] < zAt(WORK_STOPS[0] - 2) && l.position[2] > zAt(WORK_END_SIGMA + 1));
    expect(along.length).toBeGreaterThan(0);
    for (const lantern of along) {
      const sideways = lantern.position[0] - PORTAL.x;
      expect(sideways).toBeLessThan(0);
    }
  });
});
