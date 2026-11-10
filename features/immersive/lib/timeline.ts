/**
 * The numbers that say where things are along the scroll, with no 3D in them, so the page's scroll listener
 * can use them without pulling the 3D library into the first load. (The 3D side, lib/world.ts, builds its
 * curves from the same numbers.)
 */

/**
 * How tall the scroll run is, in screens: the opening (gallery to hall), then the services and the close.
 * Both the page's CSS height and the scroll maths read these, so they can't disagree.
 */
export const RUN = { opening: 2.3, services: 4.9 } as const;

/** Of the services run, the part that is the seven bays; the rest is the close, where the camera comes to rest. */
export const SERVICES_END = 0.88;

export const SERVICE_COUNT = 7;

/** Distance between the hall's ribs, and where the camera's route down the hall begins and ends (z, in metres). */
export const RIB_EVERY = 4;
export const HALL_ROUTE = { from: -14.4, to: -46 } as const;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Services run progress (0..1) -> how far down the hall route the camera is (0..1, by distance). */
export function hallJourney(s: number): number {
  if (s <= 0) return 0;
  if (s <= SERVICES_END) return (s / SERVICES_END) * 0.87;
  return 0.87 + ((Math.min(s, 1) - SERVICES_END) / (1 - SERVICES_END)) * 0.13;
}

/**
 * Which service is on show: the camera passes one rib per service. The first rib it reaches after the
 * opening is at z = -17 and they are 4 m apart, so the count of ribs passed is the service number.
 * (The route runs straight down the hall, so distance along it is distance in z.)
 */
export function serviceIndexAt(s: number): number {
  const z = HALL_ROUTE.from + (HALL_ROUTE.to - HALL_ROUTE.from) * hallJourney(s);
  const passed = Math.floor((-z - 13) / RIB_EVERY);
  return Math.min(SERVICE_COUNT - 1, Math.max(0, passed));
}
