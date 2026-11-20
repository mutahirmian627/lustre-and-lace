import { describe, expect, it } from "vitest";
import { CatBrain, PEEK, catAnchor, clampToArchitecture, exhibitPull, type CatInput } from "@/features/immersive/lib/cat";
import { DOOR_SIGMA, WORK_END_SIGMA, WORK_STOPS } from "@/features/immersive/lib/timeline";
import { PORTAL, WALL, zAt } from "@/features/immersive/lib/world";

/** The cat: where it hides, where it stands, when it walks, when it sits, and the room the camera makes for it at the exhibition. */

/** A camera standing in the gallery as the page opens, looking at the doorway. */
const opening: CatInput = { travelX: 0.1, travelZ: 7.6, lookX: 1.55, lookZ: -6, camY: 1.5, lookY: 1.85, pull: 0 };
/** A camera standing in the corridor, looking down it. */
const hall = (z = -20): CatInput => ({ travelX: 2.2, travelZ: z, lookX: 2.2, lookZ: z - 14, camY: 1.5, lookY: 1.9, pull: 0 });
const walking = (from: number, speed: number) => (t: number) => hall(from - t * speed);
/** The camera walking in from the gallery down the corridor at 3 m/s. */
const walkingIn = (t: number): CatInput => ({ travelX: 2.0, travelZ: 7.6 - t * 3, lookX: 2.2, lookZ: 7.6 - t * 3 - 14, camY: 1.5, lookY: 1.9, pull: 0 });
const run = (brain: CatBrain, seconds: number, input: (t: number) => CatInput) => {
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) brain.step(dt, input(t));
};

describe("where the cat hides at the start", () => {
  it("is inside the alley, beyond the doorway, not in front of us in the gallery", () => {
    const brain = new CatBrain();
    run(brain, 2, () => opening);
    expect(brain.pose.z).toBeLessThan(WALL.z - WALL.depth);
    expect(brain.pose.x).toBeCloseTo(PEEK.x, 1);
    expect(brain.pose.peek).toBeGreaterThan(0.95);
    // Sitting, facing the camera, a long way off, and drawn larger for it.
    expect(brain.pose.sit).toBeGreaterThan(0.95);
    expect(brain.pose.scale).toBeGreaterThan(1.4);
  });

  it("hides behind the doorway's left jamb as seen from where the camera starts: the wall cuts it in two", () => {
    // The line from the camera past the jamb's front edge (the doorway's left side, x = 0.7 at the wall's front face).
    const jambX = PORTAL.x - PORTAL.width / 2;
    const slope = (jambX - opening.travelX) / (opening.travelZ - WALL.z);
    const edgeAtCat = jambX + slope * (WALL.z - PEEK.z);
    // The cat is about 0.6 m wide at normal size (more at the size it is drawn here): the edge falls through it, so some of it shows.
    expect(PEEK.x - 0.3).toBeLessThan(edgeAtCat);
    expect(PEEK.x + 0.3).toBeGreaterThan(edgeAtCat);
  });

  it("stays there while the camera comes towards it, until the camera is near", () => {
    const brain = new CatBrain();
    run(brain, 1, () => opening);
    // The camera walks 7.5 m in through the gallery (still further from the cat than its usual distance from the camera).
    run(brain, 3, (t) => ({ ...opening, travelX: 0.1 + t * 0.3, travelZ: 7.6 - t * 2.5, lookZ: 7.6 - t * 2.5 - 14 }));
    expect(brain.pose.peek).toBeGreaterThan(0.6);
    expect(Math.abs(brain.pose.z - PEEK.z)).toBeLessThan(3);
  });

  it("leaves when the camera has come close, and walks on ahead of it, away from us", () => {
    const brain = new CatBrain();
    run(brain, 1, () => opening);
    run(brain, 8, walkingIn);
    const p = brain.pose;
    expect(p.peek).toBeLessThan(0.05);
    expect(p.walking).toBe(true);
    expect(Math.abs(Math.abs(p.yaw) - Math.PI)).toBeLessThan(0.3);
    expect(p.z).toBeLessThan(7.6 - 8 * 3 - 3);
  });

  it("goes back to its hiding place if the visitor scrolls back to the top", () => {
    const brain = new CatBrain();
    run(brain, 1, () => opening);
    run(brain, 6, walkingIn);
    run(brain, 8, (t) => walkingIn(6 - t));
    run(brain, 4, () => opening);
    expect(brain.pose.peek).toBeGreaterThan(0.9);
  });
});

