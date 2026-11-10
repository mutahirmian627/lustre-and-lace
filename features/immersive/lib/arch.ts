import { Path, Shape } from "three";

/**
 * The arch: a rectangle of height `straight` with a semicircle on top, so its total height is
 * `straight + width / 2`. Everything architectural in the installation (the portal, the hall, the ribs,
 * the screen) is this one silhouette at different sizes, which is what keeps it feeling like one building.
 */

/** A closed arch outline standing on y = 0, centred on x = 0. */
export function archShape(width: number, straight: number): Shape {
  const r = width / 2;
  const shape = new Shape();
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, straight);
  shape.absarc(0, straight, r, 0, Math.PI, false);
  shape.lineTo(-r, 0);
  return shape;
}

/** The same outline as a hole to cut out of another shape, moved to `x`. */
export function archHole(width: number, straight: number, x = 0): Path {
  const r = width / 2;
  const hole = new Path();
  hole.moveTo(x - r, 0);
  hole.lineTo(x - r, straight);
  hole.absarc(x, straight, r, Math.PI, 0, true);
  hole.lineTo(x + r, 0);
  hole.lineTo(x - r, 0);
  return hole;
}

/** A flat rectangle with an arch cut out of it: a wall with a doorway. */
export function wallWithArch(wallWidth: number, wallHeight: number, archWidth: number, straight: number, archX: number): Shape {
  const shape = new Shape();
  shape.moveTo(-wallWidth / 2, 0);
  shape.lineTo(wallWidth / 2, 0);
  shape.lineTo(wallWidth / 2, wallHeight);
  shape.lineTo(-wallWidth / 2, wallHeight);
  shape.lineTo(-wallWidth / 2, 0);
  shape.holes.push(archHole(archWidth, straight, archX));
  return shape;
}

/** An arch-shaped frame: the outer arch with a smaller arch cut out of it. */
export function archRing(outerWidth: number, outerStraight: number, innerWidth: number, innerStraight: number): Shape {
  const shape = archShape(outerWidth, outerStraight);
  shape.holes.push(archHole(innerWidth, innerStraight));
  return shape;
}

/**
 * One half of a sliding screen filling an arch opening. `side` -1 is the left leaf, +1 the right; `gap` is
 * half the width of the opening left between the two leaves when closed.
 */
export function archLeaf(width: number, straight: number, gap: number, side: -1 | 1): Shape {
  const r = width / 2;
  // Where the inner edge meets the curve of the arch.
  const theta = Math.acos(-gap / r); // angle on the left half, in (π/2, π)
  const shape = new Shape();
  if (side === -1) {
    shape.moveTo(-r, 0);
    shape.lineTo(-gap, 0);
    shape.lineTo(-gap, straight + r * Math.sin(theta));
    shape.absarc(0, straight, r, theta, Math.PI, false);
    shape.lineTo(-r, 0);
  } else {
    shape.moveTo(gap, 0);
    shape.lineTo(r, 0);
    shape.lineTo(r, straight);
    shape.absarc(0, straight, r, 0, Math.PI - theta, false);
    shape.lineTo(gap, 0);
  }
  return shape;
}
