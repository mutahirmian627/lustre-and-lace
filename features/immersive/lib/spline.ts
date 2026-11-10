/**
 * Smooth one-dimensional interpolation through a few keys (a Catmull-Rom spline with the slope at each key taken
 * from its neighbours, and level ends). Used to blend the camera's framing from one arch to the next, so offsets,
 * heights and lenses glide rather than step.
 */
export function makeSpline(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  const slope = ys.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    return (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * slope[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * slope[i + 1]
    );
  };
}
