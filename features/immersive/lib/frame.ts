import { MathUtils, type PerspectiveCamera } from "three";

/**
 * How the scene is framed for a given screen shape. The page's text sits in the left of a wide screen and
 * the lower part of a tall one, so the camera uses a *shifted lens* (the way an architectural photographer
 * does): the optical centre is moved to where the architecture should sit, and the verticals stay vertical.
 *
 * `vpx` / `vpy` are where the vanishing point lands, as a fraction of the screen from the left / the top.
 * Wider screens than the reference crop top and bottom, narrower ones crop the sides, exactly as
 * `object-fit: cover` does to the fallback pictures, so the live scene lines up with them.
 */
const FRAMES = {
  wide: { aspect: 16 / 9, vFov: 32, vpx: 0.64, vpy: 0.48 },
  tall: { aspect: 0.5, vFov: 40, vpx: 0.5, vpy: 0.4 },
} as const;

export function frameFor(aspect: number) {
  const reference = aspect >= 0.85 ? FRAMES.wide : FRAMES.tall;
  let vFov: number = reference.vFov;
  if (aspect > reference.aspect) {
    const hFov = 2 * Math.atan(Math.tan(MathUtils.degToRad(vFov) / 2) * reference.aspect);
    vFov = MathUtils.radToDeg(2 * Math.atan(Math.tan(hFov / 2) / aspect));
  }
  return { fov: vFov, vpx: reference.vpx, vpy: reference.vpy };
}

/** Applies the framing to a camera: field of view, then the lens shift on top of the usual projection. */
export function applyFrame(camera: PerspectiveCamera, width: number, height: number) {
  const aspect = width / height;
  const frame = frameFor(aspect);
  camera.fov = frame.fov;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[8] = -(frame.vpx * 2 - 1);
  camera.projectionMatrix.elements[9] = -(1 - frame.vpy * 2);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

