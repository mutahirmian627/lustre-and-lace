import {
  BackSide,
  Color,
  CubeTexture,
  DoubleSide,
  MeshPhongMaterial,
  MixOperation,
  type Texture,
} from "three";
import { mix, onNight } from "@/features/immersive/lib/night";

/**
 * The four materials. They are the whole visual vocabulary of the installation; nothing else is allowed in.
 *
 *   mirror chrome   the ribbon, and hairline inlays. Almost pure reflection.
 *   frosted glass   the lattice screen. Milky bars with clear gaps, lit from within.
 *   ivory ceramic   the gallery and the arches. Glazed: a broad soft sheen; the floor is tiled.
 *   plum lacquer    the hall. Deep colour under a hard, glossy reflection.
 *
 * All are Phong materials reading the same painted reflection cube. (The more physically-based materials
 * need a reflection map prepared on the graphics card, which is the step that froze the page; for these
 * four surfaces the difference is not worth the freeze.)
 */
export interface Materials {
  chrome: MeshPhongMaterial;
  ceramic: MeshPhongMaterial;
  lacquer: MeshPhongMaterial;
  /** The same lacquer, seen from the inside (the hall is a tunnel we stand in). */
  lacquerInside: MeshPhongMaterial;
  glass: MeshPhongMaterial;
  /** A second, fainter glass layer for the back of the screen: two lattices a hand apart move against each other. */
  glassBack: MeshPhongMaterial;
}

export function createMaterials(env: CubeTexture, chromeEnv: CubeTexture, jaliMask: Texture, lite: boolean): Materials {
  const reflective = { envMap: env, combine: MixOperation } as const;

  const chrome = new MeshPhongMaterial({
    color: 0x14101a,
    specular: 0xffffff,
    shininess: 400,
    reflectivity: 0.96,
    side: DoubleSide,
    fog: false,
    envMap: chromeEnv,
    combine: MixOperation,
  });

  const ceramic = new MeshPhongMaterial({
    color: 0xefebe3,
    specular: 0x8f8a84,
    shininess: 52,
    reflectivity: 0.07,
    ...reflective,
  });

  const lacquer = new MeshPhongMaterial({
    color: 0x24102b,
    specular: 0xf3d6ff,
    shininess: 170,
    reflectivity: 0.13,
    ...reflective,
  });
  const lacquerInside = lacquer.clone();
  lacquerInside.side = BackSide;
  lacquerInside.fog = false; // the hall is its own light-world: it must not be washed towards the gallery's ivory

  const glassBase = {
    color: 0xe8e1f4,
    emissive: 0x4a3a66,
    specular: 0xffffff,
    shininess: 90,
    alphaMap: jaliMask,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    reflectivity: 0.34,
    ...reflective,
  } as const;
  const glass = new MeshPhongMaterial({ ...glassBase, opacity: 0.86 });
  const glassBack = new MeshPhongMaterial({ ...glassBase, opacity: lite ? 0 : 0.5, visible: !lite });

  return { chrome, ceramic, lacquer, lacquerInside, glass, glassBack };
}

const LACQUER_SPECULAR_DAY = new Color(0xf3d6ff);
const LACQUER_SPECULAR_NIGHT = new Color(0xffd9a0);
const CERAMIC_SPECULAR_DAY = new Color(0x8f8a84);
const CERAMIC_SPECULAR_NIGHT = new Color(0xb89868);

/**
 * How the shared materials change after dark. They are the same materials (nothing is swapped or recompiled): the lacquer
 * and the glaze are a little more reflective, so the lamps and the gold strips show in them, and their highlights turn
 * from lilac and grey to gold. Each is computed from the daytime constants above, so at daylight they are exactly as made.
 * Returns the function that stops following the change.
 */
export function followNightMaterials(materials: Materials): () => void {
  return onNight((c) => {
    const lit = c.reflections;
    materials.lacquer.reflectivity = materials.lacquerInside.reflectivity = mix(0.13, 0.26, lit);
    materials.lacquer.specular.copy(LACQUER_SPECULAR_DAY).lerp(LACQUER_SPECULAR_NIGHT, lit);
    materials.lacquerInside.specular.copy(materials.lacquer.specular);
    materials.ceramic.reflectivity = mix(0.07, 0.14, lit);
    materials.ceramic.specular.copy(CERAMIC_SPECULAR_DAY).lerp(CERAMIC_SPECULAR_NIGHT, lit);
  });
}