describe("where the cat stands once it is out", () => {
  it("is ahead of the camera, along its view", () => {
    const a = catAnchor(hall());
    expect(a.z).toBeLessThan(-20 - 4);
    expect(a.z).toBeGreaterThan(-20 - 18);
  });

  it("stands further off when the camera is tipped up, so its feet stay at the same place in the view", () => {
    const level = catAnchor({ ...hall(), lookY: 1.5 });
    const tipped = catAnchor({ ...hall(), lookY: 2.6 });
    expect(tipped.distance).toBeGreaterThan(level.distance);
  });

  it("stands between the nearest and furthest it is allowed, and is drawn larger the further it stands", () => {
    const near = catAnchor({ ...hall(), lookY: -3 });
    const far = catAnchor({ ...hall(), lookY: 9 });
    expect(near.distance).toBeGreaterThanOrEqual(4.8);
    expect(far.distance).toBeLessThanOrEqual(17);
    expect(far.scale).toBeGreaterThan(near.scale);
  });

  it("is kept inside the architecture it is walking through", () => {
    for (let z = zAt(2); z > zAt(DOOR_SIGMA - 1); z -= 3) expect(Math.abs(clampToArchitecture(PORTAL.x + 9, z) - PORTAL.x)).toBeLessThanOrEqual(2.3 + 1e-9);
    expect(Math.abs(clampToArchitecture(PORTAL.x + 5, WALL.z + 0.3) - PORTAL.x)).toBeLessThanOrEqual(1.0 + 1e-9);
    expect(clampToArchitecture(PORTAL.x + 9, zAt(DOOR_SIGMA + 20))).toBeLessThan(PORTAL.x + 6);
  });
});

describe("the room the camera makes for it", () => {
  it("is none in the gallery, the corridor and the sculpture's end, and full along the exhibition", () => {
    expect(exhibitPull(7.6, 0.5)).toBe(0);
    expect(exhibitPull(30, 1.3)).toBe(0);
    expect(exhibitPull(WORK_STOPS[0], 1.5)).toBe(1);
    expect(exhibitPull(WORK_STOPS[WORK_STOPS.length - 1], 1.9)).toBe(1);
    expect(exhibitPull(WORK_END_SIGMA + 10, 1.95)).toBe(0);
  });

  it("eases in and out, never jumping", () => {
    let last = exhibitPull(WORK_STOPS[0] - 8, 1.5);
    for (let sigma = WORK_STOPS[0] - 8; sigma < WORK_END_SIGMA + 6; sigma += 0.1) {
      const now = exhibitPull(sigma, 1.5);
      expect(Math.abs(now - last)).toBeLessThan(0.08);
      last = now;
    }
  });
});

describe("what it does in the corridor", () => {
  it("sits facing the viewer when the camera is still", () => {
    const brain = new CatBrain();
    run(brain, 3, () => hall());
    const p = brain.pose;
    expect(p.sit).toBeGreaterThan(0.95);
    expect(p.walking).toBe(false);
    expect(p.peek).toBeLessThan(0.01);
    const toCamera = Math.atan2(2.2 - p.x, -20 - p.z);
    expect(Math.abs(Math.atan2(Math.sin(p.yaw - toCamera), Math.cos(p.yaw - toCamera)))).toBeLessThan(0.1);
  });

  it("stands up and walks away, seen from behind, while the camera travels", () => {
    const brain = new CatBrain();
    run(brain, 2, () => hall());
    run(brain, 2, walking(-20, 3));
    const p = brain.pose;
    expect(p.sit).toBeLessThan(0.1);
    expect(p.walking).toBe(true);
    expect(Math.abs(Math.abs(p.yaw) - Math.PI)).toBeLessThan(0.15);
    expect(-20 - 2 * 3 - p.z).toBeGreaterThan(3);
  });

  it("takes steps as it covers ground, more of them the faster it goes", () => {
    const slow = new CatBrain();
    const fast = new CatBrain();
    run(slow, 1, () => hall());
    run(fast, 1, () => hall());
    run(slow, 3, walking(-20, 1.5));
    run(fast, 3, walking(-20, 5));
    expect(fast.pose.phase).toBeGreaterThan(slow.pose.phase);
    expect(slow.pose.phase).toBeGreaterThan(5);
  });

  it("when the camera stops, waits a moment, turns round to face the viewer, and sits again", () => {
    const brain = new CatBrain();
    run(brain, 1, () => hall());
    run(brain, 2, walking(-20, 3));
    const stopped = hall(-26);
    run(brain, 0.3, () => stopped);
    expect(brain.pose.sit).toBeLessThan(0.6);
    run(brain, 3, () => stopped);
    expect(brain.pose.sit).toBeGreaterThan(0.95);
    expect(brain.pose.walking).toBe(false);
  });

  it("does not walk because of small movements, such as the pointer's nudge of the lens", () => {
    const brain = new CatBrain();
    run(brain, 1, () => hall());
    run(brain, 3, (t) => ({ ...hall(), travelX: 2.2 + Math.sin(t * 2) * 0.05 }));
    expect(brain.pose.sit).toBeGreaterThan(0.95);
  });
});
