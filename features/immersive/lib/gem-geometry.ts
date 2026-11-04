import { BufferAttribute, BufferGeometry, Vector3 } from "three";

/** Facets around the gem. Twelve reads as a cut stone; fewer looks like a toy, more costs triangles. */
const SEGMENTS = 12;

/**
 * Rings from the bottom point (the culet) up to the flat top (the table). `offset` turns a ring by a
 * fraction of one facet, so neighbouring rings are staggered. That stagger is what makes the faces
 * kite- and triangle-shaped, like a real brilliant cut, instead of a stack of identical strips.
 */
const RINGS = [
  { radius: 0, y: -1.1, offset: 0 }, // culet
  { radius: 0.46, y: -0.56, offset: 0.5 },
  { radius: 0.82, y: -0.2, offset: 0 },
  { radius: 1, y: 0, offset: 0.5 }, // girdle, the widest ring
  { radius: 0.9, y: 0.14, offset: 0 },
  { radius: 0.68, y: 0.36, offset: 0.5 },
  { radius: 0.52, y: 0.5, offset: 0 }, // edge of the table
  { radius: 0, y: 0.5, offset: 0 }, // centre of the table
] as const;

const CENTRE = new Vector3(0, -0.15, 0);

function ringPoint(ringIndex: number, segment: number): Vector3 {
  const ring = RINGS[ringIndex];
  const angle = ((segment + ring.offset) / SEGMENTS) * Math.PI * 2;
  return new Vector3(Math.sin(angle) * ring.radius, ring.y, Math.cos(angle) * ring.radius);
}

/**
 * A cut gem built from a short list of rings, so there is no model file to download.
 *
 * Every face is its own triangle with its own flat normal, which is what lets each facet catch the light
 * separately and flash as the gem turns. Sized so the girdle has radius 1, which lets the scene scale it
 * simply. About 150 triangles: tiny next to what even a low-end phone can draw.
 */
export function createGemGeometry(): BufferGeometry {
  const positions: number[] = [];

  const pushTriangle = (a: Vector3, b: Vector3, c: Vector3) => {
    // Point the face outwards from the middle of the stone, whatever order the corners came in.
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a));
    const centroid = new Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3).sub(CENTRE);
    if (normal.dot(centroid) < 0) [b, c] = [c, b];
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  for (let ring = 0; ring < RINGS.length - 1; ring++) {
    for (let segment = 0; segment < SEGMENTS; segment++) {
      const lowerLeft = ringPoint(ring, segment);
      const lowerRight = ringPoint(ring, segment + 1);
      const upperLeft = ringPoint(ring + 1, segment);
      const upperRight = ringPoint(ring + 1, segment + 1);

      if (RINGS[ring].radius === 0) {
        pushTriangle(lowerLeft, upperRight, upperLeft); // fan out from the bottom point
      } else if (RINGS[ring + 1].radius === 0) {
        pushTriangle(lowerLeft, lowerRight, upperLeft); // fan in to the table centre
      } else {
        pushTriangle(lowerLeft, lowerRight, upperLeft);
        pushTriangle(lowerRight, upperRight, upperLeft);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals(); // un-indexed, so each triangle gets its own flat normal
  return geometry;
}
